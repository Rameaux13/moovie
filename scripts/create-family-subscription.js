// scripts/create-family-subscription.js
// 🎯 CRÉER UN ABONNEMENT FAMILLE POUR TESTER

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createFamilySubscription() {
  console.log('🎯 Création abonnement FAMILLE de test...');

  try {
    // 1. Prendre le premier utilisateur
    const user = await prisma.user.findFirst();
    
    if (!user) {
      console.log('❌ Aucun utilisateur trouvé');
      return;
    }

    console.log(`👤 Utilisateur sélectionné: ${user.email} (ID: ${user.id})`);

    // 2. Vérifier les abonnements existants
    const existingSubscriptions = await prisma.subscription.findMany({
      where: { user_id: user.id }
    });

    console.log(`📊 Abonnements existants: ${existingSubscriptions.length}`);

    // 3. Supprimer les anciens abonnements (pour le test)
    if (existingSubscriptions.length > 0) {
      await prisma.subscription.deleteMany({
        where: { user_id: user.id }
      });
      console.log('🗑️ Anciens abonnements supprimés');
    }

    // 4. Créer un nouvel abonnement FAMILLE
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // +30 jours

    const familySubscription = await prisma.subscription.create({
      data: {
        user_id: user.id,
        plan_type: 'FAMILLE',
        start_date: startDate,
        end_date: endDate,
        status: 'ACTIVE',
        moneyfusion_subscription_id: 'test_famille_' + Date.now()
      }
    });

    // 5. Mettre à jour le statut utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: { subscription_status: 'ACTIVE' }
    });

    console.log('✅ Abonnement FAMILLE créé avec succès !');
    console.log(`   ID: ${familySubscription.id}`);
    console.log(`   Plan: ${familySubscription.plan_type}`);
    console.log(`   Statut: ${familySubscription.status}`);
    console.log(`   Début: ${familySubscription.start_date}`);
    console.log(`   Fin: ${familySubscription.end_date}`);

    // 6. Vérifier que ça marche
    const verification = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    console.log('\n🔍 VÉRIFICATION:');
    console.log(`   Utilisateur: ${verification?.email}`);
    console.log(`   Statut: ${verification?.subscription_status}`);
    console.log(`   Abonnements actifs: ${verification?.subscriptions.length}`);
    
    if (verification?.subscriptions[0]) {
      const sub = verification.subscriptions[0];
      console.log(`   Plan actuel: ${sub.plan_type}`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer la création
createFamilySubscription()
  .then(() => {
    console.log('\n🎉 Test d\'abonnement FAMILLE prêt !');
    console.log('👉 Tu peux maintenant tester les profils famille !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur:', error);
    process.exit(1);
  });