// app/api/browse/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genreFilter = searchParams.get('genre')

    // Si un genre spécifique est demandé
    if (genreFilter && genreFilter !== 'Tous les genres') {
      const videosByGenre = await prisma.video.findMany({
        where: {
          video_genres: {  // ← CORRIGÉ
            some: {
              genre: {
                name: genreFilter
              }
            }
          }
        },
        include: {
          video_genres: {  // ← CORRIGÉ
            include: {
              genre: true
            }
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

    // Sinon, récupérer tous les films organisés par genres
    const genres = await prisma.genre.findMany({
      include: {
        videoGenres: {  // ← ATTENTION : Ici c'est l'autre sens de la relation
          include: {
            video: true
          },
          take: 10 // Limiter à 10 films par genre pour le catalogue
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Restructurer les données pour avoir films par genre
    const moviesByGenre = genres.map(genre => ({
      id: genre.id,
      name: genre.name,
      color: genre.color,
      icon: genre.icon,
      movies: genre.videoGenres.map(vg => vg.video)  // ← CORRIGÉ
    })).filter(genre => genre.movies.length > 0) // Seulement les genres qui ont des films

    // Récupérer aussi tous les films récents (pour section "Nouveautés")
    const recentMovies = await prisma.video.findMany({
      take: 20,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        video_genres: {  // ← CORRIGÉ
          include: {
            genre: true
          }
        }
      }
    })

    // Récupérer les films les plus populaires (simulation avec ceux qui ont le plus de vues)
    const popularMovies = await prisma.video.findMany({
      take: 20,
      orderBy: {
        views: 'desc'  // ← CORRIGÉ
      },
      include: {
        video_genres: {  // ← CORRIGÉ
          include: {
            genre: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      moviesByGenre,
      recentMovies,
      popularMovies,
      totalGenres: genres.length
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des films:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des films' 
      },
      { status: 500 }
    )
  }
}