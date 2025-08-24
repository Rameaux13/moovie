import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            preferencesCompleted: true,
            role: true
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          preferencesCompleted: user.preferencesCompleted,
          role: user.role as string
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      console.log('🔑 JWT Callback - Trigger:', trigger)
      
      // Lors du login initial
      if (user) {
        token.id = user.id
        token.preferencesCompleted = user.preferencesCompleted
        token.role = user.role
        console.log('👤 Login initial - preferencesCompleted:', token.preferencesCompleted)
      }
      
      // CRITIQUE: Mise à jour de la session
      if (trigger === "update") {
        console.log('🔄 Session update détectée!')
        
        try {
          // Récupérer les données à jour depuis la DB
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { 
              preferencesCompleted: true,
              role: true,
              name: true 
            }
          })
          
          if (dbUser) {
            // Mettre à jour le token avec les nouvelles données
            token.preferencesCompleted = dbUser.preferencesCompleted
            token.role = dbUser.role
            console.log('✅ Token mis à jour - preferencesCompleted:', token.preferencesCompleted)
          }
        } catch (error) {
          console.error('❌ Erreur lors de la mise à jour du token:', error)
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.preferencesCompleted = token.preferencesCompleted as boolean
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login"
  }
}