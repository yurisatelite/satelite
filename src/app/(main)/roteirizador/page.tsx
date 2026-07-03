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
} as const

type Platform = 'instagram' | 'tiktok' | 'youtube'

type ScriptResponse = {
  script: {
    hook: string
    development: string
    closing: string
    cta: string
  }
  notes: {
    adapted_from: string
    voice_notes: string
    duration_estimate: string
  }
}

const platforms: { id: Platform; label: string }[] = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
]

function inputStyle(focused: boolean) {
  return {
    width: '100%',
    background: C.bgSecondary,
    border: `1px solid ${focused ? C.blue : C.card}`,
    borderRadius: '10px',
    padding: '12px 16px',
    color: C.text,
    fontFamily: 'var(--font-inter)',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  } as const
}

function Section({ label, value }: { label: string; value: string }) {
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
          margin: '0 0 6px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          color: C.text,
          lineHeight: 1.7,
          margin: 0,
          whiteSpace: 'pre-wrap',
        }}
      >
        {value}
      </p>
    </div>
  )
}

export default function RoteirizadorPage() {
  const [supabase] = useState(() => getSupabase())
  const [platform, setPlatform] = useState<Platform>('instagram')
  const [form, setForm] = useState({ reference: '', niche: '', style: '' })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ScriptResponse | null>(null)
  const [copied, setCopied] = useState(false)

  // Prefill com nicho/estilo permanentes das configurações
  useEffect(() => {
    if (!supabase) return
    async function loadProfile() {
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('niche, style')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setForm((prev) => ({
          ...prev,
          niche: prev.niche || data.niche || '',
          style: prev.style || data.style || '',
        }))
      }
    }
    loadProfile()
  }, [supabase])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, platform }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error ?? 'Falha ao gerar roteiro.')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado.')
    } finally {
      setLoading(false)
    }
  }

  async function copyScript() {
    if (!result) return
    const text = [
      `GANCHO:\n${result.script.hook}`,
      `DESENVOLVIMENTO:\n${result.script.development}`,
      `FECHAMENTO:\n${result.script.closing}`,
      `CTA:\n${result.script.cta}`,
    ].join('\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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
        Roteirizador
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
        Reconstrua qualquer vídeo de referência com a sua voz
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
        {platforms.map((p) => {
          const active = platform === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlatform(p.id)}
              style={{
                padding: '10px 22px',
                borderRadius: '8px',
                border: active ? `1px solid ${C.gold}` : `1px solid ${C.card}`,
                background: active ? C.blue : C.card,
                color: active ? C.text : C.muted,
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            Vídeo de referência (URL do YouTube ou transcrição)
          </label>
          <textarea
            required
            rows={7}
            value={form.reference}
            onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
            onFocus={() => setFocusedField('reference')}
            onBlur={() => setFocusedField(null)}
            placeholder="Cole a URL ou a transcrição do vídeo que você quer adaptar..."
            style={{
              ...inputStyle(focusedField === 'reference'),
              resize: 'vertical',
              lineHeight: '1.6',
              padding: '14px 16px',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {(
            [
              { key: 'niche' as const, label: 'Nicho', placeholder: 'Ex: iluminação, finanças...' },
              { key: 'style' as const, label: 'Seu estilo', placeholder: 'Ex: técnico e didático...' },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                  color: C.muted,
                }}
              >
                {label}
              </label>
              <input
                required
                type="text"
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
                placeholder={placeholder}
                style={inputStyle(focusedField === key)}
              />
            </div>
          ))}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '13px 32px',
              background: C.blue,
              color: C.text,
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.03em',
            }}
          >
            {loading ? 'Roteirizando...' : 'Gerar Roteiro'}
          </button>
        </div>

        {error && (
          <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: 0 }}>
            {error}
          </p>
        )}
      </form>

      {result && (
        <div
          style={{
            marginTop: '44px',
            background: C.bgSecondary,
            border: `1px solid ${C.card}`,
            borderRadius: '12px',
            padding: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-cinzel)',
                fontSize: '15px',
                fontWeight: 600,
                color: C.gold,
                letterSpacing: '0.06em',
                margin: 0,
              }}
            >
              Seu Roteiro
            </h2>
            <button
              onClick={copyScript}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${copied ? '#4ADE80' : C.gold}`,
                background: 'transparent',
                color: copied ? '#4ADE80' : C.gold,
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {copied ? 'Copiado!' : 'Copiar roteiro'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <Section label="Gancho" value={result.script.hook} />
            <Section label="Desenvolvimento" value={result.script.development} />
            <Section label="Fechamento" value={result.script.closing} />
            <Section label="CTA" value={result.script.cta} />
          </div>

          {result.notes && (
            <div
              style={{
                marginTop: '24px',
                paddingTop: '20px',
                borderTop: `1px solid ${C.card}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {[
                result.notes.adapted_from,
                result.notes.voice_notes,
                result.notes.duration_estimate,
              ]
                .filter(Boolean)
                .map((note, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: 'var(--font-inter)',
                      fontSize: '12px',
                      color: C.muted,
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    · {note}
                  </p>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
