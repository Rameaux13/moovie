 'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return // Encore en chargement
    
    if (!session) {
      router.push('/login')
      return
    }

    
     if (session.user.role !== 'ADMIN') {
      router.push('/home')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Chargement...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Admin */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
             <Link href="/dashboard" className="text-red-600 font-bold text-xl">
  NETFLIX ADMIN
</Link>
             <nav className="flex space-x-6">
  <Link href="/dashboard" className="hover:text-red-600 transition-colors">
    Dashboard
  </Link>
  <Link href="/movies" className="hover:text-red-600 transition-colors">
    Films
  </Link>
  <Link href="/users" className="hover:text-red-600 transition-colors">
    Utilisateurs
  </Link>
  <Link href="/subscriptions" className="hover:text-red-600 transition-colors">
    Abonnements
  </Link>
</nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-300">
                {session.user?.name || session.user?.email}
              </span>
              <Link href="/home" className="bg-red-600 px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors">
                Retour Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}