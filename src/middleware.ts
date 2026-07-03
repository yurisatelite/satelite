import { NextResponse, type NextRequest } from 'next/server'

// Must match AUTH_COOKIE_KEY in src/lib/supabase.ts
const AUTH_COOKIE_KEY = 'sb-auth-token'
const PUBLIC_PATHS = ['/login', '/auth', '/precos', '/api/stripe/webhook']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Visitante sem login na home cai na landing pública de preços
  const redirectTarget = pathname === '/' ? '/precos' : '/login'

  const raw = request.cookies.get(AUTH_COOKIE_KEY)?.value
  if (!raw) {
    return NextResponse.redirect(new URL(redirectTarget, request.url))
  }

  try {
    const session = JSON.parse(decodeURIComponent(raw))
    if (!session?.access_token) {
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
    if (session.expires_at && Date.now() / 1000 > session.expires_at) {
      return NextResponse.redirect(new URL(redirectTarget, request.url))
    }
  } catch {
    return NextResponse.redirect(new URL(redirectTarget, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
