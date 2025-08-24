// app/api/auth/check-email/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Vérifier si l'email existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    return NextResponse.json({ 
      exists: !!user 
    })

  } catch (error) {
    console.error('Erreur check-email:', error)
    return NextResponse.json({ 
      exists: false 
    })
  }
}