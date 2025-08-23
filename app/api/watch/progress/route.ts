import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Récupérer la progression d'un film pour l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId || isNaN(parseInt(videoId))) {
      return NextResponse.json(
        { error: 'ID de vidéo requis et valide' },
        { status: 400 }
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

    // Récupérer la progression
    const watchHistory = await prisma.watchHistory.findUnique({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: parseInt(videoId)
        }
      }
    });

    return NextResponse.json({
      progress: watchHistory?.progress || 0,
      lastWatched: watchHistory?.watched_at || null
    });

  } catch (error) {
    console.error('Erreur GET progress:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Sauvegarder la progression de visionnage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId, progress } = body;

    // Validation des données
    if (!videoId || typeof videoId !== 'number') {
      return NextResponse.json(
        { error: 'ID de vidéo requis et doit être un nombre' },
        { status: 400 }
      );
    }

    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json(
        { error: 'Progression doit être un nombre entre 0 et 100' },
        { status: 400 }
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

    // Vérifier que la vidéo existe
    const video = await prisma.video.findUnique({
      where: { id: videoId }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // Sauvegarder ou mettre à jour la progression
    const watchHistory = await prisma.watchHistory.upsert({
      where: {
        user_id_video_id: {
          user_id: user.id,
          video_id: videoId
        }
      },
      update: {
        progress: progress,
        watched_at: new Date()
      },
      create: {
        user_id: user.id,
        video_id: videoId,
        progress: progress,
        watched_at: new Date()
      }
    });

    // Si c'est la première fois qu'on regarde cette vidéo, incrémenter les vues
    if (progress > 0 && watchHistory.progress === progress) {
      await prisma.video.update({
        where: { id: videoId },
        data: { views: { increment: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      progress: watchHistory.progress,
      message: 'Progression sauvegardée avec succès'
    });

  } catch (error) {
    console.error('Erreur POST progress:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}