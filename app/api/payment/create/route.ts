import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FusionPay } from 'fusionpay';

// URL API MoneyFusion de ton application
const MONEYFUSION_API_URL = 'https://www.pay.moneyfusion.net/Netflix_Clone_VOD/046f36a60d5ebb2b/pay/';

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les données de la requête
    const { planId, planName, amount, userId } = await request.json();

    // Validation des données
    if (!planId || !planName || !amount) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Initialiser FusionPay
    const fusionPay = new FusionPay(MONEYFUSION_API_URL);

    // Configuration du paiement
    const paymentResponse = await fusionPay
      .totalPrice(amount)
      .addArticle(`Abonnement ${planName}`, amount)
      .addInfo({
        userId: session.user.id,
        planId: planId,
        planName: planName,
        userEmail: session.user.email || '',
      })
      .clientName(session.user.name || 'Utilisateur Netflix')
      .clientNumber('00000000') // Numéro par défaut, l'utilisateur le saisira sur MoneyFusion
      .returnUrl(`${process.env.NEXTAUTH_URL}/payment/success`)
      .webhookUrl(`${process.env.NEXTAUTH_URL}/api/payment/webhook`)
      .makePayment();

    // Vérifier la réponse
    if (paymentResponse.statut && paymentResponse.url) {
      // Sauvegarder la transaction en base (optionnel)
      // TODO: Enregistrer en base de données si nécessaire
      
      return NextResponse.json({
        success: true,
        paymentUrl: paymentResponse.url,
        token: paymentResponse.token,
        message: paymentResponse.message
      });
    } else {
      throw new Error('Erreur lors de la création du paiement MoneyFusion');
    }

  } catch (error) {
    console.error('Erreur API Payment:', error);
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création du paiement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      }, 
      { status: 500 }
    );
  }
}

// Méthodes HTTP autorisées
export async function GET() {
  return NextResponse.json({ error: 'Méthode non autorisée' }, { status: 405 });
}