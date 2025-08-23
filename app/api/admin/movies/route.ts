import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer tous les films avec leurs genres
    const movies = await prisma.video.findMany({
      include: {
        video_genres: {
          include: {
            genre: true
          }
        }
      },
      orderBy: {
        created_at: 'desc' // Plus récents en premier
      }
    })

    // 3. Formater les données pour l'interface admin
    const formattedMovies = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      description: movie.description,
      thumbnail_url: movie.thumbnail_url,
      video_file_path: movie.video_file_path,
      duration: movie.duration,
      rating: movie.rating,
      views: movie.views,
      release_date: movie.release_date,
      created_at: movie.created_at,
      genres: movie.video_genres.map(vg => ({
        id: vg.genre.id,
        name: vg.genre.name,
        color: vg.genre.color
      }))
    }))

    // 4. Retourner les films
    return NextResponse.json({
      success: true,
      data: formattedMovies,
      total: formattedMovies.length
    })

  } catch (error) {
    console.error('❌ Erreur API admin/movies GET:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer les données du formulaire
    const body = await request.json()
    const { title, description } = body

    // 3. Validation des données
    if (!title || !description) {
      return NextResponse.json({ 
        error: 'Titre et description requis' 
      }, { status: 400 })
    }

    // 4. Récupérer le premier genre disponible pour l'assigner par défaut
    const defaultGenre = await prisma.genre.findFirst()
    
    if (!defaultGenre) {
      return NextResponse.json({ 
        error: 'Aucun genre disponible' 
      }, { status: 400 })
    }

    // 5. Créer le film en base de données
    const newMovie = await prisma.video.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        thumbnail_url: '/images/default-thumbnail.jpg',
        video_file_path: 'default.mp4',
        duration: 120,
        rating: 0,
        views: 0,
        release_date: new Date(),
        genre: defaultGenre.name, // Ajouter le genre par défaut
        video_genres: {
          create: {
            genreId: defaultGenre.id // Utiliser genreId au lieu de genre_id
          }
        }
      },
      include: {
        video_genres: {
          include: {
            genre: true
          }
        }
      }
    })

    // 6. Retourner le film créé
    return NextResponse.json({
      success: true,
      message: 'Film ajouté avec succès',
      data: {
        id: newMovie.id,
        title: newMovie.title,
        description: newMovie.description,
        thumbnail_url: newMovie.thumbnail_url,
        video_file_path: newMovie.video_file_path,
        duration: newMovie.duration,
        rating: newMovie.rating,
        views: newMovie.views,
        release_date: newMovie.release_date,
        created_at: newMovie.created_at,
        genres: newMovie.video_genres.map(vg => ({
          id: vg.genre.id,
          name: vg.genre.name,
          color: vg.genre.color
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur API admin/movies POST:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du film' }, 
      { status: 500 }
    )
  }
}