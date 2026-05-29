'use client'

import { FormEvent, useState } from 'react'
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

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha inválidos.'
  if (msg.includes('Email not confirmed')) return 'Confirme seu e-mail antes de entrar.'
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('Password should be')) return 'Senha deve ter pelo menos 6 caracteres.'
  return msg
}

export default function LoginPage() {
  const router = useRouter()
  const [supabase] = useState(() => getSupabase())

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function inputStyle(field: string) {
    return {
      width: '100%',
      background: C.bgPrimary,
      border: `1px solid ${focusedField === field ? C.blue : C.card}`,
      borderRadius: '10px',
      padding: '13px 16px',
      color: C.text,
      fontFamily: 'var(--font-inter)',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) throw authError
        router.push('/')
        router.refresh()
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (authError) throw authError
        setMessage('Verifique seu e-mail para confirmar o cadastro.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado.'
      setError(translateError(msg))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setError(authError.message)
      setGoogleLoading(false)
    }
  }

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setMessage('')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bgPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: C.bgSecondary,
          border: `1px solid ${C.card}`,
          borderRadius: '16px',
          padding: '40px 36px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
            {mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Form */}
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
              E-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              placeholder="seu@email.com"
              style={inputStyle('email')}
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
              Senha
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

          {error && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#F87171', margin: 0 }}>
              {error}
            </p>
          )}
          {message && (
            <p style={{ fontFamily: 'var(--font-inter)', fontSize: '13px', color: '#4ADE80', margin: 0 }}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '4px',
              padding: '13px',
              background: C.blue,
              color: C.text,
              border: 'none',
              borderRadius: '10px',
              fontFamily: 'var(--font-inter)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.2s ease',
            }}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {/* Toggle mode */}
        <p
          style={{
            textAlign: 'center',
            fontFamily: 'var(--font-inter)',
            fontSize: '13px',
            color: C.muted,
            margin: '18px 0 0',
          }}
        >
          {mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <button
            onClick={switchMode}
            style={{
              background: 'none',
              border: 'none',
              color: C.gold,
              cursor: 'pointer',
              fontFamily: 'var(--font-inter)',
              fontSize: '13px',
              padding: 0,
            }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0' }}>
          <div style={{ flex: 1, height: '1px', background: C.card }} />
          <span style={{ fontFamily: 'var(--font-inter)', fontSize: '12px', color: C.muted }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: C.card }} />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.gold)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.card)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'transparent',
            border: `1px solid ${C.card}`,
            borderRadius: '10px',
            color: C.text,
            fontFamily: 'var(--font-inter)',
            fontSize: '14px',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            opacity: googleLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'border-color 0.2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Redirecionando...' : 'Entrar com Google'}
        </button>
      </div>
    </div>
  )
}
