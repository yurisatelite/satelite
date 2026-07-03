'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { PLANS, type PlanId } from '@/lib/plans'

const C = {
  bgPrimary: '#0A0A0A',
  bgSecondary: '#111116',
  card: '#2A2A2A',
  blue: '#004AAD',
  gold: '#F5C16C',
  lavender: '#CBC6E6',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
} as const

const valueProps = [
  {
    title: 'Analise o que funciona',
    description:
      'Cole qualquer vídeo de referência e receba a engenharia reversa completa: tipo de gancho, estrutura narrativa e por que ele viralizou.',
  },
  {
    title: 'Roteirize com a sua voz',
    description:
      'O Satélite reconstrói vídeos de referência adaptados ao seu nicho e estilo — gancho, desenvolvimento, fechamento e CTA prontos para gravar.',
  },
  {
    title: 'Nunca fique sem ideia',
    description:
      'Pesquise criadores por nicho, monte sua watchlist e gere 10 variações de gancho para qualquer tema em segundos.',
  },
]

export default function PrecosPage() {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null)
  const [error, setError] = useState('')

  async function handleSubscribe(planId: PlanId) {
    setError('')
    const supabase = getSupabase()
    if (!supabase) {
      router.push('/login')
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setLoadingPlan(planId)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha ao iniciar pagamento.')
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
      setLoadingPlan(null)
    }
  }

  const paidPlans = [PLANS.criador, PLANS.pro]

  return (
    <div style={{ minHeight: '100vh', background: C.bgPrimary }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 48px',
          borderBottom: `1px solid ${C.bgSecondary}`,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: '18px',
            fontWeight: 700,
            color: C.gold,
            letterSpacing: '0.12em',
          }}
        >
          SATÉLITE
        </span>
        <Link
          href="/login"
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            color: C.muted,
            textDecoration: 'none',
          }}
        >
          Entrar
        </Link>
      </header>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '90px 24px 70px', maxWidth: '760px', margin: '0 auto' }}>
        <h1
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: 'clamp(30px, 5vw, 52px)',
            fontWeight: 700,
            color: C.text,
            letterSpacing: '0.05em',
            margin: '0 0 20px',
            lineHeight: 1.2,
          }}
        >
          Inteligência estratégica para criadores de conteúdo
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-playfair)',
            fontStyle: 'italic',
            fontSize: '19px',
            color: C.lavender,
            margin: '0 0 40px',
            lineHeight: 1.5,
          }}
        >
          Desmonte os vídeos que viralizam, reconstrua com a sua voz
          e publique com estratégia — tudo em português, tudo com IA.
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            padding: '15px 40px',
            background: C.blue,
            color: C.text,
            borderRadius: '10px',
            fontFamily: 'var(--font-inter)',
            fontSize: '15px',
            fontWeight: 600,
            textDecoration: 'none',
            letterSpacing: '0.03em',
          }}
        >
          Começar grátis — 3 análises por mês
        </Link>
      </section>

      {/* Value props */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          maxWidth: '980px',
          margin: '0 auto',
          padding: '0 24px 80px',
        }}
      >
        {valueProps.map((prop) => (
          <div
            key={prop.title}
            style={{
              background: C.bgSecondary,
              border: `1px solid ${C.card}`,
              borderRadius: '14px',
              padding: '28px',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '15px',
                fontWeight: 600,
                color: C.gold,
                letterSpacing: '0.05em',
                margin: '0 0 12px',
              }}
            >
              {prop.title}
            </h3>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '13px',
                color: C.muted,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {prop.description}
            </p>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: '820px', margin: '0 auto', padding: '0 24px 100px' }}>
        <h2
          style={{
            fontFamily: 'var(--font-cinzel)',
            fontSize: '26px',
            fontWeight: 700,
            color: C.text,
            letterSpacing: '0.06em',
            textAlign: 'center',
            margin: '0 0 12px',
          }}
        >
          Planos
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            color: C.muted,
            textAlign: 'center',
            margin: '0 0 44px',
          }}
        >
          Comece grátis. Faça upgrade quando o conteúdo virar máquina.
        </p>

        {error && (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              color: '#F87171',
              textAlign: 'center',
              margin: '0 0 24px',
            }}
          >
            {error}
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {paidPlans.map((plan) => {
            const highlighted = plan.id === 'pro'
            return (
              <div
                key={plan.id}
                style={{
                  background: C.bgSecondary,
                  border: `1px solid ${highlighted ? C.gold : C.card}`,
                  borderRadius: '16px',
                  padding: '36px 32px',
                  position: 'relative',
                }}
              >
                {highlighted && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: C.gold,
                      color: '#0A0A0A',
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 14px',
                      borderRadius: '20px',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Mais completo
                  </span>
                )}
                <h3
                  style={{
                    fontFamily: 'var(--font-cinzel)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: highlighted ? C.gold : C.text,
                    letterSpacing: '0.08em',
                    margin: '0 0 8px',
                  }}
                >
                  {plan.name}
                </h3>
                <p style={{ margin: '0 0 24px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '38px',
                      fontWeight: 700,
                      color: C.text,
                    }}
                  >
                    R${plan.priceMonthly}
                  </span>
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.muted }}>
                    /mês
                  </span>
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 30px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '11px',
                  }}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '13px',
                        color: C.text,
                        display: 'flex',
                        gap: '10px',
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ color: C.gold }}>✦</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: highlighted ? C.gold : C.blue,
                    color: highlighted ? '#0A0A0A' : C.text,
                    border: 'none',
                    borderRadius: '10px',
                    fontFamily: 'var(--font-inter)',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: loadingPlan ? 'not-allowed' : 'pointer',
                    opacity: loadingPlan && loadingPlan !== plan.id ? 0.6 : 1,
                    letterSpacing: '0.03em',
                  }}
                >
                  {loadingPlan === plan.id ? 'Redirecionando...' : `Assinar ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        <p
          style={{
            fontFamily: 'var(--font-inter)',
            fontSize: '13px',
            color: C.dim,
            textAlign: 'center',
            margin: '36px 0 0',
          }}
        >
          Sem fidelidade. Cancele quando quiser.{' '}
          <Link href="/login" style={{ color: C.gold, textDecoration: 'none' }}>
            Ou comece grátis com 3 análises por mês.
          </Link>
        </p>
      </section>

      <footer
        style={{
          borderTop: `1px solid ${C.bgSecondary}`,
          padding: '28px 48px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.dim, margin: 0 }}>
          SATÉLITE · Inteligência estratégica para criadores brasileiros · powered by Claude
        </p>
      </footer>
    </div>
  )
}
