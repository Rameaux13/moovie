// app/api/profiles/route.ts
// 👨‍👩‍👧‍👦 API GESTION PROFILS FAMILLE

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer tous les profils de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les profils de l'utilisateur
    const profiles = await prisma.profile.findMany({
      where: { user_id: parseInt(session.user.id) },
      orderBy: [
        { is_main: 'desc' },  // Profil principal en premier
        { created_at: 'asc' }
      ],
      include: {
        _count: {
          select: {
            favorites: true,
            watch_history: true
          }
        }
      }
    });

    // Récupérer l'utilisateur avec son profil actif
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { active_profile_id: true, subscription_status: true }
    });

    return NextResponse.json({
      profiles,
      activeProfileId: user?.active_profile_id,
      subscriptionStatus: user?.subscription_status
    });

  } catch (error) {
    console.error('Erreur GET /api/profiles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau profil
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { name, is_child, avatar_url } = await request.json();

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le nom du profil est requis' },
        { status: 400 }
      );
    }

    if (name.length > 20) {
      return NextResponse.json(
        { error: 'Le nom ne peut pas dépasser 20 caractères' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Vérifier le nombre de profils existants
    const existingProfiles = await prisma.profile.count({
      where: { user_id: userId }
    });

    // Vérifier la limite selon l'abonnement
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    const activeSub = user?.subscriptions[0];
    let maxProfiles = 1; // Basic par défaut

    if (activeSub?.plan_type === 'PREMIUM') {
      maxProfiles = 3;
    } else if (activeSub?.plan_type === 'FAMILLE') {
      maxProfiles = 5;
    }

    if (existingProfiles >= maxProfiles) {
      return NextResponse.json(
        { 
          error: `Limite de ${maxProfiles} profils atteinte pour votre plan`,
          planType: activeSub?.plan_type || 'BASIC'
        },
        { status: 403 }
      );
    }

    // Vérifier l'unicité du nom pour cet utilisateur
    const existingName = await prisma.profile.findFirst({
      where: {
        user_id: userId,
        name: { equals: name.trim(), mode: 'insensitive' }
      }
    });

    if (existingName) {
      return NextResponse.json(
        { error: 'Ce nom de profil existe déjà' },
        { status: 400 }
      );
    }

    // Créer le profil
    const newProfile = await prisma.profile.create({
      data: {
        user_id: userId,
        name: name.trim(),
        is_child: is_child || false,
        avatar_url: avatar_url || null
      },
      include: {
        _count: {
          select: {
            favorites: true,
            watch_history: true
          }
        }
      }
    });

    return NextResponse.json(newProfile, { status: 201 });

  } catch (error) {
    console.error('Erreur POST /api/profiles:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}