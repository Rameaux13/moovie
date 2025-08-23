import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Modifier un film
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer les données
    const body = await request.json()
    const { title, description } = body
    const movieId = parseInt(params.id)

    // 3. Validation
    if (!title || !description || isNaN(movieId)) {
      return NextResponse.json({ 
        error: 'Données invalides' 
      }, { status: 400 })
    }

    // 4. Vérifier que le film existe
    const existingMovie = await prisma.video.findUnique({
      where: { id: movieId }
    })

    if (!existingMovie) {
      return NextResponse.json({ 
        error: 'Film non trouvé' 
      }, { status: 404 })
    }

    // 5. Mettre à jour le film
    const updatedMovie = await prisma.video.update({
      where: { id: movieId },
      data: {
        title: title.trim(),
        description: description.trim(),
        updated_at: new Date()
      },
      include: {
        video_genres: {
          include: {
            genre: true
          }
        }
      }
    })

    // 6. Retourner le film modifié
    return NextResponse.json({
      success: true,
      message: 'Film modifié avec succès',
      data: {
        id: updatedMovie.id,
        title: updatedMovie.title,
        description: updatedMovie.description,
        thumbnail_url: updatedMovie.thumbnail_url,
        video_file_path: updatedMovie.video_file_path,
        duration: updatedMovie.duration,
        rating: updatedMovie.rating,
        views: updatedMovie.views,
        release_date: updatedMovie.release_date,
        updated_at: updatedMovie.updated_at,
        genres: updatedMovie.video_genres.map(vg => ({
          id: vg.genre.id,
          name: vg.genre.name,
          color: vg.genre.color
        }))
      }
    })

  } catch (error) {
    console.error('❌ Erreur API PUT admin/movies/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du film' }, 
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un film
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer l'ID
    const movieId = parseInt(params.id)

    if (isNaN(movieId)) {
      return NextResponse.json({ 
        error: 'ID invalide' 
      }, { status: 400 })
    }

    // 3. Vérifier que le film existe
    const existingMovie = await prisma.video.findUnique({
      where: { id: movieId }
    })

    if (!existingMovie) {
      return NextResponse.json({ 
        error: 'Film non trouvé' 
      }, { status: 404 })
    }

    // 4. Supprimer d'abord les relations (genres, favoris, historique)
    await prisma.videoGenre.deleteMany({
      where: { videoId: movieId }
    })

    await prisma.favorite.deleteMany({
      where: { video_id: movieId }
    })

    await prisma.watchHistory.deleteMany({
      where: { video_id: movieId }
    })

    // 5. Supprimer le film
    await prisma.video.delete({
      where: { id: movieId }
    })

    // 6. Retourner la confirmation
    return NextResponse.json({
      success: true,
      message: 'Film supprimé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API DELETE admin/movies/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du film' }, 
      { status: 500 }
    )
  }
}