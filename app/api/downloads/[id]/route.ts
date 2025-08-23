import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

// 🗑️ API pour supprimer un téléchargement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const downloadId = parseInt(params.id);

    if (isNaN(downloadId)) {
      return NextResponse.json(
        { error: 'ID de téléchargement invalide' },
        { status: 400 }
      );
    }

    // 🔍 Récupérer le téléchargement
    const download = await prisma.download.findFirst({
      where: {
        id: downloadId,
        user_id: userId // Sécurité : seulement les téléchargements de l'utilisateur
      },
      include: {
        video: {
          select: {
            title: true
          }
        }
      }
    });

    if (!download) {
      return NextResponse.json(
        { error: 'Téléchargement non trouvé' },
        { status: 404 }
      );
    }

    // 📁 Supprimer le fichier physique du serveur
    const fullFilePath = path.join(process.cwd(), 'public', download.download_path);
    
    try {
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
        console.log(`Fichier supprimé: ${download.download_path}`);
      }
    } catch (fileError) {
      console.error('Erreur suppression fichier:', fileError);
      // On continue même si la suppression du fichier échoue
    }

    // 🗄️ Supprimer l'enregistrement de la base de données
    await prisma.download.delete({
      where: {
        id: downloadId
      }
    });

    return NextResponse.json({
      success: true,
      message: `"${download.video.title}" supprimé de vos téléchargements`
    });

  } catch (error) {
    console.error('Erreur suppression téléchargement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// 📋 API pour obtenir les détails d'un téléchargement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const downloadId = parseInt(params.id);

    if (isNaN(downloadId)) {
      return NextResponse.json(
        { error: 'ID de téléchargement invalide' },
        { status: 400 }
      );
    }

    // 🔍 Récupérer le téléchargement avec détails
    const download = await prisma.download.findFirst({
      where: {
        id: downloadId,
        user_id: userId
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail_url: true,
            duration: true,
            genre: true,
            rating: true,
            release_date: true
          }
        }
      }
    });

    if (!download) {
      return NextResponse.json(
        { error: 'Téléchargement non trouvé' },
        { status: 404 }
      );
    }

    // 🕐 Vérifier si expiré
    const isExpired = download.expires_at < new Date();
    
    if (isExpired && !download.is_expired) {
      // Marquer comme expiré
      await prisma.download.update({
        where: { id: downloadId },
        data: { is_expired: true }
      });
    }

    // 📊 Formater les données
    const formattedDownload = {
      id: download.id,
      title: download.original_title,
      description: download.video.description,
      thumbnail: download.video.thumbnail_url,
      duration: download.video.duration,
      genre: download.video.genre,
      rating: download.video.rating,
      release_date: download.video.release_date,
      videoId: download.video.id,
      file_size: Number(download.file_size),
      file_size_mb: Math.round(Number(download.file_size) / (1024 * 1024)),
      download_date: download.download_date,
      expires_at: download.expires_at,
      is_expired: isExpired || download.is_expired,
      days_remaining: Math.max(0, Math.ceil((download.expires_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))),
      is_expiring_soon: Math.ceil((download.expires_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3
    };

    return NextResponse.json({
      success: true,
      download: formattedDownload
    });

  } catch (error) {
    console.error('Erreur récupération téléchargement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}