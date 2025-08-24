'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Genre {
  id: string
  name: string
  slug: string
  icon: string
  color: string
}

export default function PreferencesPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Charger les genres depuis la base de données
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch('/api/genres')
        if (response.ok) {
          const data = await response.json()
          setGenres(data)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des genres:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGenres()
  }, [])

  const toggleGenre = (genreId: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreId)) {
        return prev.filter(id => id !== genreId)
      } else if (prev.length < 5) {
        return [...prev, genreId]
      }
      return prev
    })
  }

  const handleSavePreferences = async () => {
  if (selectedGenres.length < 3 || isProcessing) return

  console.log('🚀 Début sauvegarde, genres sélectionnés:', selectedGenres)
  setIsProcessing(true)
  setSaving(true)
  
  try {
    console.log('📤 Envoi requête vers /api/user/preferences...')
    
    const response = await fetch('/api/user/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genreIds: selectedGenres })
    })

    console.log('📥 Réponse API - Status:', response.status)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Préférences sauvegardées:', data)
      
      console.log('🏠 Redirection vers page de succès...')
      // Rediriger vers une page intermédiaire qui ne dépend pas du middleware
      window.location.href = '/preferences/success'
      
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
      console.error('❌ Erreur API:', response.status, errorData)
      alert(`Erreur: ${errorData.error || 'Erreur lors de la sauvegarde'}`)
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error)
    alert('Erreur de connexion. Vérifiez votre connexion internet.')
  } finally {
    setSaving(false)
    setIsProcessing(false)
    console.log('🏁 Fin du processus')
  }
}

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Bienvenue sur MOOVIE ! 🎬
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Choisissez vos genres préférés pour personnaliser votre expérience
          </p>
          <p className="text-purple-300">
            Sélectionnez entre 3 et 5 genres qui vous intéressent le plus
          </p>
        </div>

        {/* Grille des genres */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {genres.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id)
            
            return (
              <button
                key={genre.id}
                onClick={() => toggleGenre(genre.id)}
                disabled={!isSelected && selectedGenres.length >= 5}
                className={`
                  relative p-6 rounded-xl border-2 transition-all duration-200 transform hover:scale-105
                  ${isSelected 
                    ? 'border-purple-400 bg-purple-600/30 shadow-lg shadow-purple-500/25' 
                    : 'border-gray-600 bg-gray-800/50 hover:border-purple-500 hover:bg-gray-700/50'
                  }
                  ${!isSelected && selectedGenres.length >= 5 
                    ? 'opacity-50 cursor-not-allowed hover:scale-100' 
                    : 'hover:shadow-lg'
                  }
                `}
                style={{
                  borderColor: isSelected ? genre.color : undefined,
                  backgroundColor: isSelected ? `${genre.color}20` : undefined
                }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{genre.icon}</div>
                  <div className="text-white font-semibold text-lg">{genre.name}</div>
                </div>
                
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: genre.color }}
                    >
                      ✓
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* Indicateur de sélection */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-gray-800/50 px-4 py-2 rounded-full">
            <span className="text-gray-300">Sélectionnés :</span>
            <span className={`font-bold ${
              selectedGenres.length >= 3 ? 'text-green-400' : 'text-orange-400'
            }`}>
              {selectedGenres.length}/5
            </span>
          </div>
          {selectedGenres.length < 3 && (
            <p className="text-sm text-orange-400 mt-2">
              Choisissez au moins 3 genres pour continuer
            </p>
          )}
        </div>

        {/* Bouton de validation */}
        <div className="text-center">
          <button
            onClick={handleSavePreferences}
            disabled={selectedGenres.length < 3 || saving}
            className={`
              px-8 py-3 rounded-lg font-semibold text-white transition-all
              ${selectedGenres.length >= 3 && !saving
                ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg hover:shadow-xl transform hover:scale-105' 
                : 'bg-gray-600 cursor-not-allowed'
              }
            `}
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sauvegarde...</span>
              </div>
            ) : (
              'Continuer vers MOOVIE'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}