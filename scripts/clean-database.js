// scripts/clean-database.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Nettoyage de la base de données...')

  try {
    // Supprimer toutes les relations video-genres
    const deletedVideoGenres = await prisma.videoGenre.deleteMany({})
    console.log(`✅ ${deletedVideoGenres.count} relations video-genres supprimées`)

    // Supprimer tous les favoris
    const deletedFavorites = await prisma.favorite.deleteMany({})
    console.log(`✅ ${deletedFavorites.count} favoris supprimés`)

    // Supprimer tout l'historique
    const deletedHistory = await prisma.watchHistory.deleteMany({})
    console.log(`✅ ${deletedHistory.count} entrées d'historique supprimées`)

    // Supprimer toutes les vidéos
    const deletedVideos = await prisma.video.deleteMany({})
    console.log(`✅ ${deletedVideos.count} vidéos supprimées`)

    console.log('🎉 Base de données nettoyée avec succès!')
    console.log('💡 Tu peux maintenant relancer: node scripts/seed-movies.js')

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })