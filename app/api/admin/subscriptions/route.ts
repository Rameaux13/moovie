import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer tous les abonnements avec les utilisateurs
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        created_at: 'desc' // Plus récents en premier
      }
    })

    // 3. Formater les données pour l'interface admin
    const now = new Date()
    const formattedSubscriptions = subscriptions.map(sub => {
      const endDate = new Date(sub.end_date)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        id: sub.id,
        user: {
          id: sub.user.id,
          name: sub.user.name,
          email: sub.user.email
        },
        plan_type: sub.plan_type,
        status: sub.status,
        start_date: sub.start_date,
        end_date: sub.end_date,
        moneyfusion_subscription_id: sub.moneyfusion_subscription_id,
        created_at: sub.created_at,
        updated_at: sub.updated_at,
        // Calculs utiles
        daysUntilExpiry,
        isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
        isActive: sub.status === 'ACTIVE' && endDate > now
      }
    })

    // 4. Calculer les statistiques et revenus
    const stats = {
      total: formattedSubscriptions.length,
      active: formattedSubscriptions.filter(s => s.isActive).length,
      expired: formattedSubscriptions.filter(s => s.status === 'EXPIRED' || new Date(s.end_date) < now).length,
      expiring_soon: formattedSubscriptions.filter(s => s.isExpiringSoon).length
    }

    // 5. Calculer les revenus par plan (abonnements actifs seulement)
    const activeSubscriptions = formattedSubscriptions.filter(s => s.isActive)
    const revenueByPlan = {
      basic: activeSubscriptions.filter(s => s.plan_type.toLowerCase() === 'basic').length * 200,
      premium: activeSubscriptions.filter(s => s.plan_type.toLowerCase() === 'premium').length * 500,
      family: activeSubscriptions.filter(s => s.plan_type.toLowerCase() === 'family').length * 1000
    }

    const totalRevenue = revenueByPlan.basic + revenueByPlan.premium + revenueByPlan.family

    // 6. Retourner les abonnements avec statistiques
    return NextResponse.json({
      success: true,
      data: formattedSubscriptions,
      stats,
      revenue: {
        total: totalRevenue,
        byPlan: revenueByPlan,
        monthly: totalRevenue // Revenus mensuels (tous les abonnements sont mensuels)
      }
    })

  } catch (error) {
    console.error('❌ Erreur API GET admin/subscriptions:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel abonnement
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer les données du formulaire
    const body = await request.json()
    const { userId, planType } = body

    // 3. Validation des données
    if (!userId || !planType) {
      return NextResponse.json({ 
        error: 'ID utilisateur et type de plan requis' 
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

    // 5. Annuler les abonnements actifs existants pour cet utilisateur
    await prisma.subscription.updateMany({
      where: { 
        user_id: userId,
        status: 'ACTIVE'
      },
      data: { 
        status: 'CANCELLED',
        updated_at: new Date()
      }
    })

    // 6. Créer le nouvel abonnement
    const newSubscription = await prisma.subscription.create({
      data: {
        user_id: userId,
        plan_type: planType.toUpperCase(),
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
        status: 'ACTIVE',
        moneyfusion_subscription_id: `admin_${userId}_${Date.now()}`
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // 7. Mettre à jour le statut de l'utilisateur
    await prisma.user.update({
      where: { id: userId },
      data: { 
        subscription_status: 'ACTIVE',
        updated_at: new Date()
      }
    })

    // 8. Formater la réponse
    const endDate = new Date(newSubscription.end_date)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const formattedSubscription = {
      id: newSubscription.id,
      user: newSubscription.user,
      plan_type: newSubscription.plan_type,
      status: newSubscription.status,
      start_date: newSubscription.start_date,
      end_date: newSubscription.end_date,
      moneyfusion_subscription_id: newSubscription.moneyfusion_subscription_id,
      created_at: newSubscription.created_at,
      updated_at: newSubscription.updated_at,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      isActive: true
    }

    // 9. Retourner l'abonnement créé
    return NextResponse.json({
      success: true,
      message: 'Abonnement créé avec succès',
      data: formattedSubscription
    })

  } catch (error) {
    console.error('❌ Erreur API POST admin/subscriptions:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'abonnement' }, 
      { status: 500 }
    )
  }
}