import { NextResponse, type NextRequest } from "next/server";
import { extractAuth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PLANS, type PlanId } from "@/lib/plans";

type CheckoutBody = { plan?: string };

export async function POST(request: NextRequest) {
  try {
    const auth = extractAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Faça login para assinar um plano." },
        { status: 401 }
      );
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error:
            "Pagamentos ainda não estão ativos. Configure STRIPE_SECRET_KEY no Railway.",
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as CheckoutBody;
    const planId = body.plan as PlanId;
    const plan = PLANS[planId];

    if (!plan || plan.priceMonthly === null) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://satelite-production.up.railway.app";

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: auth.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: plan.priceMonthly * 100,
            recurring: { interval: "month" },
            product_data: {
              name: `Satélite — Plano ${plan.name}`,
              description: plan.features.join(" · "),
            },
          },
        },
      ],
      metadata: { user_id: auth.userId, plan: plan.id },
      subscription_data: {
        metadata: { user_id: auth.userId, plan: plan.id },
      },
      success_url: `${origin}/configuracoes?upgrade=sucesso`,
      cancel_url: `${origin}/precos`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Erro no checkout:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
