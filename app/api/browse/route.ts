// app/api/browse/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genreFilter = searchParams.get('genre')

    console.log('🎬 API Browse appelée, genre:', genreFilter) // Debug

    // Si un genre spécifique est demandé
    if (genreFilter && genreFilter !== 'Tous les genres') {
      const videosByGenre = await prisma.video.findMany({
        where: {
          genre: {
            contains: genreFilter,
            mode: 'insensitive'
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      })

      console.log(`📽️ Films trouvés pour "${genreFilter}":`, videosByGenre.length) // Debug

      return NextResponse.json({
        success: true,
        videos: videosByGenre,
        genre: genreFilter
      })
    }

    // Récupérer tous les films
    const allVideos = await prisma.video.findMany({
      orderBy: {
        created_at: 'desc'
      }
    })

    console.log('🎥 Total films en base:', allVideos.length) // Debug
    console.log('🎭 Genres uniques:', [...new Set(allVideos.map(v => v.genre))]) // Debug

    // Grouper par genre
    const genreMap = new Map<string, typeof allVideos>()
    
    allVideos.forEach(video => {
      const genre = video.genre || 'Autre'
      if (!genreMap.has(genre)) {
        genreMap.set(genre, [])
      }
      genreMap.get(genre)!.push(video)
    })

    // Convertir en format attendu
    const moviesByGenre = Array.from(genreMap.entries()).map(([genreName, movies], index) => {
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
        color: '#dc2626',
        icon: genreIcons[genreName] || '🎬',
        movies: movies.slice(0, 12)
      }
    }).filter(genre => genre.movies.length > 0)

    const recentMovies = allVideos.slice(0, 20)
    const popularMovies = [...allVideos]
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 20)

    console.log('✅ Réponse API:', {
      totalMovies: allVideos.length,
      totalGenres: moviesByGenre.length,
      genres: moviesByGenre.map(g => `${g.name} (${g.movies.length} films)`)
    }) // Debug

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
        error: 'Erreur lors de la récupération des films'
      },
      { status: 500 }
    )
  }
}