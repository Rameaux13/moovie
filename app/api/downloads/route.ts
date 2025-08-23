import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 📂 API pour lister les téléchargements de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    // 🔐 Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 🔄 Mettre à jour les téléchargements expirés
    await prisma.download.updateMany({
      where: {
        user_id: userId,
        expires_at: { lt: new Date() },
        is_expired: false
      },
      data: {
        is_expired: true
      }
    });

    // 📂 Récupérer tous les téléchargements actifs de l'utilisateur
    const downloads = await prisma.download.findMany({
      where: {
        user_id: userId,
        is_expired: false
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            duration: true,
            genre: true,
            rating: true
          }
        }
      },
      orderBy: {
        download_date: 'desc'
      }
    });

    // 📊 Calculer les statistiques
    const totalDownloads = downloads.length;
    const totalSize = downloads.reduce((sum, download) => sum + Number(download.file_size), 0);
    
    // 🎯 Obtenir les limites selon le plan de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            end_date: { gt: new Date() }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    const activeSubscription = user?.subscriptions[0];
    const maxDownloads = activeSubscription?.plan_type === 'PREMIUM' ? 5 : 
                        activeSubscription?.plan_type === 'FAMILLE' ? 10 : 0;

    // 📝 Formater les données pour le frontend
    const formattedDownloads = downloads.map(download => ({
      id: download.id,
      title: download.original_title,
      thumbnail: download.video.thumbnail_url,
      duration: download.video.duration,
      genre: download.video.genre,
      rating: download.video.rating,
      videoId: download.video.id,
      file_size: Number(download.file_size),
      file_size_mb: Math.round(Number(download.file_size) / (1024 * 1024)),
      download_date: download.download_date,
      expires_at: download.expires_at,
      days_remaining: Math.max(0, Math.ceil((download.expires_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
      is_expiring_soon: Math.ceil((download.expires_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3
    }));

    return NextResponse.json({
      success: true,
      downloads: formattedDownloads,
      stats: {
        total_downloads: totalDownloads,
        max_downloads: maxDownloads,
        remaining_slots: Math.max(0, maxDownloads - totalDownloads),
        total_size_mb: Math.round(totalSize / (1024 * 1024)),
        plan_type: activeSubscription?.plan_type || 'BASIC'
      }
    });

  } catch (error) {
    console.error('Erreur récupération téléchargements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}