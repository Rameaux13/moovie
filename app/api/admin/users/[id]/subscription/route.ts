import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Gérer les abonnements (activer, renouveler, annuler)
export async function POST(
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
    const { action, planType } = body
    const userId = parseInt(params.id)

    // 3. Validation
    if (!action || isNaN(userId)) {
      return NextResponse.json({ 
        error: 'Action et ID utilisateur requis' 
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

    let result = {}

    // 5. Traiter l'action demandée
    switch (action) {
      case 'activate':
        if (!planType) {
          return NextResponse.json({ 
            error: 'Type de plan requis pour l\'activation' 
          }, { status: 400 })
        }

        // Annuler l'abonnement actuel s'il existe
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

        // Créer le nouvel abonnement
        const newSubscription = await prisma.subscription.create({
          data: {
            user_id: userId,
            plan_type: planType.toUpperCase(),
            start_date: new Date(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
            status: 'ACTIVE',
            moneyfusion_subscription_id: `admin_${userId}_${Date.now()}`
          }
        })

        // Mettre à jour le statut de l'utilisateur
        await prisma.user.update({
          where: { id: userId },
          data: { 
            subscription_status: 'ACTIVE',
            updated_at: new Date()
          }
        })

        result = {
          action: 'activated',
          subscription: newSubscription,
          message: `Abonnement ${planType} activé avec succès`
        }
        break

      case 'renew':
        // Trouver l'abonnement actif
        const activeSubscription = await prisma.subscription.findFirst({
          where: {
            user_id: userId,
            status: 'ACTIVE'
          }
        })

        if (!activeSubscription) {
          return NextResponse.json({ 
            error: 'Aucun abonnement actif à renouveler' 
          }, { status: 400 })
        }

        // Prolonger l'abonnement de 30 jours
        const renewedSubscription = await prisma.subscription.update({
          where: { id: activeSubscription.id },
          data: {
            end_date: new Date(activeSubscription.end_date.getTime() + 30 * 24 * 60 * 60 * 1000),
            updated_at: new Date()
          }
        })

        result = {
          action: 'renewed',
          subscription: renewedSubscription,
          message: 'Abonnement renouvelé pour 30 jours supplémentaires'
        }
        break

      case 'cancel':
        // Annuler tous les abonnements actifs
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

        // Mettre à jour le statut de l'utilisateur
        await prisma.user.update({
          where: { id: userId },
          data: { 
            subscription_status: 'INACTIVE',
            updated_at: new Date()
          }
        })

        result = {
          action: 'cancelled',
          message: 'Abonnement annulé avec succès'
        }
        break

      default:
        return NextResponse.json({ 
          error: 'Action non reconnue' 
        }, { status: 400 })
    }

    // 6. Retourner le résultat
    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('❌ Erreur API POST admin/users/[id]/subscription:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la gestion de l\'abonnement' }, 
      { status: 500 }
    )
  }
}