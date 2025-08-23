import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer tous les utilisateurs avec leurs abonnements
    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            end_date: {
              gt: new Date() // Abonnements actifs seulement
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1 // Le plus récent abonnement actif
        },
        _count: {
          select: {
            favorites: true,
            watch_history: true
          }
        }
      },
      orderBy: {
        created_at: 'desc' // Plus récents en premier
      }
    })

    // 3. Formater les données pour l'interface admin
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription_status: user.subscription_status,
      preferencesCompleted: user.preferencesCompleted,
      created_at: user.created_at,
      updated_at: user.updated_at,
      // Informations sur l'abonnement actif
      activeSubscription: user.subscriptions[0] ? {
        id: user.subscriptions[0].id,
        plan_type: user.subscriptions[0].plan_type,
        start_date: user.subscriptions[0].start_date,
        end_date: user.subscriptions[0].end_date,
        status: user.subscriptions[0].status
      } : null,
      // Statistiques d'activité
      stats: {
        favorites_count: user._count.favorites,
        watch_history_count: user._count.watch_history
      }
    }))

    // 4. Calculer des statistiques globales
    const stats = {
      total: formattedUsers.length,
      admins: formattedUsers.filter(u => u.role === 'ADMIN').length,
      active_subscriptions: formattedUsers.filter(u => u.activeSubscription).length,
      preferences_completed: formattedUsers.filter(u => u.preferencesCompleted).length
    }

    // 5. Retourner les utilisateurs avec les stats
    return NextResponse.json({
      success: true,
      data: formattedUsers,
      stats
    })

  } catch (error) {
    console.error('❌ Erreur API GET admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' }, 
      { status: 500 }
    )
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification et le rôle ADMIN
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé - Admin requis' }, { status: 403 })
    }

    // 2. Récupérer les données du formulaire
    const body = await request.json()
    const { name, email, role, password } = body

    // 3. Validation des données
    if (!name || !email || !role) {
      return NextResponse.json({ 
        error: 'Nom, email et rôle requis' 
      }, { status: 400 })
    }

    // 4. Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      }, { status: 400 })
    }

    // 5. Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password || 'MotDePasse123!', 10)

    // 6. Créer l'utilisateur en base de données
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: role,
        subscription_status: 'INACTIVE',
        preferencesCompleted: false
      }
    })

    // 7. Retourner l'utilisateur créé (sans le mot de passe)
    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        subscription_status: newUser.subscription_status,
        preferencesCompleted: newUser.preferencesCompleted,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
        activeSubscription: null,
        stats: {
          favorites_count: 0,
          watch_history_count: 0
        }
      }
    })

  } catch (error) {
    console.error('❌ Erreur API POST admin/users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'utilisateur' }, 
      { status: 500 }
    )
  }
}