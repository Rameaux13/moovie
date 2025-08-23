import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Modifier un utilisateur
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
    const { name, email, role } = body
    const userId = parseInt(params.id)

    // 3. Validation
    if (!name || !email || !role || isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Données invalides' 
      }, { status: 400 })
    }

    // 4. Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    // 5. Vérifier l'unicité de l'email (sauf pour l'utilisateur actuel)
    const emailExists = await prisma.user.findFirst({
      where: { 
        email: email.trim().toLowerCase(),
        NOT: { id: userId }
      }
    })

    if (emailExists) {
      return NextResponse.json({ 
        error: 'Un autre utilisateur utilise déjà cet email' 
      }, { status: 400 })
    }

    // 6. Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role,
        updated_at: new Date()
      }
    })

    // 7. Retourner l'utilisateur modifié
    return NextResponse.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        subscription_status: updatedUser.subscription_status,
        preferencesCompleted: updatedUser.preferencesCompleted,
        updated_at: updatedUser.updated_at
      }
    })

  } catch (error) {
    console.error('❌ Erreur API PUT admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification de l\'utilisateur' }, 
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
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
    const userId = parseInt(params.id)

    if (isNaN(userId)) {
      return NextResponse.json({ 
        error: 'ID invalide' 
      }, { status: 400 })
    }

    // 3. Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json({ 
        error: 'Utilisateur non trouvé' 
      }, { status: 404 })
    }

    // 4. Empêcher la suppression de son propre compte
    if (parseInt(session.user.id) === userId) {
      return NextResponse.json({ 
        error: 'Vous ne pouvez pas supprimer votre propre compte' 
      }, { status: 400 })
    }

    // 5. Supprimer toutes les données liées
    await prisma.passwordResetToken.deleteMany({
      where: { userId: userId }
    })

    await prisma.userPreference.deleteMany({
      where: { userId: userId }
    })

    await prisma.favorite.deleteMany({
      where: { user_id: userId }
    })

    await prisma.watchHistory.deleteMany({
      where: { user_id: userId }
    })

    await prisma.subscription.deleteMany({
      where: { user_id: userId }
    })

    // 6. Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: userId }
    })

    // 7. Retourner la confirmation
    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur API DELETE admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur' }, 
      { status: 500 }
    )
  }
}