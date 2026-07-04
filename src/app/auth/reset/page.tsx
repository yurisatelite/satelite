'use client'

import { FormEvent, useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const C = {
  bgPrimary: '#0A0A0A',
  bgSecondary: '#111116',
  card: '#2A2A2A',
  blue: '#004AAD',
  gold: '#F5C16C',
  lavender: '#CBC6E6',
  text: '#FAFAFA',
  muted: '#8A8A9A',
} as const

type Status = 'checking' | 'ready' | 'invalid'

export default function ResetPage() {
  const router = useRouter()
  const [supabase] = useState(() => getSupabase())
  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // O link de recuperação chega com o token no hash da URL;
  // o client do Supabase troca o token por sessão automaticamente.
  useEffect(() => {
    if (!supabase) {
      setStatus('invalid')
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setStatus('ready')
      }
    })

    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setStatus((prev) => (prev === 'checking' ? (session ? 'ready' : 'invalid') : prev))
    }, 2500)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [supabase])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(
        updateError.message.includes('should be different')
          ? 'A nova senha precisa ser diferente da anterior.'
          : 'Erro ao redefinir a senha. Peça um novo link e tente de novo.'
      )
      setSaving(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  function inputStyle(field: string) {
    const focused = focusedField === field
    return {
      width: '100%',
      background: 'rgba(6,10,22,0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: `1px solid ${focused ? 'rgba(46,111,216,0.7)' : 'rgba(148,163,199,0.16)'}`,
      boxShadow: focused
        ? '0 0 0 3px rgba(0,74,173,0.22), inset 0 1px 0 rgba(255,255,255,0.05)'
        : 'inset 0 1px 0 rgba(255,255,255,0.05)',
      borderRadius: '12px',
      padding: '13px 16px',
      color: C.text,
      fontFamily: 'var(--font-inter)',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    } as const
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div
        className="orb"
        style={{
          width: '520px',
          height: '520px',
          top: '-160px',
          right: '-100px',
          background: 'radial-gradient(circle, rgba(0,74,173,0.4), transparent 70%)',
        }}
      />
      <div
        className="glass-card fade-up"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-cinzel)',
              fontSize: '22px',
              fontWeight: 700,
              color: C.gold,
              letterSpacing: '0.14em',
              margin: '0 0 8px',
            }}
          >
            SATÉLITE
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-playfair)',
              fontStyle: 'italic',
              color: C.lavender,
              fontSize: '14px',
              margin: 0,
            }}
          >
            Redefinir senha
          </p>
        </div>

        {status === 'checking' && (
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              color: C.muted,
              textAlign: 'center',
              margin: 0,
            }}
          >
            Validando o link de recuperação...
          </p>
        )}

        {status === 'invalid' && (
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '13px',
                color: '#F87171',
                margin: '0 0 16px',
                lineHeight: 1.6,
              }}
            >
              Link inválido ou expirado. Volte ao login e peça um novo link em
              &quot;Esqueci minha senha&quot;.
            </p>
            <a
              href="/login"
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '13px',
                color: C.gold,
                textDecoration: 'none',
              }}
            >
              Voltar ao login
            </a>
          </div>
        )}

        {status === 'ready' && (
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  color: C.muted,
                }}
              >
                Nova senha
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                style={inputStyle('password')}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontFamily: 'var(--font-inter)',
                  fontSize: '12px',
                  color: C.muted,
                }}
              >
                Confirme a nova senha
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                style={inputStyle('confirm')}
              />
            </div>

            {error && (
              <p
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: '13px',
                  color: '#F87171',
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{
                marginTop: '4px',
                padding: '13px',
                color: C.text,
                borderRadius: '12px',
                fontFamily: 'var(--font-inter)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Salvando...' : 'Redefinir senha e entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
