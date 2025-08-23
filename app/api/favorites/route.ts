// app/api/favorites/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les favoris de l'utilisateur connecté
export async function GET() {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les favoris avec les informations des films
    const favorites = await prisma.favorite.findMany({
      where: { user_id: user.id },
      include: {
        video: true
      },
      orderBy: {
        added_at: 'desc' // Plus récents en premier
      }
    })

    // Formater les données pour le frontend
    const formattedFavorites = favorites.map(favorite => ({
      id: favorite.video.id,
      title: favorite.video.title,
      description: favorite.video.description,
      duration: favorite.video.duration,
      release_date: favorite.video.release_date,
      thumbnail_url: favorite.video.thumbnail_url,
      rating: favorite.video.rating,
      views_count: favorite.video.views_count,
      genre: favorite.video.genre,
      added_at: favorite.added_at
    }))

    return NextResponse.json({
      success: true,
      favorites: formattedFavorites,
      count: formattedFavorites.length
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Ajouter un film aux favoris
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const { movieId } = await request.json()

    if (!movieId) {
      return NextResponse.json(
        { success: false, error: 'ID du film requis' },
        { status: 400 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le film existe
    const video = await prisma.video.findUnique({
      where: { id: parseInt(movieId) }
    })

    if (!video) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier si le film n'est pas déjà en favoris
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: parseInt(movieId)
        }
      }
    })

    if (existingFavorite) {
      return NextResponse.json(
        { success: false, error: 'Film déjà dans vos favoris' },
        { status: 409 }
      )
    }

    // Ajouter aux favoris
    const newFavorite = await prisma.favorite.create({
      data: {
        user_id: user.id,
        video_id: parseInt(movieId)
      },
      include: {
        video: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Film ajouté à vos favoris',
      favorite: {
        id: newFavorite.video.id,
        title: newFavorite.video.title,
        added_at: newFavorite.added_at
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un film des favoris
export async function DELETE(request: Request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les données de la requête
    const { movieId } = await request.json()

    if (!movieId) {
      return NextResponse.json(
        { success: false, error: 'ID du film requis' },
        { status: 400 }
      )
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que le favori existe
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: parseInt(movieId)
        }
      }
    })

    if (!existingFavorite) {
      return NextResponse.json(
        { success: false, error: 'Film non trouvé dans vos favoris' },
        { status: 404 }
      )
    }

    // Supprimer des favoris
    await prisma.favorite.delete({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: parseInt(movieId)
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Film supprimé de vos favoris'
    })

  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}