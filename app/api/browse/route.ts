// app/api/browse/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {

   useEffect(() => {
    console.log('🎬 DATA REÇUE:', data)
    if (data?.moviesByGenre) {
      console.log('🎭 GENRES DISPONIBLES:', data.moviesByGenre.map(g => g.name))
      console.log('🎥 TOTAL FILMS:', data.moviesByGenre.reduce((acc, g) => acc + g.movies.length, 0))
    }
  }, [data])

  try {
    const { searchParams } = new URL(request.url)
    const genreFilter = searchParams.get('genre')

    // ✅ NOUVEAU : Si un genre spécifique est demandé (filtrage simple par colonne genre)
    if (genreFilter && genreFilter !== 'Tous les genres') {
      const videosByGenre = await prisma.video.findMany({
        where: {
          genre: {
            contains: genreFilter,
            mode: 'insensitive' // Recherche insensible à la casse
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      return NextResponse.json({
        success: true,
        videos: videosByGenre,
        genre: genreFilter
      })
    }

    // ✅ NOUVEAU : Récupérer tous les films et les organiser par genre
    const allVideos = await prisma.video.findMany({
      orderBy: {
        created_at: 'desc'
      }
    })

    // ✅ NOUVEAU : Grouper les films par genre
    const genreMap = new Map<string, typeof allVideos>()
    
    allVideos.forEach(video => {
      const genre = video.genre || 'Autre'
      if (!genreMap.has(genre)) {
        genreMap.set(genre, [])
      }
      genreMap.get(genre)!.push(video)
    })

    // ✅ NOUVEAU : Convertir en format attendu par le frontend
    const moviesByGenre = Array.from(genreMap.entries()).map(([genreName, movies], index) => {
      // Icônes par genre
      const genreIcons: Record<string, string> = {
        'Action': '💥',
        'Romance': '💕', 
        'Comédie': '😂',
        'Drame': '🎭',
        'Horreur': '👻',
        'Science-Fiction': '🚀',
        'Thriller': '🔪',
        'Aventure': '⚔️',
        'Animation': '🎨',
        'Documentaire': '📽️',
        'Fantastique': '🧙‍♂️',
        'Autre': '🎬'
      }

      return {
        id: `genre-${index}`,
        name: genreName,
        color: '#dc2626', // Rouge Netflix
        icon: genreIcons[genreName] || '🎬',
        movies: movies.slice(0, 12) // Limiter à 12 films par genre
      }
    }).filter(genre => genre.movies.length > 0)

    // ✅ NOUVEAU : Films récents (20 plus récents)
    const recentMovies = allVideos
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)

    // ✅ NOUVEAU : Films populaires (triés par vues, puis par rating)
    const popularMovies = allVideos
      .sort((a, b) => {
        // Trier par vues d'abord, puis par rating
        const viewDiff = (b.views || 0) - (a.views || 0)
        if (viewDiff !== 0) return viewDiff
        return (b.rating || 0) - (a.rating || 0)
      })
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      moviesByGenre,
      recentMovies,
      popularMovies,
      totalMovies: allVideos.length,
      totalGenres: moviesByGenre.length
    })

  } catch (error) {
    console.error('❌ Erreur API browse:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des films',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}