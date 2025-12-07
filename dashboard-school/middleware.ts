import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Routes API - toujours autoriser
    if (pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    // Fichiers statiques - toujours autoriser
    if (pathname.startsWith('/_next')) {
      return NextResponse.next()
    }

    // Pages publiques
    const publicPaths = ['/login', '/login-dev']
    const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

    if (isPublicPath) {
      return NextResponse.next()
    }

    // Page d'accueil - toujours rediriger vers login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Pour toutes les autres routes, vérifier l'authentification
    const authCookie = request.cookies.get('dashboard-auth-storage')?.value

    if (!authCookie) {
      // Pas de cookie = pas authentifié = rediriger vers login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Cookie présent, laisser passer
    return NextResponse.next()
  } catch (error) {
    // En cas d'erreur dans le middleware, laisser passer la requête
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
