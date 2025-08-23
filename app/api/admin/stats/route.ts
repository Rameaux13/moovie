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

    // 2. Récupérer les statistiques depuis la base de données
    const [
      totalUsers,
      totalMovies,
      totalSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      // Compter tous les utilisateurs
      prisma.user.count(),
      
      // Compter tous les films
      prisma.video.count(),
      
      // Compter tous les abonnements
      prisma.subscription.count(),
      
      // Compter les abonnements actifs
      prisma.subscription.count({
        where: {
          status: 'ACTIVE',
          end_date: {
            gt: new Date() // Plus grand que maintenant
          }
        }
      })
    ])

    // 3. Calculer les revenus (simulation basée sur les plans)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: 'ACTIVE' }
    })
    
    let totalRevenue = 0
    subscriptions.forEach(sub => {
      switch(sub.plan_type) {
        case 'basic': totalRevenue += 200; break
        case 'premium': totalRevenue += 500; break  
        case 'family': totalRevenue += 1000; break
      }
    })

    // 4. Retourner les statistiques
    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalMovies, 
        totalSubscriptions,
        activeSubscriptions,
        totalRevenue
      }
    })

  } catch (error) {
    console.error('❌ Erreur API admin/stats:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    )
  }
}