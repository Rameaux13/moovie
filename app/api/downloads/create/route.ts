import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 📥 API pour créer un téléchargement offline
export async function POST(request: NextRequest) {
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
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json(
        { error: 'ID de vidéo requis' },
        { status: 400 }
      );
    }

    // 🎯 Vérifier l'abonnement de l'utilisateur
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

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // 🚫 Vérifier si l'utilisateur a un plan Premium ou Famille
    const activeSubscription = user.subscriptions[0];
    if (!activeSubscription || activeSubscription.plan_type === 'BASIC') {
      return NextResponse.json(
        { 
          error: 'Téléchargement disponible uniquement pour les plans Premium et Famille',
          upgrade_required: true 
        },
        { status: 403 }
      );
    }

    // 🎬 Récupérer les informations de la vidéo
    const video = await prisma.video.findUnique({
      where: { id: parseInt(videoId) }
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Vidéo non trouvée' },
        { status: 404 }
      );
    }

    // 🔍 Vérifier si le téléchargement existe déjà
    const existingDownload = await prisma.download.findFirst({
      where: {
        user_id: userId,
        video_id: parseInt(videoId)
      }
    });

    if (existingDownload) {
      return NextResponse.json(
        { 
          error: 'Ce film est déjà téléchargé',
          existing: true 
        },
        { status: 409 }
      );
    }

    // 📊 Limiter le nombre de téléchargements selon le plan
    const downloadCount = await prisma.download.count({
      where: { 
        user_id: userId,
        is_expired: false 
      }
    });

    const maxDownloads = activeSubscription.plan_type === 'PREMIUM' ? 5 : 10; // Premium: 5, Famille: 10
    if (downloadCount >= maxDownloads) {
      return NextResponse.json(
        { 
          error: `Limite de téléchargements atteinte (${maxDownloads} max pour votre plan)`,
          limit_reached: true 
        },
        { status: 429 }
      );
    }

    // 📁 Vérifier que le fichier vidéo existe
    const originalVideoPath = path.join(process.cwd(), 'public', 'videos', video.video_file_path);
    if (!fs.existsSync(originalVideoPath)) {
      return NextResponse.json(
        { error: 'Fichier vidéo non trouvé sur le serveur' },
        { status: 404 }
      );
    }

    // 🔐 Créer un nom de fichier chiffré unique
    const encryptedFileName = crypto.randomBytes(32).toString('hex') + '.enc';
    const downloadPath = path.join('downloads', encryptedFileName);
    const fullDownloadPath = path.join(process.cwd(), 'public', downloadPath);

    // 📁 Créer le dossier downloads s'il n'existe pas
    const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // 📄 Copier le fichier avec un nom chiffré (simulation du chiffrement)
    fs.copyFileSync(originalVideoPath, fullDownloadPath);

    // 📊 Obtenir la taille du fichier
    const stats = fs.statSync(fullDownloadPath);
    const fileSize = stats.size;

    // 📅 Calculer la date d'expiration (30 jours)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // 💾 Enregistrer en base de données
    const download = await prisma.download.create({
      data: {
        user_id: userId,
        video_id: parseInt(videoId),
        download_path: downloadPath,
        original_title: video.title,
        file_size: BigInt(fileSize),
        expires_at: expiresAt
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail_url: true,
            duration: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `${video.title} téléchargé avec succès !`,
      download: {
        id: download.id,
        title: download.original_title,
        thumbnail: download.video.thumbnail_url,
        duration: download.video.duration,
        file_size: Number(download.file_size),
        download_date: download.download_date,
        expires_at: download.expires_at,
        days_remaining: Math.ceil((download.expires_at.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Erreur création téléchargement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}