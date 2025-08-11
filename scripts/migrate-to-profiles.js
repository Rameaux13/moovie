// scripts/migrate-to-profiles.js
// ✨ SCRIPT DE MIGRATION VERS SYSTÈME MULTI-PROFILS

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToProfiles() {
  console.log('🚀 Début de la migration vers multi-profils...');

  try {
    // 1. Récupérer tous les utilisateurs existants
    const users = await prisma.user.findMany({
      include: {
        favorites: true,
        watch_history: true,
        userPreferences: true
      }
    });

    console.log(`📊 ${users.length} utilisateurs trouvés à migrer`);

    for (const user of users) {
      console.log(`👤 Migration utilisateur: ${user.email}`);

      // Vérifier si l'utilisateur a déjà un profil principal
      const existingMainProfile = await prisma.profile.findFirst({
        where: {
          user_id: user.id,
          is_main: true
        }
      });

      let mainProfile;

      if (existingMainProfile) {
        console.log(`✅ Profil principal existant trouvé: ID ${existingMainProfile.id}`);
        mainProfile = existingMainProfile;
      } else {
        // 2. Créer le profil principal pour chaque utilisateur
        mainProfile = await prisma.profile.create({
          data: {
            user_id: user.id,
            name: user.name || 'Mon Profil',
            is_main: true,
            is_child: false
          }
        });

        console.log(`✅ Profil principal créé: ID ${mainProfile.id}`);
      }

      // 3. Migrer les favoris vers profile_favorites (seulement si pas déjà migrés)
      if (user.favorites.length > 0) {
        // Vérifier si les favoris sont déjà migrés
        const existingProfileFavorites = await prisma.profileFavorite.count({
          where: { profile_id: mainProfile.id }
        });

        if (existingProfileFavorites === 0) {
          const profileFavorites = user.favorites.map(fav => ({
            profile_id: mainProfile.id,
            video_id: fav.video_id,
            added_at: fav.added_at
          }));

          await prisma.profileFavorite.createMany({
            data: profileFavorites,
            skipDuplicates: true
          });

          console.log(`❤️ ${user.favorites.length} favoris migrés`);
        } else {
          console.log(`❤️ Favoris déjà migrés (${existingProfileFavorites} existants)`);
        }
      }

      // 4. Migrer l'historique vers profile_watch_history (seulement si pas déjà migrés)
      if (user.watch_history.length > 0) {
        // Vérifier si l'historique est déjà migré
        const existingProfileHistory = await prisma.profileWatchHistory.count({
          where: { profile_id: mainProfile.id }
        });

        if (existingProfileHistory === 0) {
          const profileHistory = user.watch_history.map(history => ({
            profile_id: mainProfile.id,
            video_id: history.video_id,
            watched_at: history.watched_at,
            progress: history.progress
          }));

          await prisma.profileWatchHistory.createMany({
            data: profileHistory,
            skipDuplicates: true
          });

          console.log(`📺 ${user.watch_history.length} historiques migrés`);
        } else {
          console.log(`📺 Historique déjà migré (${existingProfileHistory} existants)`);
        }
      }

      // 5. Migrer les préférences vers profile_preferences (seulement si pas déjà migrées)
      if (user.userPreferences.length > 0) {
        // Vérifier si les préférences sont déjà migrées
        const existingProfilePrefs = await prisma.profilePreference.count({
          where: { profile_id: mainProfile.id }
        });

        if (existingProfilePrefs === 0) {
          const profilePrefs = user.userPreferences.map(pref => ({
            profile_id: mainProfile.id,
            genre_id: pref.genreId
          }));

          await prisma.profilePreference.createMany({
            data: profilePrefs,
            skipDuplicates: true
          });

          console.log(`🎭 ${user.userPreferences.length} préférences migrées`);
        } else {
          console.log(`🎭 Préférences déjà migrées (${existingProfilePrefs} existantes)`);
        }
      }

      // 6. Définir ce profil comme profil actif (seulement si pas déjà défini)
      if (!user.active_profile_id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { active_profile_id: mainProfile.id }
        });

        console.log(`🎯 Profil actif défini pour ${user.email}`);
      } else {
        console.log(`🎯 Profil actif déjà défini pour ${user.email}`);
      }

      console.log(`✅ Migration terminée pour ${user.email}\n`);
    }

    // 7. Statistiques finales
    const totalProfiles = await prisma.profile.count();
    const totalProfileFavorites = await prisma.profileFavorite.count();
    const totalProfileHistory = await prisma.profileWatchHistory.count();
    const totalProfilePrefs = await prisma.profilePreference.count();

    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Résumé final:');
    console.log(`   - ${users.length} utilisateurs migrés`);
    console.log(`   - ${totalProfiles} profils au total`);
    console.log(`   - ${totalProfileFavorites} favoris migrés`);
    console.log(`   - ${totalProfileHistory} historiques migrés`);
    console.log(`   - ${totalProfilePrefs} préférences migrées`);
    console.log('   - Système multi-profils opérationnel ✨');

  } catch (error) {
    console.error('❌ Erreur during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Lancer la migration
migrateToProfiles()
  .then(() => {
    console.log('🎉 Migration réussie ! Système multi-profils activé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });