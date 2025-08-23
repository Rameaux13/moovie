import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Récupérer les préférences de l'utilisateur
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

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
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Retourner seulement les genres choisis par l'utilisateur
    const userGenres = user.userPreferences.map(pref => pref.genre)

    return NextResponse.json(userGenres)

  } catch (error) {
    console.error('Erreur lors de la récupération des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les préférences (première visite)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { genreIds } = await request.json()

    // Validation : minimum 3, maximum 5 genres
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length < 3 || genreIds.length > 5) {
      return NextResponse.json(
        { error: 'Vous devez sélectionner entre 3 et 5 genres' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que tous les genres existent
    const existingGenres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds }
      }
    })

    if (existingGenres.length !== genreIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs genres sélectionnés n\'existent pas' },
        { status: 400 }
      )
    }

    // Supprimer les anciennes préférences
    await prisma.userPreference.deleteMany({
      where: { userId: user.id }
    })

    // Créer les nouvelles préférences
    const preferences = genreIds.map((genreId: string) => ({
      userId: user.id,
      genreId: genreId
    }))

    await prisma.userPreference.createMany({
      data: preferences
    })

    // Marquer les préférences comme complétées
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        preferencesCompleted: true,
        updated_at: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Préférences sauvegardées avec succès' 
    })

  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour les préférences utilisateur (modification)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const { genreIds } = await request.json()

    // Validation : minimum 3, maximum 5 genres
    if (!genreIds || !Array.isArray(genreIds) || genreIds.length < 3 || genreIds.length > 5) {
      return NextResponse.json(
        { error: 'Vous devez sélectionner entre 3 et 5 genres' },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier que tous les genres existent
    const existingGenres = await prisma.genre.findMany({
      where: {
        id: { in: genreIds }
      }
    })

    if (existingGenres.length !== genreIds.length) {
      return NextResponse.json(
        { error: 'Un ou plusieurs genres sélectionnés n\'existent pas' },
        { status: 400 }
      )
    }

    // Supprimer les anciennes préférences
    await prisma.userPreference.deleteMany({
      where: { userId: user.id }
    })

    // Créer les nouvelles préférences
    const preferences = genreIds.map((genreId: string) => ({
      userId: user.id,
      genreId: genreId
    }))

    await prisma.userPreference.createMany({
      data: preferences
    })

    // Mettre à jour la date de modification
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        updated_at: new Date()
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Préférences mises à jour avec succès' 
    })

  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}