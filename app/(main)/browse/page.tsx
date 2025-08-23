'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Metadata } from 'next'

// Types pour les données
interface Genre {
  id: string
  name: string
  color: string
  icon: string
  movies: Movie[]
}

interface Movie {
  id: number
  title: string
  description: string
  duration: number
  release_date: string
  thumbnail_url: string
  rating: number
  views: number  // ← CORRIGÉ : "views" au lieu de "views_count"
}

interface BrowseData {
  moviesByGenre: Genre[]
  recentMovies: Movie[]
  popularMovies: Movie[]
}

export default function BrowsePage() {
  const { data: session } = useSession()
  const [data, setData] = useState<BrowseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<string>('Tous les genres')
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('recent')
  const [userFavorites, setUserFavorites] = useState<number[]>([]) // IDs des films en favoris

  // Charger les données depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Charger les films
        const response = await fetch('/api/browse')
        const result = await response.json()
        
        if (result.success) {
          setData(result)
        } else {
          setError('Erreur lors du chargement des films')
        }
        
        // Charger les favoris de l'utilisateur si connecté
        if (session?.user) {
          try {
            const favResponse = await fetch('/api/favorites')
            const favResult = await favResponse.json()
            
            if (favResult.success) {
              const favoriteIds = favResult.favorites.map((fav: any) => fav.id)
              setUserFavorites(favoriteIds)
            }
          } catch (favError) {
            console.log('Erreur favoris (non critique):', favError)
          }
        }
        
      } catch (err) {
        setError('Erreur de connexion')
        console.error('Erreur:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  // Filtrer les films selon les critères
  const getFilteredMovies = (movies: Movie[]) => {
    let filtered = movies

    // Recherche par titre
    if (searchQuery) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Tri
    switch (sortBy) {
      case 'recent':
        filtered = [...filtered].sort((a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime())
        break
      case 'popular':
        filtered = [...filtered].sort((a, b) => (b.views || 0) - (a.views || 0))  // ← CORRIGÉ : "views" avec protection
        break
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'alphabetical':
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title))
        break
    }

    return filtered
  }

  // Fonctions de gestion des favoris
  const toggleFavorite = async (movieId: number) => {
    if (!session?.user) {
      alert('Vous devez être connecté pour ajouter des favoris')
      return
    }

    const isFavorite = userFavorites.includes(movieId)
    
    try {
      const response = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId }),
      })

      const result = await response.json()
      
      if (result.success) {
        if (isFavorite) {
          // Supprimer de la liste locale
          setUserFavorites(userFavorites.filter(id => id !== movieId))
        } else {
          // Ajouter à la liste locale
          setUserFavorites([...userFavorites, movieId])
        }
      } else {
        alert(result.error || 'Erreur lors de la mise à jour des favoris')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('Erreur de connexion')
    }
  }
  
  const handleGenreFilter = async (genre: string) => {
    setSelectedGenre(genre)
    
    if (genre === 'Tous les genres') {
      // Recharger toutes les données
      const response = await fetch('/api/browse')
      const result = await response.json()
      if (result.success) {
        setData(result)
      }
    } else {
      // Filtrer par genre spécifique
      const response = await fetch(`/api/browse?genre=${encodeURIComponent(genre)}`)
      const result = await response.json()
      if (result.success) {
        // Adapter les données pour l'affichage filtré
        setData({
          moviesByGenre: [{
            id: 'filtered',
            name: genre,
            color: '#dc2626',
            icon: '🎬',
            movies: result.videos
          }],
          recentMovies: [],
          popularMovies: []
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Chargement du catalogue...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">⚠️ {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section - Banner principal */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://image.tmdb.org/t/p/original/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg')`,
          }}
        >
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/30"></div>
        </div>

        {/* Contenu Hero */}
        <div className="relative z-10 flex items-center h-full px-8 max-w-7xl mx-auto">
          <div className="max-w-2xl">
            {/* Badge Netflix Original */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="bg-red-600 text-white px-3 py-1 text-sm font-bold uppercase tracking-wide">
                Film Original NETFLIX
              </span>
            </div>

            {/* Titre */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
              Catalogue
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-200 mb-8 leading-relaxed max-w-xl">
              Découvrez notre collection complète de films et séries. 
              Des blockbusters aux films d'auteur, trouvez votre prochaine obsession.
            </p>

            {/* Statistiques */}
            {data && (
              <div className="flex gap-6 mb-8">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {data.moviesByGenre.reduce((acc, genre) => acc + genre.movies.length, 0)}
                  </p>
                  <p className="text-gray-300 text-sm">Films disponibles</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {data.moviesByGenre.length}
                  </p>
                  <p className="text-gray-300 text-sm">Genres</p>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => {
                  // Scroll vers le catalogue
                  const catalogueSection = document.querySelector('#catalogue-section')
                  catalogueSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="flex items-center gap-3 bg-white text-black font-semibold px-8 py-3 rounded-md hover:bg-gray-200 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Parcourir tout
              </button>
              <button 
                onClick={() => {
                  // Action pour plus d'infos
                  alert('Fonctionnalité "Plus d\'infos" - À développer dans la prochaine étape!')
                }}
                className="flex items-center gap-3 bg-gray-600/70 text-white font-semibold px-8 py-3 rounded-md hover:bg-gray-600 transition-colors duration-200 backdrop-blur-sm"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Plus d'infos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Filtres et Recherche */}
      <div className="relative z-20 bg-black px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Barre de recherche */}
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-bold text-white">
              Parcourir le catalogue
            </h2>
            
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un film..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-800 text-white px-4 py-2 pl-10 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none transition-colors"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Tri */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Trier par:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-red-500 focus:outline-none text-sm"
              >
                <option value="recent">Plus récents</option>
                <option value="popular">Popularité</option>
                <option value="rating">Note</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>

          {/* Filtres genres */}
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-gray-400 text-sm font-medium">Genres:</span>
            <div className="flex flex-wrap gap-3">
              {['Tous les genres', 'Action', 'Romance', 'Comédie', 'Drame', 'Horreur', 'Science-Fiction', 'Thriller', 'Aventure', 'Animation', 'Documentaire'].map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleGenreFilter(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    genre === selectedGenre
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchQuery && (
            <div className="text-gray-400 text-sm">
              Recherche: "<span className="text-white">{searchQuery}</span>"
              {selectedGenre !== 'Tous les genres' && (
                <span> dans <span className="text-red-500">{selectedGenre}</span></span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section Catalogue */}
      <div id="catalogue-section" className="px-4 sm:px-8 py-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Nouveautés */}
          {selectedGenre === 'Tous les genres' && data?.recentMovies && data.recentMovies.length > 0 && !searchQuery && (
            <section>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-red-500">🆕</span>
                Nouveautés
              </h3>
              <MovieCarousel 
                movies={getFilteredMovies(data.recentMovies)} 
                userFavorites={userFavorites}
                onToggleFavorite={toggleFavorite}
                isUserLoggedIn={!!session?.user}
              />
            </section>
          )}

          {/* Section Populaires */}
          {selectedGenre === 'Tous les genres' && data?.popularMovies && data.popularMovies.length > 0 && !searchQuery && (
            <section>
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-red-500">🔥</span>
                Tendances
              </h3>
              <MovieCarousel 
                movies={getFilteredMovies(data.popularMovies)} 
                userFavorites={userFavorites}
                onToggleFavorite={toggleFavorite}
                isUserLoggedIn={!!session?.user}
              />
            </section>
          )}

          {/* Sections par genre */}
          {data?.moviesByGenre.map((genre) => {
            const filteredMovies = getFilteredMovies(genre.movies)
            return filteredMovies.length > 0 && (
              <section key={genre.id}>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-red-500">{genre.icon}</span>
                  Films {genre.name}
                  <span className="text-gray-500 text-lg font-normal">
                    ({filteredMovies.length})
                  </span>
                  {searchQuery && (
                    <span className="text-gray-400 text-base font-normal">
                      - correspondant à "{searchQuery}"
                    </span>
                  )}
                </h3>
                <MovieCarousel 
                  movies={filteredMovies} 
                  userFavorites={userFavorites}
                  onToggleFavorite={toggleFavorite}
                  isUserLoggedIn={!!session?.user}
                />
              </section>
            )
          })}

          {/* Message si aucun résultat */}
          {data && data.moviesByGenre.every(genre => getFilteredMovies(genre.movies).length === 0) && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-400 text-xl mb-2">
                Aucun film trouvé
              </p>
              <p className="text-gray-500">
                {searchQuery ? (
                  <>Essayez avec d'autres mots-clés ou changez de genre</>
                ) : (
                  <>Aucun film disponible pour "{selectedGenre}"</>
                )}
              </p>
              {(searchQuery || selectedGenre !== 'Tous les genres') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedGenre('Tous les genres')
                  }}
                  className="mt-4 bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Types pour les composants
interface MovieCarouselProps {
  movies: Movie[]
  userFavorites?: number[]
  onToggleFavorite?: (movieId: number) => void
  isUserLoggedIn?: boolean
}

// Composant Carrousel de films réutilisable
function MovieCarousel({ 
  movies, 
  userFavorites = [], 
  onToggleFavorite, 
  isUserLoggedIn = false 
}: MovieCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [moviesPerPage, setMoviesPerPage] = useState(5)

  // Responsive: ajuster le nombre de films par page
  useEffect(() => {
    const updateMoviesPerPage = () => {
      if (window.innerWidth < 640) setMoviesPerPage(2)      // Mobile
      else if (window.innerWidth < 768) setMoviesPerPage(3) // Tablette
      else if (window.innerWidth < 1024) setMoviesPerPage(4) // Desktop small
      else setMoviesPerPage(5) // Desktop large
    }

    updateMoviesPerPage()
    window.addEventListener('resize', updateMoviesPerPage)
    return () => window.removeEventListener('resize', updateMoviesPerPage)
  }, [])

  const nextSlide = () => {
    if (currentIndex < movies.length - moviesPerPage) {
      setCurrentIndex(currentIndex + moviesPerPage)
    }
  }

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - moviesPerPage))
    }
  }

  const goToMovie = (movieId: number) => {
    // Navigation vers la page de lecture du film
    window.location.href = `/watch/${movieId}?from=browse`  // ← CORRIGÉ : Navigation réelle au lieu d'alert
  }

  const visibleMovies = movies.slice(currentIndex, currentIndex + moviesPerPage)

  if (movies.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun film dans cette section</p>
      </div>
    )
  }

  return (
    <div className="relative group">
      {/* Bouton Précédent */}
      {currentIndex > 0 && (
        <button
          onClick={prevSlide}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 -ml-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Carrousel de films */}
      <div className="overflow-hidden">
        <div className="flex gap-2 sm:gap-4 transition-transform duration-300">
          {visibleMovies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 group/card cursor-pointer"
              style={{ width: `${100 / moviesPerPage}%` }}
              onClick={() => goToMovie(movie.id)}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800">
                <img
                  src={movie.thumbnail_url}
                  alt={movie.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'https://via.placeholder.com/300x450/1f2937/ffffff?text=Image+non+disponible'
                  }}
                />
                
                {/* Overlay avec informations */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                    <h4 className="text-white font-semibold text-xs sm:text-sm mb-1 line-clamp-2">
                      {movie.title}
                    </h4>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-300">
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                      <span>•</span>
                      <span>{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:flex items-center gap-1">
                        ⭐ {(movie.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bouton Play au centre */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        goToMovie(movie.id)
                      }}
                      className="bg-white/20 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full hover:bg-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Badge rating */}
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black/70 text-white px-1 sm:px-2 py-1 rounded text-xs font-bold">
                  {(movie.rating || 0).toFixed(1)} ⭐
                </div>

                {/* Badge views */}
                <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-red-600/80 text-white px-1 sm:px-2 py-1 rounded text-xs font-bold">
                  {(movie.views || 0).toLocaleString()} vues  {/* ← CORRIGÉ : "views" avec protection */}
                </div>

                {/* Bouton Favoris */}
                {isUserLoggedIn && onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(movie.id)
                    }}
                    className={`absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2 p-1 sm:p-2 rounded-full transition-all duration-200 ${
                      userFavorites.includes(movie.id)
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-white/20 backdrop-blur-sm text-white hover:bg-red-600'
                    }`}
                    title={userFavorites.includes(movie.id) ? 'Supprimer de ma liste' : 'Ajouter à ma liste'}
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                )}

                {/* Message pour utilisateurs non connectés */}
                {!isUserLoggedIn && (
                  <div className="absolute top-1 sm:top-2 left-1/2 transform -translate-x-1/2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        alert('Connectez-vous pour ajouter des films à votre liste !')
                      }}
                      className="bg-white/20 backdrop-blur-sm text-white p-1 sm:p-2 rounded-full hover:bg-gray-600 transition-colors"
                      title="Connectez-vous pour ajouter à vos favoris"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bouton Suivant */}
      {currentIndex < movies.length - moviesPerPage && (
        <button
          onClick={nextSlide}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 -mr-4"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Indicateurs de pagination */}
      {movies.length > moviesPerPage && (
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: Math.ceil(movies.length / moviesPerPage) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index * moviesPerPage)}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentIndex / moviesPerPage) === index 
                  ? 'bg-red-600' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}