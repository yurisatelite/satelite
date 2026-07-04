'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

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

type Creator = {
  name: string
  handle: string
  platform: string
  reason: string
  content_style: string
}

type WatchlistItem = {
  id: string
  creator_name: string
  handle: string | null
  platform: string | null
  niche: string
  reason: string | null
}

const platformLabels: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

export default function PesquisaPage() {
  const [supabase] = useState(() => getSupabase())
  const [niche, setNiche] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creators, setCreators] = useState<Creator[]>([])
  const [searchedNiche, setSearchedNiche] = useState('')
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [savingName, setSavingName] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('watchlist')
      .select('id, creator_name, handle, platform, niche, reason')
      .order('created_at', { ascending: false })
      .then(({ data }) => setWatchlist((data as WatchlistItem[]) ?? []))
  }, [supabase])

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCreators([])

    try {
      const response = await fetch('/api/niche-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha na pesquisa.')
      setCreators(data.creators ?? [])
      setSearchedNiche(niche)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function addToWatchlist(creator: Creator) {
    if (!supabase) return
    setSavingName(creator.name)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        creator_name: creator.name,
        handle: creator.handle,
        platform: creator.platform,
        niche: searchedNiche,
        reason: creator.reason,
      })
      .select('id, creator_name, handle, platform, niche, reason')
      .single()

    if (!insertError && data) {
      setWatchlist((prev) => [data as WatchlistItem, ...prev])
    }
    setSavingName(null)
  }

  async function removeFromWatchlist(id: string) {
    if (!supabase) return
    setWatchlist((prev) => prev.filter((w) => w.id !== id))
    await supabase.from('watchlist').delete().eq('id', id)
  }

  const inWatchlist = (creator: Creator) =>
    watchlist.some(
      (w) =>
        w.creator_name.toLowerCase() === creator.name.toLowerCase() &&
        (w.platform ?? '').toLowerCase() === creator.platform.toLowerCase()
    )

  return (
    <div style={{ padding: '48px', maxWidth: '900px' }}>
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
        Pesquisa de Nicho
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
        Descubra criadores de referência para estudar
      </p>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '36px' }}>
        <input
          required
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ex: finanças, fitness, negócios, iluminação..."
          style={{
            flex: 1,
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
          }}
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            padding: '12px 28px',
            color: C.text,
            borderRadius: '12px',
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Pesquisando...' : 'Pesquisar'}
        </button>
      </form>

      {error && (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171' }}>
          {error}
        </p>
      )}

      {creators.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '15px',
              fontWeight: 600,
              color: C.gold,
              letterSpacing: '0.06em',
              margin: '0 0 16px',
            }}
          >
            Criadores sugeridos — {searchedNiche}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {creators.map((creator) => {
              const saved = inWatchlist(creator)
              return (
                <div
                  key={`${creator.name}-${creator.platform}`}
                  className="glass-card glass-card--hover fade-up"
                  style={{
                    padding: '18px 22px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', fontWeight: 600, color: C.text }}>
                        {creator.name}
                      </span>
                      <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted }}>
                        {creator.handle}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-inter)',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: C.gold,
                          background: 'rgba(245,193,108,0.12)',
                          padding: '2px 10px',
                          borderRadius: '20px',
                        }}
                      >
                        {platformLabels[creator.platform?.toLowerCase()] ?? creator.platform}
                      </span>
                    </div>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
                      {creator.reason}
                      {creator.content_style ? ` · ${creator.content_style}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => addToWatchlist(creator)}
                    disabled={saved || savingName === creator.name}
                    style={{
                      flexShrink: 0,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: `1px solid ${saved ? C.card : C.gold}`,
                      background: 'transparent',
                      color: saved ? C.dim : C.gold,
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: saved ? 'default' : 'pointer',
                    }}
                  >
                    {saved ? 'Na watchlist' : savingName === creator.name ? 'Salvando...' : '+ Watchlist'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <h2
        style={{
          fontFamily: 'var(--font-cinzel)',
          fontSize: '15px',
          fontWeight: 600,
          color: C.gold,
          letterSpacing: '0.06em',
          margin: '0 0 16px',
        }}
      >
        Minha Watchlist
      </h2>
      {watchlist.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: C.muted }}>
          Nenhum criador salvo ainda. Pesquise um nicho e adicione criadores para acompanhar.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {watchlist.map((item) => (
            <div
              key={item.id}
              className="glass-card"
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', fontWeight: 600, color: C.text }}>
                  {item.creator_name}
                </span>
                {item.handle && (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted }}>
                    {item.handle}
                  </span>
                )}
                {item.platform && (
                  <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: C.gold }}>
                    {platformLabels[item.platform.toLowerCase()] ?? item.platform}
                  </span>
                )}
                <span style={{ fontFamily: 'var(--font-inter)', fontSize: '11px', color: C.dim }}>
                  {item.niche}
                </span>
              </div>
              <button
                onClick={() => removeFromWatchlist(item.id)}
                style={{
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  color: C.dim,
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
