'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Crown, Users, Download, Play } from 'lucide-react';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 200,
    currency: 'CFA',
    period: '/mois',
    description: 'Parfait pour débuter',
    features: [
      'Streaming illimité',
      'Qualité HD (720p)',
      '1 écran simultané',
      'Catalogue complet',
      'Support 24/7'
    ],
    color: 'from-gray-700 to-gray-800',
    icon: <Play className="w-8 h-8" />,
    popular: false
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 500,
    currency: 'CFA',
    period: '/mois',
    description: 'Le plus populaire',
    features: [
      'Streaming illimité',
      'Qualité Full HD (1080p)',
      '2 écrans simultanés',
      'Téléchargement hors ligne',
      'Catalogue complet',
      'Support prioritaire'
    ],
    color: 'from-red-600 to-red-700',
    icon: <Download className="w-8 h-8" />,
    popular: true
  },
  {
    id: 'family',
    name: 'Famille',
    price: 1000,
    currency: 'CFA',
    period: '/mois',
    description: 'Pour toute la famille',
    features: [
      'Streaming illimité',
      'Qualité 4K Ultra HD',
      '5 écrans simultanés',
      'Téléchargement hors ligne',
      'Catalogue complet',
      'Profils familiaux',
      'Support VIP'
    ],
    color: 'from-amber-600 to-amber-700',
    icon: <Users className="w-8 h-8" />,
    popular: false
  }
];

export default function PricingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    if (!session) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setLoading(planId);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          amount: plan.price,
          userId: session.user?.id
        }),
      });

      const data = await response.json();
      
      if (data.success && data.paymentUrl) {
        // Redirection vers MoneyFusion
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            {/* Logo Netflix */}
            <button 
              onClick={() => router.push('/')}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <span className="text-red-600 text-3xl font-black tracking-tight">
                NETFLIX
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="relative bg-gradient-to-b from-red-900/20 to-black pt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
              Choisissez votre plan
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Profitez du meilleur du streaming avec nos abonnements flexibles
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Annulation à tout moment
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Sans engagement
              </div>
              <div className="flex items-center">
                <Check className="w-4 h-4 text-green-500 mr-2" />
                Accès immédiat
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 border-2 transition-all duration-300 hover:scale-105 ${
                plan.popular
                  ? 'border-red-600 bg-gradient-to-b from-red-900/10 to-black'
                  : 'border-gray-700 bg-gradient-to-b from-gray-900/20 to-black hover:border-gray-600'
              }`}
            >
              {/* Badge populaire */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Crown className="w-4 h-4 mr-1" />
                    Le plus populaire
                  </div>
                </div>
              )}

              {/* Header du plan */}
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} mb-4`}>
                  {plan.icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                
                {/* Prix */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-red-600">
                    {plan.price}
                  </span>
                  <span className="text-lg text-gray-400 ml-1">
                    {plan.currency}{plan.period}
                  </span>
                </div>
              </div>

              {/* Fonctionnalités */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Bouton d'abonnement */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-300 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 hover:border-gray-500'
                } ${loading === plan.id ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading === plan.id ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </div>
                ) : (
                  `S'abonner à ${plan.name}`
                )}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Puis-je changer de plan ?</h3>
              <p className="text-gray-400">Oui, vous pouvez upgrader ou downgrader votre plan à tout moment depuis votre profil.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Comment annuler ?</h3>
              <p className="text-gray-400">Vous pouvez annuler votre abonnement à tout moment sans frais supplémentaires.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Modes de paiement ?</h3>
              <p className="text-gray-400">Nous acceptons Orange Money, MTN Mobile Money et tous les moyens de paiement MoneyFusion.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-red-600">Qualité vidéo ?</h3>
              <p className="text-gray-400">La qualité dépend de votre plan : HD pour Basic, Full HD pour Premium, et 4K pour Famille.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}