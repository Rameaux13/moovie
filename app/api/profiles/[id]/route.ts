// app/api/profiles/[id]/route.ts
// 👤 API GESTION PROFIL INDIVIDUEL

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT - Modifier un profil
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const profileId = parseInt(params.id);
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

    // Vérifier que le profil appartient à l'utilisateur
    const existingProfile = await prisma.profile.findFirst({
      where: { 
        id: profileId,
        user_id: userId
      }
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du nom (sauf pour le profil actuel)
    const duplicateName = await prisma.profile.findFirst({
      where: {
        user_id: userId,
        name: { equals: name.trim(), mode: 'insensitive' },
        id: { not: profileId }
      }
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: 'Ce nom de profil existe déjà' },
        { status: 400 }
      );
    }

    // Mettre à jour le profil
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        name: name.trim(),
        is_child: is_child !== undefined ? is_child : existingProfile.is_child,
        avatar_url: avatar_url !== undefined ? avatar_url : existingProfile.avatar_url
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

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error('Erreur PUT /api/profiles/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un profil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const profileId = parseInt(params.id);
    const userId = parseInt(session.user.id);

    // Vérifier que le profil appartient à l'utilisateur
    const existingProfile = await prisma.profile.findFirst({
      where: { 
        id: profileId,
        user_id: userId
      }
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      );
    }

    // Interdire la suppression du profil principal
    if (existingProfile.is_main) {
      return NextResponse.json(
        { error: 'Impossible de supprimer le profil principal' },
        { status: 400 }
      );
    }

    // Vérifier s'il reste au moins 1 profil après suppression
    const totalProfiles = await prisma.profile.count({
      where: { user_id: userId }
    });

    if (totalProfiles <= 1) {
      return NextResponse.json(
        { error: 'Vous devez conserver au moins un profil' },
        { status: 400 }
      );
    }

    // Si le profil à supprimer est le profil actif, changer pour le profil principal
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { active_profile_id: true }
    });

    if (user?.active_profile_id === profileId) {
      const mainProfile = await prisma.profile.findFirst({
        where: {
          user_id: userId,
          is_main: true
        }
      });

      if (mainProfile) {
        await prisma.user.update({
          where: { id: userId },
          data: { active_profile_id: mainProfile.id }
        });
      }
    }

    // Supprimer le profil (cascade supprimera automatiquement favoris, historique, etc.)
    await prisma.profile.delete({
      where: { id: profileId }
    });

    return NextResponse.json({ message: 'Profil supprimé avec succès' });

  } catch (error) {
    console.error('Erreur DELETE /api/profiles/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}