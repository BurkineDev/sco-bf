import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPaths = ['/login', '/']
  const isPublicPath = publicPaths.includes(pathname)

  // Récupérer le token d'authentification depuis le localStorage via les cookies
  // Note: En production, utiliser des cookies HTTPOnly
  const authStorage = request.cookies.get('dashboard-auth-storage')?.value

  let isAuthenticated = false

  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage)
      isAuthenticated = parsed.state?.isAuthenticated || false
    } catch (error) {
      // Invalid JSON, considérer comme non authentifié
      isAuthenticated = false
    }
  }

  // Rediriger vers /login si on essaie d'accéder à une route protégée sans être authentifié
  if (!isPublicPath && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Rediriger vers /dashboard si on est déjà authentifié et qu'on essaie d'accéder à /login
  if (pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Rediriger la page d'accueil vers /dashboard si authentifié, sinon vers /login
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
