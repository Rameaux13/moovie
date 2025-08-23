const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createFreshTestUser() {
  try {
    // Supprimer l'ancien utilisateur test s'il existe
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'fresh.test'
        }
      }
    })

    const hashedPassword = await bcrypt.hash('Test123!', 12)
    
    const user = await prisma.user.create({
      data: {
        email: 'fresh.test@moovie.com',
        password: hashedPassword,
        name: 'Nouveau Testeur',
        preferencesCompleted: false, // IMPORTANT : false pour forcer le sondage
        subscription_status: 'INACTIVE'
      }
    })

    console.log('✅ Nouvel utilisateur test créé:', {
      email: user.email,
      name: user.name,
      preferencesCompleted: user.preferencesCompleted,
      id: user.id
    })

    // Vérifier qu'il n'a aucune préférence
    const preferences = await prisma.userPreference.findMany({
      where: { userId: user.id }
    })

    console.log(`✅ Préférences existantes : ${preferences.length} (doit être 0)`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createFreshTestUser()