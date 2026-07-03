import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";

// Escreve o plano com service role (bypassa RLS) — nunca exponha essa chave no client.
function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não foi definida no ambiente.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function setPlan(
  userId: string,
  plan: PlanId,
  extra: Record<string, unknown> = {}
) {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      plan,
      updated_at: new Date().toISOString(),
      ...extra,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET não configurada." },
      { status: 503 }
    );
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature") ?? "";
    event = await getStripe().webhooks.constructEventAsync(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Assinatura de webhook inválida:", error);
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as PlanId | undefined;
        if (userId && (plan === "criador" || plan === "pro")) {
          await setPlan(userId, plan, {
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            stripe_subscription_id:
              typeof session.subscription === "string" ? session.subscription : null,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        const plan = subscription.metadata?.plan as PlanId | undefined;
        if (!userId) break;

        const active =
          subscription.status === "active" || subscription.status === "trialing";
        if (active && (plan === "criador" || plan === "pro")) {
          const renewsAt = subscription.items.data[0]?.current_period_end;
          await setPlan(userId, plan, {
            stripe_subscription_id: subscription.id,
            plan_renews_at: renewsAt
              ? new Date(renewsAt * 1000).toISOString()
              : null,
          });
        } else if (
          subscription.status === "canceled" ||
          subscription.status === "unpaid" ||
          subscription.status === "incomplete_expired"
        ) {
          await setPlan(userId, "free", {
            stripe_subscription_id: null,
            plan_renews_at: null,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await setPlan(userId, "free", {
            stripe_subscription_id: null,
            plan_renews_at: null,
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
