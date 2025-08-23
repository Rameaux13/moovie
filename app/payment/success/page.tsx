'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Play, Home, CreditCard, Clock } from 'lucide-react';

interface PaymentStatus {
  success: boolean;
  plan?: {
    name: string;
    amount: number;
  };
  transactionId?: string;
  error?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer le token depuis l'URL
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!token) {
        setPaymentStatus({
          success: false,
          error: 'Token de paiement manquant'
        });
        setLoading(false);
        return;
      }

      try {
        // Vérifier le statut du paiement
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        setPaymentStatus(data);
      } catch (error) {
        console.error('Erreur vérification paiement:', error);
        setPaymentStatus({
          success: false,
          error: 'Erreur lors de la vérification du paiement'
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [token]);

  // Redirection automatique après 10 secondes si succès
  useEffect(() => {
    if (paymentStatus?.success) {
      const timer = setTimeout(() => {
        router.push('/home');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [paymentStatus, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold mb-2">Vérification du paiement...</h2>
          <p className="text-gray-400">Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (!paymentStatus?.success) {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Header avec logo */}
        <nav className="bg-black/90 backdrop-blur-sm border-b border-gray-800 py-4">
          <div className="container mx-auto px-4">
            <button 
              onClick={() => router.push('/')}
              className="text-red-600 text-3xl font-black tracking-tight hover:opacity-80 transition-opacity"
            >
              NETFLIX
            </button>
          </div>
        </nav>

        {/* Contenu erreur */}
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-600/20 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Problème de paiement</h1>
            <p className="text-gray-400 mb-8">
              {paymentStatus?.error || 'Une erreur est survenue lors du traitement de votre paiement.'}
            </p>
            <div className="space-y-4">
              <button
                onClick={() => router.push('/pricing')}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Réessayer le paiement
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header avec logo */}
      <nav className="bg-black/90 backdrop-blur-sm border-b border-gray-800 py-4">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => router.push('/')}
            className="text-red-600 text-3xl font-black tracking-tight hover:opacity-80 transition-opacity"
          >
            NETFLIX
          </button>
        </div>
      </nav>

      {/* Contenu principal */}
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center max-w-2xl mx-auto px-4">
          {/* Icône de succès */}
          <div className="bg-green-600/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>

          {/* Message principal */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
            Paiement réussi !
          </h1>
          
          <p className="text-xl text-gray-300 mb-2">
            Bienvenue dans votre abonnement {paymentStatus.plan?.name} !
          </p>
          
          <p className="text-gray-400 mb-8">
            Votre compte a été activé avec succès. Vous pouvez maintenant profiter de tout le catalogue Netflix.
          </p>

          {/* Détails de l'abonnement */}
          <div className="bg-gray-900/50 rounded-lg p-6 mb-8 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4 text-green-400">Détails de votre abonnement</h3>
            <div className="space-y-2 text-left max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-gray-400">Plan :</span>
                <span className="text-white font-semibold">{paymentStatus.plan?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Montant :</span>
                <span className="text-white font-semibold">{paymentStatus.plan?.amount} CFA</span>
              </div>
              {paymentStatus.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Transaction :</span>
                  <span className="text-white font-mono text-sm">{paymentStatus.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Statut :</span>
                <span className="text-green-400 font-semibold">✓ Actif</span>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center justify-center text-lg"
            >
              <Play className="w-6 h-6 mr-2" />
              Commencer à regarder
            </button>
            
            <button
              onClick={() => router.push('/home')}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
            >
              <Home className="w-5 h-5 mr-2" />
              Aller au tableau de bord
            </button>
          </div>

          {/* Message de redirection */}
          <div className="mt-8 p-4 bg-blue-900/20 rounded-lg border border-blue-800/50">
            <div className="flex items-center justify-center text-blue-400 mb-2">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-sm">Redirection automatique dans 10 secondes...</span>
            </div>
          </div>

          {/* Informations utilisateur */}
          {session && (
            <p className="text-gray-500 text-sm mt-6">
              Connecté en tant que {session.user?.name} • {session.user?.email}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}