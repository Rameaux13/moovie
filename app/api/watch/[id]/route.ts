 import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const movieId = parseInt(params.id);
    
    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: 'ID de film invalide' },
        { status: 400 }
      );
    }

    // Récupérer le film avec ses genres
    const movie = await prisma.video.findUnique({
      where: { id: movieId },
      include: {
        video_genres: {
          include: {
            genre: true
          }
        }
      }
    });

    if (!movie) {
      return NextResponse.json(
        { error: 'Film non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer la progression existante
    const watchHistory = await prisma.watchHistory.findUnique({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: movieId
        }
      }
    });

    // Récupérer des films recommandés du même genre
    const movieGenres = movie.video_genres.map(vg => vg.genreId);
    const relatedMovies = await prisma.video.findMany({
      where: {
        id: { not: movieId },
        video_genres: {
          some: {
            genreId: { in: movieGenres }
          }
        }
      },
      include: {
        video_genres: {
          include: {
            genre: true
          }
        }
      },
      take: 4,
      orderBy: { views: 'desc' }
    });

    // Vérifier si l'utilisateur a ce film en favoris
    const isFavorite = await prisma.favorite.findUnique({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: movieId
        }
      }
    });

    // Déterminer le contexte de retour depuis l'URL
    const { searchParams } = new URL(request.url);
    const returnContext = searchParams.get('from') || 'home';

    const response = {
      movie: {
        id: movie.id,
        title: movie.title,
        description: movie.description,
        duration: movie.duration,
        release_date: movie.release_date,
        thumbnail_url: movie.thumbnail_url,
        video_file_path: movie.video_file_path,
        rating: movie.rating,
        views: movie.views,
        genres: movie.video_genres.map(vg => ({
          id: vg.genre.id,
          name: vg.genre.name,
          color: vg.genre.color,
          icon: vg.genre.icon
        }))
      },
      userProgress: watchHistory?.progress || 0,
      continueWatching: watchHistory ? watchHistory.progress < 95 : false,
      isFavorite: !!isFavorite,
      relatedMovies: relatedMovies.map(rm => ({
        id: rm.id,
        title: rm.title,
        thumbnail_url: rm.thumbnail_url,
        rating: rm.rating,
        duration: rm.duration,
        genres: rm.video_genres.map(vg => vg.genre.name)
      })),
      returnContext
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur API watch:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}