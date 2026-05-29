import { createClient } from '@supabase/supabase-js'

// Must match AUTH_COOKIE_KEY in middleware.ts
export const AUTH_COOKIE_KEY = 'sb-auth-token'

function cookieStorage() {
  return {
    getItem(key: string): string | null {
      if (typeof document === 'undefined') return null
      const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
      return match ? decodeURIComponent(match[1]) : null
    },
    setItem(key: string, value: string): void {
      if (typeof document === 'undefined') return
      document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=31536000;SameSite=Lax`
    },
    removeItem(key: string): void {
      if (typeof document === 'undefined') return
      document.cookie = `${key}=;path=/;max-age=0;SameSite=Lax`
    },
  }
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      storage: cookieStorage(),
      storageKey: AUTH_COOKIE_KEY,
    },
  })
}
