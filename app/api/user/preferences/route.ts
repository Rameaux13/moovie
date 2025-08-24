import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les préférences de l'utilisateur
export async function GET() {
  try {
    console.log('🔍 GET /api/user/preferences - Début')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ Pas d\'email dans la session')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    console.log('👤 Recherche utilisateur avec email:', session.user.email)

    // Récupérer l'utilisateur avec ses préférences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userPreferences: {
          include: {
            genre: true
          }
        }
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Utilisateur trouvé, ID:', user.id, 'type:', typeof user.id)

    // Retourner seulement les genres choisis par l'utilisateur
    const userGenres = user.userPreferences.map(pref => pref.genre)
    
    console.log('✅ Préférences récupérées:', userGenres.length, 'genres')
    return NextResponse.json(userGenres)

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les préférences (première visite)
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/user/preferences - Début')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ Pas d\'email dans la session')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { genreIds } = await request.json()
    console.log('📝 Genres reçus:', genreIds)

    // Validation : minimum 3, maximum 5 genres
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length < 3 || genreIds.length > 5) {
      console.log('❌ Validation genres échouée')
      return NextResponse.json(
        { error: 'Vous devez sélectionner entre 3 et 5 genres' },
        { status: 400 }
      )
    }

    console.log('👤 Recherche utilisateur avec email:', session.user.email)

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        preferencesCompleted: true
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Utilisateur trouvé - ID:', user.id, 'type:', typeof user.id)

    // Vérifier que tous les genres existent
    const existingGenres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds }
      }
    })

    if (existingGenres.length !== genreIds.length) {
      console.log('❌ Genres manquants - Attendus:', genreIds.length, 'Trouvés:', existingGenres.length)
      return NextResponse.json(
        { error: 'Un ou plusieurs genres sélectionnés n\'existent pas' },
        { status: 400 }
      )
    }

    console.log('✅ Tous les genres existent')

    // CORRECTION : S'assurer que user.id est du bon type
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id

    if (typeof userId !== 'number' || isNaN(userId)) {
      console.error('❌ ID utilisateur invalide:', user.id, 'converti en:', userId)
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 500 }
      )
    }

    console.log('🔄 Suppression des anciennes préférences pour userId:', userId)

    // Supprimer les anciennes préférences
    await prisma.userPreference.deleteMany({
      where: { userId: userId }
    })

    console.log('✅ Anciennes préférences supprimées')

    // Créer les nouvelles préférences
    const preferences = genreIds.map((genreId: string) => ({
      userId: userId,
      genreId: genreId
    }))

    console.log('📝 Création nouvelles préférences:', preferences)

    await prisma.userPreference.createMany({
      data: preferences
    })

    console.log('✅ Nouvelles préférences créées')

    // Marquer les préférences comme complétées
    console.log('🔄 Mise à jour flag preferencesCompleted')
    await prisma.user.update({
      where: { id: userId },
      data: { 
        preferencesCompleted: true,
        updated_at: new Date()
      }
    })

    console.log('✅ Flag preferencesCompleted mis à jour')

    return NextResponse.json({ 
      success: true,
      message: 'Préférences sauvegardées avec succès' 
    })

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les préférences utilisateur (modification)
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT /api/user/preferences - Début')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('❌ Pas d\'email dans la session')
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { genreIds } = await request.json()
    console.log('📝 Genres reçus pour mise à jour:', genreIds)

    // Validation : minimum 3, maximum 5 genres
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length < 3 || genreIds.length > 5) {
      console.log('❌ Validation genres échouée')
      return NextResponse.json(
        { error: 'Vous devez sélectionner entre 3 et 5 genres' },
        { status: 400 }
      )
    }

    console.log('👤 Recherche utilisateur avec email:', session.user.email)

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true
      }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    console.log('✅ Utilisateur trouvé - ID:', user.id, 'type:', typeof user.id)

    // Vérifier que tous les genres existent
    const existingGenres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds }
      }
    })

    if (existingGenres.length !== genreIds.length) {
      console.log('❌ Genres manquants - Attendus:', genreIds.length, 'Trouvés:', existingGenres.length)
      return NextResponse.json(
        { error: 'Un ou plusieurs genres sélectionnés n\'existent pas' },
        { status: 400 }
      )
    }

    console.log('✅ Tous les genres existent')

    // CORRECTION : S'assurer que user.id est du bon type
    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id

    if (typeof userId !== 'number' || isNaN(userId)) {
      console.error('❌ ID utilisateur invalide:', user.id, 'converti en:', userId)
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 500 }
      )
    }

    console.log('🔄 Suppression des anciennes préférences pour userId:', userId)

    // Supprimer les anciennes préférences
    await prisma.userPreference.deleteMany({
      where: { userId: userId }
    })

    console.log('✅ Anciennes préférences supprimées')

    // Créer les nouvelles préférences
    const preferences = genreIds.map((genreId: string) => ({
      userId: userId,
      genreId: genreId
    }))

    console.log('📝 Création nouvelles préférences:', preferences)

    await prisma.userPreference.createMany({
      data: preferences
    })

    console.log('✅ Nouvelles préférences créées')

    // Mettre à jour la date de modification
    console.log('🔄 Mise à jour date de modification')
    await prisma.user.update({
      where: { id: userId },
      data: { 
        updated_at: new Date()
      }
    })

    console.log('✅ Date de modification mise à jour')

    return NextResponse.json({ 
      success: true,
      message: 'Préférences mises à jour avec succès' 
    })

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}