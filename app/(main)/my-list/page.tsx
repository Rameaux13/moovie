'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Types pour les données
interface FavoriteMovie {
  id: number
  title: string
  description: string
  duration: number
  release_date: string
  thumbnail_url: string
  rating: number
  views_count: number
  genre: string
  added_at: string
}

export default function MyListPage() {
  const { data: session, status } = useSession()
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Charger les favoris depuis l'API
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch('/api/favorites')
        const result = await response.json()
        
        if (result.success) {
          setFavorites(result.favorites)
        } else {
          setError(result.error || 'Erreur lors du chargement de votre liste')
        }
      } catch (err) {
        setError('Erreur de connexion')
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    if (status !== 'loading') {
      fetchFavorites()
    }
  }, [session, status])

  // Fonction pour supprimer un favori
  const removeFavorite = async (movieId: number) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId }),
      })

      const result = await response.json()
      
      if (result.success) {
        setFavorites(favorites.filter(movie => movie.id !== movieId))
      } else {
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur de connexion')
    }
  }

  // Redirection si pas connecté
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Connexion requise
          </h1>
          <p className="text-gray-400 mb-6">
            Vous devez être connecté pour accéder à votre liste personnelle.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-red-600 text-white px-6 py-3 rounded font-semibold hover:bg-red-700 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-24 px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Ma Liste</h1>
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-white text-lg">Chargement de votre liste...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="pt-24 px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-8">Ma Liste</h1>
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-500 text-xl mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header Section */}
      <div className="relative pt-24 pb-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Titre principal */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-4xl">❤️</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Ma Liste
              </h1>
              <p className="text-gray-400 text-lg mt-2">
                {session.user.name}, voici vos films préférés
              </p>
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
              <p className="text-2xl font-bold text-red-500">{favorites.length}</p>
              <p className="text-gray-300 text-sm">Films dans votre liste</p>
            </div>
            {favorites.length > 0 && (
              <>
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-red-500">
                    {Math.round(favorites.reduce((acc, movie) => acc + movie.rating, 0) / favorites.length * 10) / 10}
                  </p>
                  <p className="text-gray-300 text-sm">Note moyenne</p>
                </div>
                <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
                  <p className="text-2xl font-bold text-red-500">
                    {Math.round(favorites.reduce((acc, movie) => acc + movie.duration, 0) / 60)}h
                  </p>
                  <p className="text-gray-300 text-sm">Durée totale</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="px-4 sm:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Liste vide */}
          {favorites.length === 0 && (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">📺</div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Votre liste est vide
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                Parcourez le catalogue et ajoutez vos films préférés à votre liste personnelle.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/browse'}
                  className="bg-red-600 text-white px-8 py-3 rounded font-semibold hover:bg-red-700 transition-colors"
                >
                  Parcourir le catalogue
                </button>
                <button
                  onClick={() => window.location.href = '/home'}
                  className="bg-gray-800 text-white px-8 py-3 rounded font-semibold hover:bg-gray-700 transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          )}

          {/* Grille des favoris */}
          {favorites.length > 0 && (
            <>
              {/* Actions de groupe */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold text-white">
                    Vos films favoris
                  </h3>
                  <span className="bg-red-600/20 text-red-400 px-3 py-1 rounded-full text-sm">
                    {favorites.length} film{favorites.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                    Trier par date d'ajout
                  </button>
                  <button className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 transition-colors">
                    Trier par note
                  </button>
                </div>
              </div>

              {/* Grille de films */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {favorites.map((movie) => (
                  <div
                    key={movie.id}
                    className="group relative bg-gray-900 rounded-lg overflow-hidden hover:scale-105 transition-transform duration-200"
                  >
                    {/* Image du film */}
                    <div className="relative aspect-[2/3]">
                      <img
                        src={movie.thumbnail_url}
                        alt={movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://via.placeholder.com/300x450/1f2937/ffffff?text=Image+non+disponible'
                        }}
                      />
                      
                      {/* Overlay avec actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <div className="flex gap-2">
                          {/* Bouton Lecture */}
<button
  onClick={() => window.location.href = `/watch/${movie.id}?from=my-list`}
  className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition-colors"
>
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
</button>
                          
                          {/* Bouton Supprimer */}
                          <button
                            onClick={() => removeFavorite(movie.id)}
                            className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            title="Supprimer de ma liste"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Badge note */}
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                        ⭐ {movie.rating.toFixed(1)}
                      </div>

                      {/* Badge genre */}
                      <div className="absolute top-2 left-2 bg-red-600/80 text-white px-2 py-1 rounded text-xs font-bold">
                        {movie.genre}
                      </div>
                    </div>

                    {/* Informations du film */}
                    <div className="p-3">
                      <h4 className="text-white font-semibold text-sm mb-1 line-clamp-2">
                        {movie.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(movie.release_date).getFullYear()}</span>
                        <span>•</span>
                        <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Ajouté le {new Date(movie.added_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions en bas */}
              <div className="mt-12 text-center">
                <button
                  onClick={() => window.location.href = '/browse'}
                  className="bg-red-600 text-white px-8 py-3 rounded font-semibold hover:bg-red-700 transition-colors"
                >
                  Découvrir plus de films
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}