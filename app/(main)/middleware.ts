import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token
    const { pathname } = request.nextUrl

    console.log('🔍 Middleware - Path:', pathname)
    console.log('🔍 Middleware - Token exists:', !!token)
    console.log('🔍 Middleware - Preferences completed:', token?.preferencesCompleted)

    // Si utilisateur connecté
    if (token) {
      // Redirection depuis les pages d'authentification
      if (pathname === "/" || pathname === "/login" || pathname === "/register") {
        if (!token.preferencesCompleted) {
          console.log('🔄 Redirection: auth page -> /preferences')
          return NextResponse.redirect(new URL("/preferences", request.url))
        } else {
          console.log('🔄 Redirection: auth page -> /home')
          return NextResponse.redirect(new URL("/home", request.url))
        }
      }

      // Si l'utilisateur va sur /preferences mais a déjà complété
      if (pathname === "/preferences" && token.preferencesCompleted) {
        console.log('🔄 Redirection: /preferences -> /home (déjà complété)')
        return NextResponse.redirect(new URL("/home", request.url))
      }

      // Protection de /home : rediriger vers /preferences si pas complété
      if (pathname === "/home" && !token.preferencesCompleted) {
        console.log('🔄 Redirection: /home -> /preferences (pas complété)')
        return NextResponse.redirect(new URL("/preferences", request.url))
      }

      // Autoriser l'accès aux autres pages protégées si les préférences sont complétées
      const protectedPages = ["/profile", "/watch", "/movies", "/series"]
      if (protectedPages.some(page => pathname.startsWith(page))) {
        if (!token.preferencesCompleted) {
          console.log('🔄 Redirection: page protégée -> /preferences')
          return NextResponse.redirect(new URL("/preferences", request.url))
        }
      }
    }

    console.log('✅ Middleware - Autorisation accordée')
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        console.log('🔐 Auth callback - Path:', pathname, 'Token exists:', !!token)

        // Pages publiques (accessibles sans connexion)
        const publicPages = ["/", "/login", "/register", "/forgot-password", "/api/auth"]
        const isPublicPage = publicPages.some(page => pathname.startsWith(page))
        
        if (isPublicPage) {
          console.log('✅ Page publique autorisée')
          return true
        }

        // Pages protégées (nécessitent une connexion)
        const protectedPages = ["/home", "/preferences", "/profile", "/watch", "/movies", "/series"]
        const isProtectedPage = protectedPages.some(page => pathname.startsWith(page))
        
        if (isProtectedPage) {
          const isAuthorized = !!token
          console.log('🔐 Page protégée -', isAuthorized ? 'Autorisée' : 'Refusée')
          return isAuthorized
        }

        // Par défaut, autoriser (pour les autres routes comme /api, etc.)
        console.log('✅ Route autorisée par défaut')
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}