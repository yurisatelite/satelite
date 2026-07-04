'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

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

type Hook = {
  text: string
  type: string
  rationale: string
}

type SavedHook = {
  id: string
  hook_text: string
  hook_type: string
}

const typeColors: Record<string, string> = {
  'contradição': '#F5C16C',
  'dado chocante': '#F87171',
  'pergunta': '#CBC6E6',
  'confissão': '#4ADE80',
}

export default function GanchosPage() {
  const [supabase] = useState(() => getSupabase())
  const [content, setContent] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hooks, setHooks] = useState<Hook[]>([])
  const [saved, setSaved] = useState<SavedHook[]>([])
  const [savingText, setSavingText] = useState<string | null>(null)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('saved_hooks')
      .select('id, hook_text, hook_type')
      .order('created_at', { ascending: false })
      .then(({ data }) => setSaved((data as SavedHook[]) ?? []))
  }, [supabase])

  async function handleGenerate(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setHooks([])
    setShowSaved(false)

    try {
      const response = await fetch('/api/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha ao gerar ganchos.')
      setHooks(data.hooks ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function saveHook(hook: Hook) {
    if (!supabase) return
    setSavingText(hook.text)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error: insertError } = await supabase
      .from('saved_hooks')
      .insert({
        user_id: user.id,
        hook_text: hook.text,
        hook_type: hook.type,
        source: content.slice(0, 200),
      })
      .select('id, hook_text, hook_type')
      .single()

    if (!insertError && data) {
      setSaved((prev) => [data as SavedHook, ...prev])
    }
    setSavingText(null)
  }

  async function removeSaved(id: string) {
    if (!supabase) return
    setSaved((prev) => prev.filter((h) => h.id !== id))
    await supabase.from('saved_hooks').delete().eq('id', id)
  }

  const isSaved = (hook: Hook) => saved.some((s) => s.hook_text === hook.text)

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
        Gerador de Ganchos
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
        10 variações de gancho a partir de um vídeo ou tema
      </p>

      <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
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
            Transcrição, roteiro ou tema do vídeo
          </label>
          <textarea
            required
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Cole a transcrição de um vídeo analisado ou descreva o tema do seu próximo vídeo..."
            style={{
              width: '100%',
              background: 'rgba(8,13,27,0.55)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${focused ? 'rgba(46,111,216,0.7)' : 'rgba(148,163,199,0.16)'}`,
              boxShadow: focused
                ? '0 0 0 3px rgba(0,74,173,0.22), inset 0 1px 0 rgba(255,255,255,0.05)'
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '14px 16px',
              color: C.text,
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              lineHeight: '1.6',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              padding: '13px 32px',
              color: C.text,
              borderRadius: '12px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Gerando...' : 'Gerar 10 Ganchos'}
          </button>
          <button
            type="button"
            onClick={() => setShowSaved((v) => !v)}
            className="glass-chip"
            style={{
              padding: '13px 20px',
              color: showSaved ? C.gold : C.muted,
              borderColor: showSaved ? 'rgba(245,193,108,0.5)' : undefined,
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Favoritos ({saved.length})
          </button>
        </div>
        {error && (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: 0 }}>
            {error}
          </p>
        )}
      </form>

      {showSaved && (
        <div style={{ marginBottom: '36px' }}>
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
            Ganchos Favoritos
          </h2>
          {saved.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: C.muted }}>
              Nenhum gancho salvo ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {saved.map((h) => (
                <div
                  key={h.id}
                  className="glass-card"
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-inter)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: typeColors[h.hook_type?.toLowerCase()] ?? C.gold,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      {h.hook_type}
                    </span>
                    <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: C.text, margin: '4px 0 0', lineHeight: 1.5 }}>
                      {h.hook_text}
                    </p>
                  </div>
                  <button
                    onClick={() => removeSaved(h.id)}
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
      )}

      {hooks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {hooks.map((hook, i) => {
            const alreadySaved = isSaved(hook)
            return (
              <div
                key={i}
                className="glass-card glass-card--hover fade-up"
                style={{
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: typeColors[hook.type?.toLowerCase()] ?? C.gold,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {hook.type}
                  </span>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '14px', color: C.text, margin: '6px 0 6px', lineHeight: 1.55, fontWeight: 500 }}>
                    {hook.text}
                  </p>
                  <p style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted, margin: 0, lineHeight: 1.5 }}>
                    {hook.rationale}
                  </p>
                </div>
                <button
                  onClick={() => saveHook(hook)}
                  disabled={alreadySaved || savingText === hook.text}
                  style={{
                    flexShrink: 0,
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: `1px solid ${alreadySaved ? C.card : C.gold}`,
                    background: 'transparent',
                    color: alreadySaved ? C.dim : C.gold,
                    fontFamily: 'var(--font-inter)',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: alreadySaved ? 'default' : 'pointer',
                  }}
                >
                  {alreadySaved ? 'Salvo' : savingText === hook.text ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
