import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FusionPay } from 'fusionpay';
import { prisma } from '@/lib/prisma';

// URL API MoneyFusion
const MONEYFUSION_API_URL = 'https://www.pay.moneyfusion.net/Netflix_Clone_VOD/046f36a60d5ebb2b/pay/';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Non authentifié' 
      }, { status: 401 });
    }

    // Récupérer le token depuis la requête
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Token de paiement manquant'
      }, { status: 400 });
    }

    // Initialiser FusionPay pour vérifier le paiement
    const fusionPay = new FusionPay(MONEYFUSION_API_URL);
    
    // Vérifier le statut du paiement avec MoneyFusion
    const paymentStatus = await fusionPay.checkPaymentStatus(token);

    console.log('🔍 Payment Status:', paymentStatus);

    // Vérifier si le paiement est réussi
    if (paymentStatus.statut && paymentStatus.data && paymentStatus.data.statut === 'paid') {
      const paymentData = paymentStatus.data;
      
      // Extraire les informations personnalisées
      const personalInfo = paymentData.personal_Info?.[0] || {};
      const planId = personalInfo.planId;
      const planName = personalInfo.planName;
      
      // Calculer la date d'expiration (30 jours)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      try {
        // Vérifier si l'abonnement existe déjà pour cette transaction
        const existingSubscription = await prisma.subscription.findFirst({
          where: {
            user_id: parseInt(session.user.id),
            moneyfusion_subscription_id: paymentData.numeroTransaction
          }
        });

        if (!existingSubscription) {
          // Calculer les dates
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // 30 jours d'abonnement

          // Déterminer le type de plan
          let planType = 'PREMIUM';
          if (planId === 'basic') planType = 'BASIC';
          if (planId === 'premium') planType = 'PREMIUM';
          if (planId === 'family') planType = 'PREMIUM'; // Famille = Premium pour l'instant

          // Créer le nouvel abonnement
          await prisma.subscription.create({
            data: {
              user_id: parseInt(session.user.id),
              plan_type: planType,
              start_date: startDate,
              end_date: endDate,
              status: 'ACTIVE',
              moneyfusion_subscription_id: paymentData.numeroTransaction,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          // Mettre à jour le statut utilisateur
          await prisma.user.update({
            where: { id: parseInt(session.user.id) },
            data: { subscription_status: 'ACTIVE' }
          });

          console.log('✅ Abonnement créé pour utilisateur:', session.user.id);
        } else {
          console.log('ℹ️ Abonnement déjà existant pour cette transaction');
        }

        // Retourner le succès avec les détails
        return NextResponse.json({
          success: true,
          plan: {
            name: planName || 'Premium',
            amount: paymentData.Montant
          },
          transactionId: paymentData.numeroTransaction,
          message: 'Paiement vérifié et abonnement activé'
        });

      } catch (dbError) {
        console.error('❌ Erreur base de données:', dbError);
        
        // Même si la DB échoue, le paiement est valide
        return NextResponse.json({
          success: true,
          plan: {
            name: planName || 'Premium',
            amount: paymentData.Montant
          },
          transactionId: paymentData.numeroTransaction,
          message: 'Paiement vérifié (erreur DB non bloquante)'
        });
      }

    } else {
      // Paiement non réussi
      const status = paymentStatus.data?.statut || 'unknown';
      let errorMessage = 'Paiement non confirmé';
      
      switch (status) {
        case 'pending':
          errorMessage = 'Paiement en cours de traitement';
          break;
        case 'failed':
          errorMessage = 'Paiement échoué';
          break;
        case 'no paid':
          errorMessage = 'Paiement non effectué';
          break;
        default:
          errorMessage = `Statut de paiement: ${status}`;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('❌ Erreur vérification paiement:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la vérification du paiement',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

// Autres méthodes HTTP non autorisées
export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}