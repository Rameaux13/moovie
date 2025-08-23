import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(request) {
    const token = request.nextauth.token
    const { pathname } = request.nextUrl

    // Si utilisateur connecté
    if (token) {
      // Si il va sur les pages d'auth, rediriger selon ses préférences
      if (pathname === "/" || pathname === "/login" || pathname === "/register") {
        if (!token.preferencesCompleted) {
          return NextResponse.redirect(new URL("/preferences", request.url))
        } else {
          return NextResponse.redirect(new URL("/home", request.url))
        }
      }

      // Si il va sur /preferences mais a déjà complété, rediriger vers /home
      if (pathname === "/preferences" && token.preferencesCompleted) {
        return NextResponse.redirect(new URL("/home", request.url))
      }

      // Si il va sur /home mais n'a pas complété les préférences
      if (pathname === "/home" && !token.preferencesCompleted) {
        return NextResponse.redirect(new URL("/preferences", request.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Pages publiques (pas besoin d'être connecté)
        const publicPages = ["/", "/login", "/register", "/forgot-password"]
        if (publicPages.includes(pathname)) {
          return true
        }

        // Pages protégées (besoin d'être connecté)
        const protectedPages = ["/home", "/preferences", "/profile", "/watch"]
        if (protectedPages.some(page => pathname.startsWith(page))) {
          return !!token
        }

        return true
      },
    },
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}