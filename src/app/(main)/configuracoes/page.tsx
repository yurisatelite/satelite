'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabase } from '@/lib/supabase'
import { PLANS, type PlanId } from '@/lib/plans'

const C = {
  bgSecondary: '#111116',
  card: '#2A2A2A',
  blue: '#004AAD',
  gold: '#F5C16C',
  lavender: '#CBC6E6',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
} as const

export default function ConfiguracoesPage() {
  const [supabase] = useState(() => getSupabase())
  const [niche, setNiche] = useState('')
  const [style, setStyle] = useState('')
  const [plan, setPlan] = useState<PlanId>('free')
  const [used, setUsed] = useState(0)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [upgraded, setUpgraded] = useState(false)

  useEffect(() => {
    setUpgraded(
      typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('upgrade') === 'sucesso'
    )
  }, [])

  useEffect(() => {
    if (!supabase) return
    async function load() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('niche, style, plan')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        setNiche(profile.niche ?? '')
        setStyle(profile.style ?? '')
        setPlan((profile.plan as PlanId) ?? 'free')
      }

      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString()
      const { count } = await supabase
        .from('usage_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth)
      setUsed(count ?? 0)
      setLoading(false)
    }
    load()
  }, [supabase])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setSaving(true)
    setMessage('')
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error: upsertError } = await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        niche: niche.trim(),
        style: style.trim(),
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      setError('Erro ao salvar. Tente novamente.')
    } else {
      setMessage('Configurações salvas. Serão usadas automaticamente em todas as análises.')
    }
    setSaving(false)
  }

  const planInfo = PLANS[plan]
  const limit = planInfo.monthlyCredits
  const remaining = limit === null ? null : Math.max(0, limit - used)

  function inputStyle(field: string) {
    const focused = focusedField === field
    return {
      width: '100%',
      background: 'rgba(8,13,27,0.55)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${focused ? 'rgba(46,111,216,0.7)' : 'rgba(148,163,199,0.16)'}`,
      boxShadow: focused
        ? '0 0 0 3px rgba(0,74,173,0.22), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '12px 16px',
      color: C.text,
      fontFamily: 'var(--font-inter)',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    } as const
  }

  return (
    <div style={{ padding: '48px', maxWidth: '640px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: 'clamp(26px, 3.5vw, 40px)',
          fontWeight: 700,
          color: C.text,
          margin: '0 0 8px',
          letterSpacing: '0.06em',
        }}
      >
        Configurações
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-playfair)',
          fontStyle: 'italic',
          color: C.lavender,
          fontSize: '16px',
          margin: '0 0 40px',
        }}
      >
        Seu nicho e estilo, aplicados em todas as análises
      </p>

      {upgraded && (
        <div
          style={{
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.35)',
            borderRadius: '10px',
            padding: '14px 18px',
            marginBottom: '28px',
          }}
        >
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#4ADE80', margin: 0 }}>
            Pagamento confirmado! Seu plano será ativado em instantes — atualize a página se necessário.
          </p>
        </div>
      )}

      {/* Plano atual */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                fontWeight: 700,
                color: C.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                margin: '0 0 6px',
              }}
            >
              Plano atual
            </p>
            <p
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '20px',
                fontWeight: 700,
                color: C.text,
                margin: 0,
                letterSpacing: '0.05em',
              }}
            >
              {planInfo.name}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '10px',
                fontWeight: 700,
                color: C.gold,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                margin: '0 0 6px',
              }}
            >
              Análises este mês
            </p>
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '18px', fontWeight: 600, color: C.text, margin: 0 }}>
              {loading ? '...' : limit === null ? `${used} · ilimitado` : `${used} de ${limit}`}
            </p>
            {!loading && remaining !== null && (
              <p style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: remaining === 0 ? '#F87171' : C.muted, margin: '2px 0 0' }}>
                {remaining === 0 ? 'Limite atingido' : `${remaining} restantes`}
              </p>
            )}
          </div>
        </div>
        {plan === 'free' && (
          <Link
            href="/precos"
            style={{
              display: 'inline-block',
              marginTop: '18px',
              padding: '10px 22px',
              background: C.blue,
              color: C.text,
              borderRadius: '8px',
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Fazer upgrade
          </Link>
        )}
      </div>

      {/* Perfil de criador */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              color: C.muted,
            }}
          >
            Seu nicho permanente
          </label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            onFocus={() => setFocusedField('niche')}
            onBlur={() => setFocusedField(null)}
            placeholder="Ex: iluminação para criadores de conteúdo"
            style={inputStyle('niche')}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              marginBottom: '8px',
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              color: C.muted,
            }}
          >
            Seu estilo de comunicação
          </label>
          <textarea
            rows={3}
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            onFocus={() => setFocusedField('style')}
            onBlur={() => setFocusedField(null)}
            placeholder="Ex: 50% técnico, 50% didático. Racional e provocativo, sem clickbait vazio."
            style={{ ...inputStyle('style'), resize: 'vertical', lineHeight: '1.6' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-primary"
            style={{
              padding: '13px 32px',
              color: C.text,
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
          {message && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#4ADE80', margin: 0 }}>
              {message}
            </p>
          )}
          {error && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: 0 }}>
              {error}
            </p>
          )}
        </div>
      </form>
    </div>
  )
}
