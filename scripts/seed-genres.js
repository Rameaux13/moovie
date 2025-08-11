const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function seedGenres() {
  console.log('🎬 Ajout des genres de base...')
  
  const genres = [
    { name: 'Action', slug: 'action', icon: '💥', color: '#ef4444' },
    { name: 'Romance', slug: 'romance', icon: '💕', color: '#ec4899' },
    { name: 'Comédie', slug: 'comedie', icon: '😂', color: '#f59e0b' },
    { name: 'Drame', slug: 'drame', icon: '🎭', color: '#6366f1' },
    { name: 'Horreur', slug: 'horreur', icon: '👻', color: '#7c3aed' },
    { name: 'Science-Fiction', slug: 'sci-fi', icon: '🚀', color: '#06b6d4' },
    { name: 'Thriller', slug: 'thriller', icon: '🔪', color: '#dc2626' },
    { name: 'Aventure', slug: 'aventure', icon: '🗺️', color: '#059669' },
    { name: 'Fantastique', slug: 'fantastique', icon: '🧙‍♂️', color: '#8b5cf6' },
    { name: 'Animation', slug: 'animation', icon: '🎨', color: '#f97316' },
    { name: 'Documentaire', slug: 'documentaire', icon: '📹', color: '#64748b' },
    { name: 'Crime', slug: 'crime', icon: '🕵️', color: '#374151' }
  ]

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      update: genre,
      create: genre
    })
  }

  console.log(`✅ ${genres.length} genres ajoutés avec succès !`)
}

seedGenres()
  .catch((e) => {
    console.error('❌ Erreur lors de l\'ajout des genres:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })