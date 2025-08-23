"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.")
        setEmail("") // Vider le champ
      } else {
        setError(data.message || "Une erreur est survenue")
      }
    } catch (err) {
      setError("Une erreur est survenue lors de l'envoi")
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

      {/* Formulaire mot de passe oublié */}
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-8 w-full max-w-md border border-red-500/30">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Mot de passe oublié ?
        </h2>
        
        <p className="text-gray-400 text-center mb-6">
          Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <Link href="/login" className="block text-red-400 hover:text-red-300 underline">
            ← Retour à la connexion
          </Link>
          
          <div className="text-gray-500 text-sm">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-red-400 hover:text-red-300 underline">
              S'inscrire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}