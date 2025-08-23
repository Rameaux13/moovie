import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validation des données
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "Un compte avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12)

    // Créer l'utilisateur dans la base de données
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        subscription_status: "inactive", // Statut par défaut
        created_at: new Date(),
      }
    })

    // Retourner la réponse sans le mot de passe
    return NextResponse.json(
      {
        message: "Compte créé avec succès",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Erreur lors de la création du compte:", error)
    return NextResponse.json(
      { message: "Erreur serveur lors de la création du compte" },
      { status: 500 }
    )
  }
}