import { NextResponse } from 'next/server'

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'aethel_session'

/**
 * Middleware liviano: redirige a /login si no hay cookie de sesión.
 * La verificación criptográfica del JWT pasa a cada API route / server
 * component via getSession(). Acá solo chequeamos presencia para no
 * traer jsonwebtoken al edge runtime.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Si ya hay sesión y va a /login, mandarlo al dashboard
  if (pathname === '/login' && token) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
