'use client'

import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  bg: '#0A0A0A',
  card: '#111116',
  cardBorder: '#2A2A2A',
  blue: '#004AAD',
  gold: '#F5C16C',
  lavender: '#CBC6E6',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
} as const

type Analysis = {
  id: string
  platform: string
  niche: string
  style: string
  input: string
  result: {
    analysis?: {
      hook_type?: string
      structure?: string
      why_it_worked?: string
      strongest_point?: string
      weakest_point?: string
    }
    script?: {
      hook?: string
      development?: string
      closing?: string
    }
  }
  created_at: string
}

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const periodOptions = [
  { id: 'all', label: 'Todo período' },
  { id: '7', label: 'Últimos 7 dias' },
  { id: '30', label: 'Últimos 30 dias' },
  { id: '90', label: 'Últimos 90 dias' },
]

function selectStyle() {
  return {
    background: C.card,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '8px',
    padding: '9px 12px',
    color: C.text,
    fontFamily: 'var(--font-inter)',
    fontSize: '13px',
    outline: 'none',
    cursor: 'pointer',
  } as const
}

function Detail({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '10px',
          fontWeight: 700,
          color: C.gold,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          margin: '0 0 4px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '13px',
          color: C.text,
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function BancoDeVideosPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [platformFilter, setPlatformFilter] = useState('all')
  const [periodFilter, setPeriodFilter] = useState('all')
  const [hookFilter, setHookFilter] = useState('all')
  const [nicheFilter, setNicheFilter] = useState('all')

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase) {
      router.push('/login')
      return
    }

    async function fetchAnalyses() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('id, platform, niche, style, input, result, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Erro ao carregar o banco de vídeos.')
      } else {
        setAnalyses((data as Analysis[]) ?? [])
      }
      setLoading(false)
    }

    fetchAnalyses()
  }, [router])

  const hookTypes = useMemo(() => {
    const set = new Set<string>()
    analyses.forEach((a) => {
      const t = a.result?.analysis?.hook_type?.trim()
      if (t) set.add(t)
    })
    return Array.from(set).sort()
  }, [analyses])

  const niches = useMemo(() => {
    const set = new Set<string>()
    analyses.forEach((a) => a.niche && set.add(a.niche.trim()))
    return Array.from(set).sort()
  }, [analyses])

  const filtered = useMemo(() => {
    return analyses.filter((a) => {
      if (platformFilter !== 'all' && a.platform?.toLowerCase() !== platformFilter) return false
      if (nicheFilter !== 'all' && a.niche?.trim() !== nicheFilter) return false
      if (hookFilter !== 'all' && a.result?.analysis?.hook_type?.trim() !== hookFilter) return false
      if (periodFilter !== 'all') {
        const days = Number(periodFilter)
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
        if (new Date(a.created_at).getTime() < cutoff) return false
      }
      return true
    })
  }, [analyses, platformFilter, periodFilter, hookFilter, nicheFilter])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div style={{ padding: '40px 32px', maxWidth: '860px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '22px',
          fontWeight: 700,
          color: C.gold,
          letterSpacing: '0.08em',
          margin: '0 0 8px',
        }}
      >
        Banco de Vídeos
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          color: C.muted,
          margin: '0 0 28px',
        }}
      >
        Todos os vídeos analisados, organizados por nicho, plataforma e tipo de gancho
      </p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} style={selectStyle()}>
          <option value="all">Todas as plataformas</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </select>
        <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} style={selectStyle()}>
          {periodOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        {hookTypes.length > 0 && (
          <select value={hookFilter} onChange={(e) => setHookFilter(e.target.value)} style={selectStyle()}>
            <option value="all">Todos os ganchos</option>
            {hookTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        {niches.length > 1 && (
          <select value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} style={selectStyle()}>
            <option value="all">Todos os nichos</option>
            {niches.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
      </div>

      {loading && (
        <p style={{ color: C.muted, fontFamily: 'var(--font-inter)', fontSize: '14px' }}>
          Carregando...
        </p>
      )}

      {error && (
        <p style={{ color: '#F87171', fontFamily: 'var(--font-inter)', fontSize: '14px' }}>
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p style={{ color: C.muted, fontFamily: 'var(--font-inter)', fontSize: '14px' }}>
          {analyses.length === 0
            ? 'Nenhum vídeo analisado ainda. Volte à tela principal para analisar o primeiro.'
            : 'Nenhum vídeo corresponde aos filtros selecionados.'}
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((a) => {
          const hook = a.result?.script?.hook || a.result?.analysis?.hook_type || '—'
          const hookType = a.result?.analysis?.hook_type
          const platformLabel =
            platformLabels[a.platform?.toLowerCase()] || a.platform || '—'
          const expanded = expandedId === a.id

          return (
            <div
              key={a.id}
              onClick={() => setExpandedId(expanded ? null : a.id)}
              style={{
                background: C.card,
                border: `1px solid ${expanded ? C.blue : C.cardBorder}`,
                borderRadius: '12px',
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: C.gold,
                      background: 'rgba(245,193,108,0.12)',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {platformLabel}
                  </span>
                  {hookType && (
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: C.lavender,
                        background: 'rgba(203,198,230,0.10)',
                        padding: '3px 10px',
                        borderRadius: '20px',
                      }}
                    >
                      {hookType}
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted }}>
                    {a.niche}
                  </span>
                </div>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.dim }}>
                  {formatDate(a.created_at)}
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                  color: C.text,
                  margin: 0,
                  lineHeight: '1.55',
                  overflow: 'hidden',
                  maxHeight: expanded ? 'none' : '2.8em',
                }}
              >
                {hook}
              </p>

              {expanded && (
                <div
                  style={{
                    marginTop: '20px',
                    paddingTop: '20px',
                    borderTop: `1px solid ${C.cardBorder}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <Detail label="Estrutura" value={a.result?.analysis?.structure} />
                  <Detail label="Por que funcionou" value={a.result?.analysis?.why_it_worked} />
                  <Detail label="Ponto mais forte" value={a.result?.analysis?.strongest_point} />
                  <Detail label="Ponto mais fraco" value={a.result?.analysis?.weakest_point} />
                  <Detail label="Desenvolvimento" value={a.result?.script?.development} />
                  <Detail label="Fechamento" value={a.result?.script?.closing} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
