"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
      } else {
        const checkSubscription = await fetch('/api/user/subscription-status')
        const subscriptionData = await checkSubscription.json()
        if (subscriptionData.hasActiveSubscription) {
          router.push("/home") // A un abonnement → Films
        } else {
          router.push("/pricing") // Pas d'abonnement → Paiement
        }
      }
    } catch (err) {
      setError("Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-black to-red-800 flex items-center justify-center p-4">
      {/* Logo NETFLIX */}
      <div className="absolute top-8 left-8">
        <Link href="/">
          <h1 className="text-4xl font-bold text-red-600 tracking-wider cursor-pointer hover:text-red-500 transition-colors">
            NETFLIX
          </h1>
        </Link>
      </div>

      {/* Formulaire de connexion */}
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-8 w-full max-w-md border border-red-500/30">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Se connecter
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
          
          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-red-400 hover:text-red-300 underline text-sm">
              Mot de passe oublié ?
            </Link>
          </div>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-red-400 hover:text-red-300 underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}