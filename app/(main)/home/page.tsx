'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Genre {
  id: string
  name: string
  icon: string
  color: string
}

interface Video {
  id: number
  title: string
  description: string
  thumbnail_url: string
  poster_url: string
  rating: number
  duration: number
  views_count: number
  year: number
  genre: string
}

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [userPreferences, setUserPreferences] = useState<Genre[]>([])
  const [heroMovies, setHeroMovies] = useState<Video[]>([])
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0)
  const [trendingMovies, setTrendingMovies] = useState<Video[]>([])
  const [recommendedMovies, setRecommendedMovies] = useState<Video[]>([])
  const [animatedMovies, setAnimatedMovies] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  // États pour les carrousels avec navigation
  const [trendingIndex, setTrendingIndex] = useState(0)
  const [recommendedIndex, setRecommendedIndex] = useState(0)
  const [animatedIndex, setAnimatedIndex] = useState(0)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        
        // Récupérer les préférences utilisateur
        const prefsResponse = await fetch('/api/user/preferences')
        if (prefsResponse.ok) {
          const preferences = await prefsResponse.json()
          setUserPreferences(preferences)
        }

        // ✅ NOUVEAU : Récupérer les VRAIS films depuis l'API
        const browseResponse = await fetch('/api/browse')
        if (browseResponse.ok) {
          const browseData = await browseResponse.json()
          
         if (browseData.success) {
    // Convertir les films de l'API au format attendu par ta page
    const convertMovie = (movie: any) => ({
      id: movie.id, // ← IDs RÉELS de la base
      title: movie.title,
      description: movie.description,
      thumbnail_url: movie.thumbnail_url,
      poster_url: movie.thumbnail_url,
      rating: movie.rating,
      duration: movie.duration,
      views_count: movie.views || 0,
      year: new Date(movie.release_date).getFullYear(),
      genre: movie.genre || 'Film'
    })

    // ✅ NOUVEAU : Éliminer les doublons par ID
    const allMovies = [
      ...browseData.recentMovies.map(convertMovie),
      ...browseData.popularMovies.map(convertMovie)
    ]
    
    // Supprimer les doublons en gardant seulement les films uniques par ID
    const uniqueMovies = allMovies.filter((movie, index, self) => 
      index === self.findIndex(m => m.id === movie.id)
    )

    // Mélanger les films uniques
    const shuffledMovies = uniqueMovies.sort(() => Math.random() - 0.5)
    
    // S'assurer qu'on a assez de films pour chaque section
    const moviesNeeded = Math.min(30, shuffledMovies.length) // Maximum 30 films ou moins si pas assez
    
    if (moviesNeeded >= 5) {
      setHeroMovies(shuffledMovies.slice(0, 5)) // 5 premiers pour le hero
    }
    
    if (moviesNeeded >= 13) {
      setTrendingMovies(shuffledMovies.slice(5, 13)) // 8 suivants pour tendances
    } else if (moviesNeeded > 5) {
      setTrendingMovies(shuffledMovies.slice(5, moviesNeeded)) // Tous les restants
    }
    
    if (moviesNeeded >= 22) {
      setRecommendedMovies(shuffledMovies.slice(13, 22)) // 9 suivants pour recommandations
    } else if (moviesNeeded > 13) {
      setRecommendedMovies(shuffledMovies.slice(13, moviesNeeded))
    }
    
    if (moviesNeeded >= 30) {
      setAnimatedMovies(shuffledMovies.slice(22, 30)) // 8 derniers pour animation
    } else if (moviesNeeded > 22) {
      setAnimatedMovies(shuffledMovies.slice(22, moviesNeeded))
    }
  }
  } 
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)

    // ❌ FALLBACK : Si l'API échoue, utiliser quelques films avec de vrais IDs
    setHeroMovies([
      {
            id: 28, // ← ID RÉEL d'Avengers
            title: "Avengers: Endgame",
            description: "Les Avengers s'assemblent une dernière fois pour défaire les actions de Thanos et restaurer l'ordre dans l'univers.",
            thumbnail_url: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
            poster_url: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
            rating: 4.5,
            duration: 181,
            views_count: 0,
            year: 2019,
            genre: "Action"
          }
        ])
        
        setTrendingMovies([
          {
            id: 29, // ← ID RÉEL de John Wick
            title: "John Wick",
            description: "Un ancien tueur à gages sort de sa retraite pour traquer les gangsters qui ont tué son chien.",
            thumbnail_url: "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
            poster_url: "https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
            rating: 4.2,
            duration: 101,
            views_count: 0,
            year: 2014,
            genre: "Action"
          }
        ])
        
        setRecommendedMovies([
          {
            id: 30, // ← ID RÉEL de Titanic
            title: "Titanic",
            description: "L'histoire d'amour tragique entre Jack et Rose à bord du paquebot le plus célèbre de l'histoire.",
            thumbnail_url: "https://image.tmdb.org/t/p/original/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
            poster_url: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
            rating: 4.7,
            duration: 194,
            views_count: 0,
            year: 1997,
            genre: "Romance"
          }
        ])
        
        setAnimatedMovies([
          {
            id: 35, // ← ID RÉEL de Soul
            title: "Soul",
            description: "Un musicien de jazz qui a perdu sa passion pour la musique embarque dans un voyage cosmique pour retrouver son étincelle.",
            thumbnail_url: "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg",
            poster_url: "https://image.tmdb.org/t/p/w500/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg",
            rating: 4.4,
            duration: 100,
            views_count: 0,
            year: 2020,
            genre: "Animation"
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Auto-rotation du hero carrousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % heroMovies.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroMovies.length])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}min`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M vues`
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K vues`
    }
    return `${views} vues`
  }

  // ✨ NOUVEAU : MovieCard optimisé pour mobile
  const MovieCard = ({ movie }: { movie: Video }) => (
    <div className="group relative min-w-0 cursor-pointer transition-all duration-300 hover:scale-105">
      <div className="relative overflow-hidden rounded-lg">
        <img 
          src={movie.poster_url} 
          alt={movie.title}
          className="h-[250px] sm:h-[300px] w-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/200x300/1a1a1a/ffffff?text=${encodeURIComponent(movie.title)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => router.push(`/watch/${movie.id}`)}
            className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4 hover:bg-white/30 transition-colors"
          >
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Rating badge */}
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
          <span className="text-yellow-400 text-xs sm:text-sm">⭐</span>
          <span className="text-white text-xs sm:text-sm font-semibold">{movie.rating}</span>
        </div>
      </div>
      
      <div className="mt-2 sm:mt-3">
        <h4 className="text-white font-semibold text-xs sm:text-sm line-clamp-1">{movie.title}</h4>
        <div className="flex items-center space-x-1 sm:space-x-2 mt-1 text-xs text-gray-400">
          <span>{movie.year}</span>
          <span>•</span>
          <span className="hidden sm:block">{formatDuration(movie.duration)}</span>
          <span className="sm:hidden">{Math.floor(movie.duration / 60)}h</span>
          <span>•</span>
          <span className="truncate">{movie.genre}</span>
        </div>
      </div>
    </div>
  )

  // ✨ NOUVEAU : Carrousel responsive avec support tactile
  const Carousel = ({ movies, currentIndex, setCurrentIndex }: { movies: Video[], currentIndex: number, setCurrentIndex: (index: number) => void }) => {
    // Responsive - 2 films sur mobile, 3 sur tablette, 5 sur desktop
    const [moviesPerPage, setMoviesPerPage] = useState(5)
    
    useEffect(() => {
      const updateMoviesPerPage = () => {
        if (window.innerWidth < 640) {
          setMoviesPerPage(2) // Mobile
        } else if (window.innerWidth < 1024) {
          setMoviesPerPage(3) // Tablette
        } else {
          setMoviesPerPage(5) // Desktop
        }
      }
      
      updateMoviesPerPage()
      window.addEventListener('resize', updateMoviesPerPage)
      return () => window.removeEventListener('resize', updateMoviesPerPage)
    }, [])

    const maxIndex = Math.max(0, movies.length - moviesPerPage)

    const nextSlide = () => {
      setCurrentIndex(Math.min(currentIndex + 1, maxIndex))
    }

    const prevSlide = () => {
      setCurrentIndex(Math.max(currentIndex - 1, 0))
    }

    // Support swipe tactile
    const [touchStart, setTouchStart] = useState(0)
    const [touchEnd, setTouchEnd] = useState(0)

    const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return
      
      const distance = touchStart - touchEnd
      const isLeftSwipe = distance > 50
      const isRightSwipe = distance < -50

      if (isLeftSwipe) {
        nextSlide()
      }
      if (isRightSwipe) {
        prevSlide()
      }
    }

    return (
      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out touch-pan-x"
          style={{ 
            transform: `translateX(-${currentIndex * (100 / moviesPerPage)}%)` 
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {movies.map((movie) => (
            <div 
              key={movie.id} 
              className="flex-none w-1/2 sm:w-1/3 lg:w-1/5 px-1 sm:px-2"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
        
        {/* Navigation buttons - Plus gros sur mobile */}
        {currentIndex > 0 && (
          <button
            onClick={prevSlide}
            className="absolute left-1 sm:-translate-x-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 rounded-full p-2 sm:p-3 transition-all z-10 shadow-lg"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {currentIndex < maxIndex && (
          <button
            onClick={nextSlide}
            className="absolute right-1 sm:translate-x-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 rounded-full p-2 sm:p-3 transition-all z-10 shadow-lg"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Indicateurs de pagination pour mobile */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-4 space-x-1 sm:hidden">
            {Array.from({ length: maxIndex + 1 }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-red-500' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Chargement de votre cinéma personnalisé...</p>
        </div>
      </div>
    )
  }

  const currentHeroMovie = heroMovies[currentHeroIndex]

  return (
    <div className="min-h-screen">
      {/* Section Hero Carrousel - Optimisé mobile */}
      {currentHeroMovie && (
        <section className="relative h-[50vh] sm:h-[70vh] overflow-hidden">
          {/* Background image avec contraste maximum */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 brightness-90 contrast-110"
            style={{ 
              backgroundImage: `url(${currentHeroMovie.thumbnail_url})`,
            }}
          />
          
          {/* Gradient overlays optimisés pour la visibilité */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/50 to-black/20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent z-10"></div>
          
          {/* Contenu Hero */}
          <div className="relative z-20 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-600/30 border border-red-500/50 mb-4 backdrop-blur-sm">
                  <span className="text-red-200 text-xs sm:text-sm font-medium">🎬 Film Original NETFLIX</span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-tight drop-shadow-2xl">
                  {currentHeroMovie.title}
                </h1>
                
                <div className="flex items-center space-x-2 sm:space-x-4 mb-6">
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400 text-sm sm:text-lg">⭐</span>
                    <span className="text-white font-bold text-sm sm:text-base">{currentHeroMovie.rating}</span>
                  </div>
                  <span className="text-gray-200 text-xs sm:text-base hidden sm:block">{formatDuration(currentHeroMovie.duration)}</span>
                  <span className="text-gray-200 text-xs sm:text-base sm:hidden">{Math.floor(currentHeroMovie.duration / 60)}h</span>
                  <span className="text-gray-200 text-xs sm:text-base hidden sm:block">{formatViews(currentHeroMovie.views_count)}</span>
                  <span className="px-2 py-1 bg-gray-800/70 rounded text-white text-xs sm:text-sm">{currentHeroMovie.year}</span>
                </div>
                
                <p className="text-sm sm:text-lg text-gray-100 mb-8 leading-relaxed drop-shadow-lg line-clamp-3 sm:line-clamp-none">
                  {currentHeroMovie.description}
                </p>
                
                <div className="flex space-x-2 sm:space-x-4">
                  <button
                    onClick={() => router.push(`/watch/${currentHeroMovie.id}`)}
                    className="flex items-center space-x-2 bg-white text-black px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-200 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    <span>Regarder</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 bg-gray-600/40 backdrop-blur-sm text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-600/60 transition-all border border-gray-500/40 shadow-lg text-sm sm:text-base">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:block">Plus d'infos</span>
                    <span className="sm:hidden">Infos</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Indicateurs carrousel */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
            {heroMovies.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentHeroIndex(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
                  index === currentHeroIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </section>
      )}

      {/* Message de bienvenue */}
      <section className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Bienvenue {session?.user?.name} ! 🎬
            </h2>
            <p className="text-gray-300 text-base sm:text-lg">
              Votre cinéma personnel vous attend
            </p>
          </div>

          {/* Genres préférés */}
          {userPreferences.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Vos genres préférés</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {userPreferences.map((genre) => (
                  <div
                    key={genre.id}
                    className="flex items-center space-x-2 px-3 sm:px-4 py-1 sm:py-2 rounded-full border backdrop-blur-sm hover:scale-105 transition-all cursor-pointer"
                    style={{
                      borderColor: genre.color,
                      backgroundColor: `${genre.color}15`
                    }}
                  >
                    <span className="text-base sm:text-lg">{genre.icon}</span>
                    <span className="text-white font-medium text-xs sm:text-sm">{genre.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Section Films Tendances */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
              <span className="text-red-500 mr-2 sm:mr-3">🔥</span>
              Tendances
            </h3>
            <button className="text-red-400 hover:text-red-300 font-semibold text-sm sm:text-base">Voir tout</button>
          </div>
          
          <Carousel 
            movies={trendingMovies} 
            currentIndex={trendingIndex} 
            setCurrentIndex={setTrendingIndex} 
          />
        </div>
      </section>

      {/* Section Recommandations */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
              <span className="text-red-500 mr-2 sm:mr-3">💎</span>
              Recommandé pour vous
            </h3>
            <button className="text-red-400 hover:text-red-300 font-semibold text-sm sm:text-base">Voir tout</button>
          </div>
          
          <Carousel 
            movies={recommendedMovies} 
            currentIndex={recommendedIndex} 
            setCurrentIndex={setRecommendedIndex} 
          />
        </div>
      </section>

      {/* Section Films d'Animation */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-white flex items-center">
              <span className="text-blue-500 mr-2 sm:mr-3">🎨</span>
              Films d'Animation
            </h3>
            <button className="text-red-400 hover:text-red-300 font-semibold text-sm sm:text-base">Voir tout</button>
          </div>
          
          <Carousel 
            movies={animatedMovies} 
            currentIndex={animatedIndex} 
            setCurrentIndex={setAnimatedIndex} 
          />
        </div>
      </section>

    {/* Section Favoris et Ma Liste */}
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-t from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Mes favoris */}
          <div className="bg-gradient-to-br from-pink-900/30 to-red-900/30 border border-pink-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer">
            <div className="text-center">
              <div className="text-4xl sm:text-6xl mb-4">⭐</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Mes films préférés</h3>
              <p className="text-gray-300 mb-6 text-sm sm:text-base">
                Accédez rapidement à vos films et séries favoris
              </p>
              <button 
                onClick={() => router.push('/my-list')}
                className="bg-pink-600 hover:bg-pink-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
              >
                Voir mes favoris
              </button>
            </div>
          </div>

          {/* Ma Liste */}
          <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:scale-105 transition-transform cursor-pointer">
            <div className="text-center">
              <div className="text-4xl sm:text-6xl mb-4">🎯</div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Ma liste personnelle</h3>
              <p className="text-gray-300 mb-6 text-sm sm:text-base">
                Créez votre liste de films à regarder plus tard
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => router.push('/my-list')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  Ma liste
                </button>
                <button 
                  onClick={() => router.push('/browse')}
                  className="bg-transparent border border-red-500 text-red-300 hover:bg-red-500/20 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-colors text-sm sm:text-base"
                >
                  Découvrir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    </div>
  )
}