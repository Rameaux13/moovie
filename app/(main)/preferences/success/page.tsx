'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function PreferencesSuccessPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  useEffect(() => {
    const redirectToHome = async () => {
      console.log('🎉 Page de succès chargée')
      
      try {
        // Attendre un peu pour que la DB soit synchronisée
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        console.log('🔄 Tentative de mise à jour de session...')
        await update()
        
        // Attendre encore un peu
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('🏠 Redirection vers /home...')
        
        // Utiliser replace pour éviter le retour en arrière
        window.location.replace('/home')
        
      } catch (error) {
        console.error('Erreur:', error)
        // En cas d'erreur, forcer quand même la redirection
        window.location.replace('/home')
      }
    }

    redirectToHome()
  }, [update])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Préférences sauvegardées ! 🎉
        </h1>
        <p className="text-gray-300">
          Redirection vers votre page d'accueil...
        </p>
      </div>
    </div>
  )
}