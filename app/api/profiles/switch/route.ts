// app/api/profiles/switch/route.ts
// 🔄 API POUR CHANGER DE PROFIL ACTIF

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Changer le profil actif
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: 'ID du profil requis' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const targetProfileId = parseInt(profileId);

    // Vérifier que le profil appartient à l'utilisateur
    const profile = await prisma.profile.findFirst({
      where: { 
        id: targetProfileId,
        user_id: userId
      }
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le profil actif de l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { active_profile_id: targetProfileId },
      include: {
        active_profile: {
          include: {
            _count: {
              select: {
                favorites: true,
                watch_history: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Profil actif changé avec succès',
      activeProfile: updatedUser.active_profile
    });

  } catch (error) {
    console.error('Erreur POST /api/profiles/switch:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// GET - Récupérer le profil actif actuel
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Récupérer l'utilisateur avec son profil actif
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        active_profile: {
          include: {
            _count: {
              select: {
                favorites: true,
                watch_history: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      activeProfile: user.active_profile,
      activeProfileId: user.active_profile_id
    });

  } catch (error) {
    console.error('Erreur GET /api/profiles/switch:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}