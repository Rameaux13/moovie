'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black">
      {/* Header avec navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-red-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo NETFLIX */}
            <div className="flex items-center">
              <button
                onClick={() => router.push('/home')}
                className="text-2xl font-bold text-white hover:text-red-300 transition-all flex items-center"
              >
                <span className="text-red-600 text-3xl font-black tracking-wider">NETFLIX</span>
              </button>
            </div>

            {/* Navigation centrale */}
            <nav className="hidden md:flex space-x-8">
              <button
                onClick={() => router.push('/home')}
                className="text-white hover:text-red-300 transition-colors font-medium"
              >
                Accueil
              </button>
              <button
                onClick={() => router.push('/browse')}
                className="text-white hover:text-red-300 transition-colors font-medium"
              >
                Catalogue
              </button>
             
              <button
                onClick={() => router.push('/my-list')}
                className="text-white hover:text-red-300 transition-colors font-medium"
              >
                Ma Liste
              </button>

              {/* ✨ NOUVEAU : Lien Mes Téléchargements */}
              <button
                onClick={() => router.push('/downloads')}
                className="text-white hover:text-red-300 transition-colors font-medium"
              >
                <span className="hidden lg:block">Mes Téléchargements</span>
                <span className="lg:hidden">Téléchargements</span>
              </button>
            </nav>

            {/* Menu utilisateur */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 text-white hover:text-red-300 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="hidden sm:block">{session?.user?.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-red-700 rounded-lg shadow-xl">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        router.push('/profile')
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-red-700/50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon Profil
                    </button>

                    {/* ✨ NOUVEAU : Lien dans le dropdown aussi (pour mobile) */}
                    <button
                      onClick={() => {
                        router.push('/downloads')
                        setShowUserMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-red-700/50 transition-colors md:hidden"
                    >
                      Mes Téléchargements
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-700/20 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal avec padding pour le header fixe */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}