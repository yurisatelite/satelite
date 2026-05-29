'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  bg: '#0A0A0A',
  card: '#111116',
  cardBorder: '#2A2A2A',
  gold: '#F5C16C',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
} as const

type Analysis = {
  id: string
  platform: string
  niche: string
  style: string
  result: {
    analysis?: { hook_type?: string }
    script?: { hook?: string }
  }
  created_at: string
}

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

export default function HistoricoPage() {
  const router = useRouter()
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        .select('id, platform, niche, style, result, created_at')
        .order('created_at', { ascending: false })

      if (fetchError) {
        setError('Erro ao carregar histórico.')
      } else {
        setAnalyses((data as Analysis[]) ?? [])
      }
      setLoading(false)
    }

    fetchAnalyses()
  }, [router])

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
        Histórico
      </h1>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          color: C.muted,
          margin: '0 0 32px',
        }}
      >
        Suas análises anteriores
      </p>

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

      {!loading && !error && analyses.length === 0 && (
        <p style={{ color: C.muted, fontFamily: 'var(--font-inter)', fontSize: '14px' }}>
          Nenhuma análise encontrada. Volte à tela principal para criar uma.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {analyses.map((a) => {
          const hook = a.result?.script?.hook || a.result?.analysis?.hook_type || '—'
          const platformLabel =
            platformLabels[a.platform?.toLowerCase()] || a.platform || '—'

          return (
            <div
              key={a.id}
              style={{
                background: C.card,
                border: `1px solid ${C.cardBorder}`,
                borderRadius: '12px',
                padding: '20px 24px',
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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: C.muted,
                    }}
                  >
                    {a.niche}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    color: C.dim,
                  }}
                >
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
                  maxHeight: '2.8em',
                }}
              >
                {hook}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
