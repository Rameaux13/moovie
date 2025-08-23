import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token
    const { pathname } = request.nextUrl

    // ✅ NOUVEAU : Laisser passer les fichiers vidéo
    if (pathname.startsWith('/videos/')) {
      return NextResponse.next()
    }

    // LOGS DE DEBUG
    console.log('🔍 Middleware - pathname:', pathname)
    console.log('🔍 Middleware - token exists:', !!token)
    if (token) {
      console.log('🔍 Middleware - user email:', token.email)
      console.log('🔍 Middleware - preferencesCompleted:', token.preferencesCompleted)
    }

    // SEULEMENT si utilisateur connecté
    if (token) {
      // Si il va sur les pages d'auth APRÈS connexion, rediriger selon ses préférences
      if (pathname === "/" || pathname === "/login" || pathname === "/register") {
        console.log('🔄 Utilisateur connecté sur page auth, redirection...')
        if (!token.preferencesCompleted) {
          console.log('➡️ Redirection vers /preferences')
          return NextResponse.redirect(new URL("/preferences", request.url))
        } else {
          console.log('➡️ Redirection vers /home')
          return NextResponse.redirect(new URL("/home", request.url))
        }
      }

      // Si il va sur /preferences mais a déjà complété, rediriger vers /home
      if (pathname === "/preferences" && token.preferencesCompleted) {
        console.log('➡️ Préférences déjà complétées, redirection vers /home')
        return NextResponse.redirect(new URL("/home", request.url))
      }

      // Si il va sur /home mais n'a pas complété les préférences
      if (pathname === "/home" && !token.preferencesCompleted) {
        console.log('➡️ Préférences non complétées, redirection vers /preferences')
        return NextResponse.redirect(new URL("/preferences", request.url))
      }
    }

    // Sinon, laisser passer (utilisateurs non connectés peuvent voir les pages publiques)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // ✅ NOUVEAU : Laisser passer les fichiers vidéo
        if (pathname.startsWith('/videos/')) {
          return true
        }

        // Pages publiques (accessibles sans connexion)
        const publicPages = ["/", "/login", "/register", "/forgot-password"]
        if (publicPages.includes(pathname)) {
          return true // ✅ Toujours autoriser les pages publiques
        }

        // Pages protégées (besoin d'être connecté)
        const protectedPages = ["/home", "/preferences", "/profile", "/watch"]
        if (protectedPages.some(page => pathname.startsWith(page))) {
          return !!token // ✅ Seulement si connecté
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    // ✅ CORRIGÉ : Exclure les routes admin du middleware
    "/((?!api|_next/static|_next/image|favicon.ico|dashboard|movies|users|subscriptions).*)",
  ],
}