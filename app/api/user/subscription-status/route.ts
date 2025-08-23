import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        hasActiveSubscription: false,
        error: 'Non authentifié'
      }, { status: 401 });
    }

    // Récupérer l'utilisateur avec son abonnement
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(session.user.id)
      },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE'
          },
          orderBy: {
            end_date: 'desc'
          },
          take: 1 // Prendre le plus récent
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        hasActiveSubscription: false,
        error: 'Utilisateur non trouvé'
      }, { status: 404 });
    }

    // Vérifier s'il y a un abonnement actif
    const activeSubscription = user.subscriptions[0];
    
    if (!activeSubscription) {
      // Pas d'abonnement du tout
      return NextResponse.json({
        hasActiveSubscription: false,
        reason: 'Aucun abonnement trouvé',
        userStatus: user.subscription_status
      });
    }

    // Vérifier si l'abonnement n'est pas expiré
    const now = new Date();
    const isExpired = new Date(activeSubscription.end_date) < now;

    if (isExpired) {
      // Abonnement expiré - mettre à jour le statut
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { status: 'EXPIRED' }
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { subscription_status: 'EXPIRED' }
      });

      return NextResponse.json({
        hasActiveSubscription: false,
        reason: 'Abonnement expiré',
        expiredDate: activeSubscription.end_date
      });
    }

    // Abonnement actif et valide
    return NextResponse.json({
      hasActiveSubscription: true,
      subscription: {
        id: activeSubscription.id,
        planType: activeSubscription.plan_type,
        status: activeSubscription.status,
        startDate: activeSubscription.start_date,
        endDate: activeSubscription.end_date,
        daysRemaining: Math.ceil((new Date(activeSubscription.end_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      },
      userStatus: user.subscription_status
    });

  } catch (error) {
    console.error('❌ Erreur vérification abonnement:', error);
    
    return NextResponse.json({
      hasActiveSubscription: false,
      error: 'Erreur lors de la vérification de l\'abonnement',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Autres méthodes non autorisées
export async function POST() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}