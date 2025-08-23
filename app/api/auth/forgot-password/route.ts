import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: "L'adresse email est obligatoire" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // IMPORTANT : On renvoie toujours le même message pour éviter l'énumération d'emails
    const successMessage = "Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation."

    if (!user) {
      // On fait semblant que ça marche pour la sécurité
      return NextResponse.json(
        { message: successMessage },
        { status: 200 }
      )
    }

    // Supprimer les anciens tokens pour cet email
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    })

    // Générer un token unique et sécurisé
    const token = crypto.randomBytes(32).toString("hex")
    
    // Créer l'expiration (1 heure à partir de maintenant)
    const expires = new Date()
    expires.setHours(expires.getHours() + 1)

    // Sauvegarder le token en base
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires
      }
    })

    // Construire l'URL de réinitialisation
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password/${token}`

    // PHASE 1 : Simulation console (on affichera l'email en console)
    console.log("=== EMAIL DE RÉINITIALISATION ===")
    console.log(`À: ${email}`)
    console.log(`Sujet: Réinitialisation de votre mot de passe MOOVIE`)
    console.log(`Message:`)
    console.log(`Bonjour ${user.name},`)
    console.log(``)
    console.log(`Vous avez demandé la réinitialisation de votre mot de passe.`)
    console.log(`Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :`)
    console.log(``)
    console.log(`${resetUrl}`)
    console.log(``)
    console.log(`Ce lien expire dans 1 heure.`)
    console.log(`Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.`)
    console.log(``)
    console.log(`L'équipe MOOVIE`)
    console.log("=== FIN EMAIL ===")

    // TODO PHASE 2 : Ici on intégrera l'envoi réel avec Resend
    // await sendResetEmail(email, user.name, resetUrl)

    return NextResponse.json(
      { message: successMessage },
      { status: 200 }
    )

  } catch (error) {
    console.error("Erreur lors de la demande de réinitialisation:", error)
    return NextResponse.json(
      { message: "Erreur serveur lors de la demande de réinitialisation" },
      { status: 500 }
    )
  }
}