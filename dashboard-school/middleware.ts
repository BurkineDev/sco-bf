import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware désactivé temporairement pour Vercel
// TODO: Réactiver l'authentification après le déploiement
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Matcher vide = middleware ne s'exécute sur aucune route
export const config = {
  matcher: [],
}
