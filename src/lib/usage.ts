import { createClient } from "@supabase/supabase-js";
import { planCredits, type PlanId } from "./plans";

export type UsageKind = "analyze" | "hooks" | "script";

export function getServerSupabase(accessToken: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  );
}

export type UserProfile = {
  user_id: string;
  niche: string | null;
  style: string | null;
  plan: PlanId;
};

export async function getProfile(
  userId: string,
  accessToken: string
): Promise<UserProfile> {
  const supabase = getServerSupabase(accessToken);
  const { data } = await supabase
    .from("profiles")
    .select("user_id, niche, style, plan")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    (data as UserProfile | null) ?? {
      user_id: userId,
      niche: null,
      style: null,
      plan: "free",
    }
  );
}

export async function countMonthlyUsage(
  userId: string,
  accessToken: string
): Promise<number> {
  const supabase = getServerSupabase(accessToken);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabase
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);

  if (error) throw error;
  return count ?? 0;
}

export type QuotaCheck = {
  allowed: boolean;
  plan: PlanId;
  used: number;
  limit: number | null; // null = ilimitado
  remaining: number | null;
};

export async function checkQuota(
  userId: string,
  accessToken: string
): Promise<QuotaCheck> {
  const profile = await getProfile(userId, accessToken);
  const limit = planCredits(profile.plan);

  if (limit === null) {
    return { allowed: true, plan: profile.plan, used: 0, limit: null, remaining: null };
  }

  const used = await countMonthlyUsage(userId, accessToken);
  return {
    allowed: used < limit,
    plan: profile.plan,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function recordUsage(
  userId: string,
  accessToken: string,
  kind: UsageKind
): Promise<void> {
  const supabase = getServerSupabase(accessToken);
  const { error } = await supabase
    .from("usage_events")
    .insert({ user_id: userId, kind });
  if (error) console.error("Erro ao registrar uso:", error);
}

export function quotaExceededMessage(quota: QuotaCheck): string {
  if (quota.plan === "free") {
    return "Você atingiu o limite de 3 análises gratuitas este mês. Faça upgrade para continuar.";
  }
  return `Você atingiu o limite de ${quota.limit} análises do seu plano este mês.`;
}
