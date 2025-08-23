"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    // Validation renforcée du mot de passe
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/

    if (!passwordRegex.test(formData.password)) {
      setError("Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Compte créé avec succès ! Redirection vers la page d'abonnement...")
        setTimeout(() => {
          router.push("/pricing")
        }, 2000)
      } else {
        setError(data.message || "Une erreur est survenue")
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

      {/* Formulaire d'inscription */}
      <div className="bg-black/70 backdrop-blur-sm rounded-lg p-8 w-full max-w-md border border-red-500/30">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Créer un compte
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Nom complet"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            
            {/* Indicateur de validation en temps réel */}
            {formData.password && (
              <div className="text-xs mt-2 space-y-1">
                <p className={`flex items-center ${formData.password.length >= 6 ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-1">{formData.password.length >= 6 ? '✓' : '✗'}</span>
                  Au moins 6 caractères
                </p>
                <p className={`flex items-center ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-1">{/[A-Z]/.test(formData.password) ? '✓' : '✗'}</span>
                  Une majuscule
                </p>
                <p className={`flex items-center ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-1">{/[a-z]/.test(formData.password) ? '✓' : '✗'}</span>
                  Une minuscule
                </p>
                <p className={`flex items-center ${/\d/.test(formData.password) ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-1">{/\d/.test(formData.password) ? '✓' : '✗'}</span>
                  Un chiffre
                </p>
              </div>
            )}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmer le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
            
            {/* Indicateur de correspondance des mots de passe */}
            {formData.confirmPassword && (
              <div className="text-xs mt-2">
                <p className={`flex items-center ${formData.password === formData.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                  <span className="mr-1">{formData.password === formData.confirmPassword ? '✓' : '✗'}</span>
                  Les mots de passe correspondent
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? "Création du compte..." : "Créer un compte"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>
            Déjà un compte ?{" "}
            <Link href="/login" className="text-red-400 hover:text-red-300 underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}