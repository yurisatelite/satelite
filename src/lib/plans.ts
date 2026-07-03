// Definições de plano compartilhadas entre client e server.

export type PlanId = "free" | "criador" | "pro";

export type Plan = {
  id: PlanId;
  name: string;
  priceMonthly: number | null; // em reais; null = gratuito
  monthlyCredits: number | null; // null = ilimitado
  features: string[];
};

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Gratuito",
    priceMonthly: null,
    monthlyCredits: 3,
    features: [
      "3 análises por mês",
      "Análise estratégica com IA",
      "Histórico de análises",
    ],
  },
  criador: {
    id: "criador",
    name: "Criador",
    priceMonthly: 297,
    monthlyCredits: 100,
    features: [
      "100 análises por mês",
      "Pesquisa de canais por nicho",
      "Banco de vídeos com filtros",
      "Gerador de ganchos",
      "Roteirizador completo",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 500,
    monthlyCredits: null,
    features: [
      "Análises ilimitadas",
      "Tudo do plano Criador",
      "Watchlist ilimitada",
      "Prioridade em novas funcionalidades",
      "Suporte direto",
    ],
  },
};

export function planCredits(plan: PlanId): number | null {
  return PLANS[plan]?.monthlyCredits ?? PLANS.free.monthlyCredits;
}

export function isPaidPlan(plan: PlanId): boolean {
  return plan === "criador" || plan === "pro";
}
