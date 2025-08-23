import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Interface pour les données MoneyFusion
interface MoneyFusionWebhookData {
  event: 'payin.session.pending' | 'payin.session.completed' | 'payin.session.cancelled';
  personal_Info: Array<{
    userId?: string;
    planId?: string;
    planName?: string;
    userEmail?: string;
  }>;
  tokenPay: string;
  numeroSend: string;
  nomclient: string;
  numeroTransaction: string;
  Montant: number;
  frais: number;
  return_url: string;
  webhook_url: string;
  createdAt: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Webhook MoneyFusion reçu');

    // Récupérer les données du webhook
    const webhookData: MoneyFusionWebhookData = await request.json();
    
    console.log('📋 Données webhook:', {
      event: webhookData.event,
      tokenPay: webhookData.tokenPay,
      transaction: webhookData.numeroTransaction,
      montant: webhookData.Montant,
      client: webhookData.nomclient
    });

    // Extraire les informations utilisateur
    const personalInfo = webhookData.personal_Info?.[0] || {};
    const userId = personalInfo.userId;
    const planId = personalInfo.planId;
    const planName = personalInfo.planName;

    if (!userId) {
      console.log('⚠️ Webhook ignoré: userId manquant');
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook reçu mais userId manquant' 
      });
    }

    // Vérifier si la transaction existe déjà
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        moneyfusion_subscription_id: webhookData.numeroTransaction
      }
    });

    // Traitement selon le type d'événement
    switch (webhookData.event) {
      case 'payin.session.pending':
        console.log('⏳ Paiement en cours...');
        
        if (!existingSubscription) {
          // Créer un abonnement en attente
          await prisma.subscription.create({
            data: {
              user_id: parseInt(userId),
              plan_type: mapPlanIdToType(planId),
              start_date: new Date(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
              status: 'PENDING',
              moneyfusion_subscription_id: webhookData.numeroTransaction,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          
          console.log('✅ Abonnement PENDING créé pour utilisateur:', userId);
        } else {
          console.log('ℹ️ Abonnement déjà existant, statut maintenu');
        }
        break;

      case 'payin.session.completed':
        console.log('🎉 Paiement réussi !');
        
        if (existingSubscription) {
          // Mettre à jour l'abonnement existant
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'ACTIVE',
              updated_at: new Date()
            }
          });
          
          console.log('✅ Abonnement activé:', existingSubscription.id);
        } else {
          // Créer un nouvel abonnement actif
          await prisma.subscription.create({
            data: {
              user_id: parseInt(userId),
              plan_type: mapPlanIdToType(planId),
              start_date: new Date(),
              end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
              status: 'ACTIVE',
              moneyfusion_subscription_id: webhookData.numeroTransaction,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          
          console.log('✅ Nouvel abonnement ACTIVE créé pour utilisateur:', userId);
        }

        // Mettre à jour le statut utilisateur
        await prisma.user.update({
          where: { id: parseInt(userId) },
          data: { subscription_status: 'ACTIVE' }
        });
        
        console.log('✅ Statut utilisateur mis à jour: ACTIVE');
        break;

      case 'payin.session.cancelled':
        console.log('❌ Paiement annulé ou échoué');
        
        if (existingSubscription && existingSubscription.status === 'PENDING') {
          // Annuler l'abonnement en attente
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: 'CANCELLED',
              updated_at: new Date()
            }
          });
          
          console.log('❌ Abonnement annulé:', existingSubscription.id);
        }

        // Vérifier s'il a d'autres abonnements actifs
        const activeSubscriptions = await prisma.subscription.findMany({
          where: {
            user_id: parseInt(userId),
            status: 'ACTIVE'
          }
        });

        if (activeSubscriptions.length === 0) {
          // Aucun abonnement actif, mettre à jour le statut utilisateur
          await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { subscription_status: 'INACTIVE' }
          });
          
          console.log('❌ Statut utilisateur mis à jour: INACTIVE');
        }
        break;

      default:
        console.log('⚠️ Événement webhook non géré:', webhookData.event);
    }

    // Log de la transaction pour monitoring
    console.log('📊 Transaction webhook traitée:', {
      event: webhookData.event,
      userId: userId,
      planId: planId,
      transaction: webhookData.numeroTransaction,
      montant: webhookData.Montant,
      timestamp: new Date().toISOString()
    });

    // Réponse de succès à MoneyFusion
    return NextResponse.json({
      success: true,
      message: `Webhook ${webhookData.event} traité avec succès`,
      transactionId: webhookData.numeroTransaction
    });

  } catch (error) {
    console.error('❌ Erreur webhook MoneyFusion:', error);
    
    // Même en cas d'erreur, on répond 200 à MoneyFusion pour éviter les retry
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du traitement du webhook',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 200 }); // 200 pour éviter les retry MoneyFusion
  }
}

// Fonction utilitaire pour mapper les IDs de plan aux types de base
function mapPlanIdToType(planId?: string): string {
  switch (planId) {
    case 'basic':
      return 'BASIC';
    case 'premium':
      return 'PREMIUM';
    case 'family':
      return 'PREMIUM'; // Famille traité comme Premium pour l'instant
    default:
      return 'PREMIUM';
  }
}

// Autres méthodes HTTP non autorisées
export async function GET() {
  return NextResponse.json({ 
    message: 'Webhook MoneyFusion - Endpoint POST uniquement',
    status: 'active' 
  });
}

export async function PUT() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}