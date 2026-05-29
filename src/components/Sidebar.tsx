'use client'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'

const C = {
  bgSecondary: '#111116',
  card: '#2A2A2A',
  blue: '#004AAD',
  gold: '#F5C16C',
  text: '#FAFAFA',
  muted: '#8A8A9A',
  dim: '#555565',
} as const

const navItems = [
  { label: 'Analisar', href: '/' },
  { label: 'Histórico', href: '/historico' },
  { label: 'Configurações', href: '/configuracoes', disabled: true },
]

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [supabase] = useState(() => getSupabase())
  const [user, setUser] = useState<User | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [supabase])

  async function handleLogout() {
    if (!supabase) return
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário'

  return (
    <aside
      style={{
        width: '220px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: C.bgSecondary,
        borderRight: `1px solid ${C.card}`,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px' }}>
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
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          {navItems.map(({ label, href, disabled }) => {
            const isActive = pathname === href
            return (
              <li key={href}>
                <Link
                  href={disabled ? '#' : href}
                  onClick={disabled ? (e) => e.preventDefault() : undefined}
                  style={{
                    display: 'block',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: isActive ? 'rgba(0, 74, 173, 0.25)' : 'transparent',
                    color: isActive ? C.gold : disabled ? C.dim : C.muted,
                    fontFamily: 'var(--font-inter)',
                    fontSize: '14px',
                    fontWeight: isActive ? 500 : 400,
                    cursor: disabled ? 'default' : 'pointer',
                    textDecoration: 'none',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User + footer */}
      <div style={{ borderTop: `1px solid ${C.card}` }}>
        {user && (
          <div style={{ padding: '16px 20px 10px' }}>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '13px',
                color: C.text,
                margin: '0 0 2px',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {displayName}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-inter)',
                fontSize: '11px',
                color: C.muted,
                margin: '0 0 10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </p>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.gold
                e.currentTarget.style.color = C.gold
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.card
                e.currentTarget.style.color = C.muted
              }}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                border: `1px solid ${C.card}`,
                background: 'transparent',
                color: C.muted,
                fontFamily: 'var(--font-inter)',
                fontSize: '12px',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: loggingOut ? 0.6 : 1,
              }}
            >
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        )}
        <div style={{ padding: '10px 20px 20px' }}>
          <p
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: '11px',
              color: C.dim,
              margin: 0,
            }}
          >
            v1.0 · powered by Claude
          </p>
        </div>
      </div>
    </aside>
  )
}
