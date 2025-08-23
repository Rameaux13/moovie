import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Modifier/renouveler/annuler un abonnement
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
    const { action, planType } = body
    const subscriptionId = parseInt(params.id)

    // 3. Validation
    if (!action || isNaN(subscriptionId)) {
      return NextResponse.json({ 
        error: 'Action et ID abonnement requis' 
      }, { status: 400 })
    }

    // 4. Vérifier que l'abonnement existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        user: true
      }
    })

    if (!existingSubscription) {
      return NextResponse.json({ 
        error: 'Abonnement non trouvé' 
      }, { status: 404 })
    }

    let result = {}

    // 5. Traiter l'action demandée
    switch (action) {
      case 'renew':
        // Prolonger l'abonnement de 30 jours
        const renewedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            end_date: new Date(existingSubscription.end_date.getTime() + 30 * 24 * 60 * 60 * 1000),
            status: 'ACTIVE',
            updated_at: new Date()
          },
          include: {
            user: true
          }
        })

        // Mettre à jour le statut de l'utilisateur
        await prisma.user.update({
          where: { id: existingSubscription.user_id },
          data: { 
            subscription_status: 'ACTIVE',
            updated_at: new Date()
          }
        })

        result = {
          action: 'renewed',
          subscription: renewedSubscription,
          message: 'Abonnement renouvelé pour 30 jours supplémentaires'
        }
        break

      case 'update':
        if (!planType) {
          return NextResponse.json({ 
            error: 'Type de plan requis pour la modification' 
          }, { status: 400 })
        }

        // Mettre à jour le plan de l'abonnement
        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            plan_type: planType.toUpperCase(),
            updated_at: new Date()
          },
          include: {
            user: true
          }
        })

        result = {
          action: 'updated',
          subscription: updatedSubscription,
          message: `Plan modifié vers ${planType} avec succès`
        }
        break

      case 'cancel':
        // Annuler l'abonnement
        const cancelledSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'CANCELLED',
            updated_at: new Date()
          },
          include: {
            user: true
          }
        })

        // Mettre à jour le statut de l'utilisateur si c'est son seul abonnement actif
        const activeSubscriptions = await prisma.subscription.count({
          where: {
            user_id: existingSubscription.user_id,
            status: 'ACTIVE',
            id: { not: subscriptionId }
          }
        })

        if (activeSubscriptions === 0) {
          await prisma.user.update({
            where: { id: existingSubscription.user_id },
            data: { 
              subscription_status: 'INACTIVE',
              updated_at: new Date()
            }
          })
        }

        result = {
          action: 'cancelled',
          subscription: cancelledSubscription,
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
    console.error('❌ Erreur API PUT admin/subscriptions/[id]:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la gestion de l\'abonnement' }, 
      { status: 500 }
    )
  }
}