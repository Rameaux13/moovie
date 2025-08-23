'use client'

import { useEffect, useState } from 'react'

interface DashboardStats {
  totalUsers: number
  totalVideos: number
  totalSubscriptions: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalVideos: 0,
    totalSubscriptions: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [showAddMovieModal, setShowAddMovieModal] = useState(false)
  const [movieTitle, setMovieTitle] = useState('')
  const [movieDescription, setMovieDescription] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchDashboardStats = async () => {
  try {
    setLoading(true)
    
    // ✅ NOUVEAU : Appel à notre vraie API
    const response = await fetch('/api/admin/stats')
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des stats')
    }
    
    const result = await response.json()
    
    // ✅ Mapper les données de l'API vers notre interface
    setStats({
      totalUsers: result.data.totalUsers,
      totalVideos: result.data.totalMovies,  // Attention: totalMovies → totalVideos
      totalSubscriptions: result.data.activeSubscriptions, // Utiliser les abonnements actifs
      totalRevenue: result.data.totalRevenue
    })
    
    setLoading(false)
  } catch (error) {
    console.error('Erreur récupération stats:', error)
    setLoading(false)
  }
}

const handleAddMovie = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // Vérifier que les champs sont remplis
  if (!movieTitle.trim() || !movieDescription.trim()) {
    showMessage('Veuillez remplir tous les champs')
    return
  }
  
  try {
    const response = await fetch('/api/admin/movies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: movieTitle.trim(),
        description: movieDescription.trim()
      })
    })
    
    if (response.ok) {
      // Film ajouté avec succès
      showMessage('Film ajouté avec succès!')
      setMovieTitle('')
      setMovieDescription('')
      setShowAddMovieModal(false)
      fetchDashboardStats() // Recharger les stats
    } else {
      showMessage('Erreur lors de l\'ajout du film')
    }
  } catch (error) {
    console.error('Erreur:', error)
    showMessage('Erreur lors de l\'ajout du film')
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-lg">Chargement des statistiques...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Message de notification */}
      {message && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {message}
        </div>
      )}

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard Admin</h1>
        <p className="text-gray-400 mt-2">Vue d'ensemble de votre plateforme Netflix</p>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Utilisateurs */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Films */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Films</p>
              <p className="text-2xl font-bold text-white">{stats.totalVideos}</p>
            </div>
            <div className="bg-red-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v1a1 1 0 01-1 1v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 3v1h6V3H9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Abonnements */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Abonnements Actifs</p>
              <p className="text-2xl font-bold text-white">{stats.totalSubscriptions}</p>
            </div>
            <div className="bg-green-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Revenus */}
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Revenus (CFA)</p>
              <p className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-600 p-3 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setShowAddMovieModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Ajouter un Film
          </button>
          <button 
            onClick={() => window.location.href = '/users'}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Gérer Utilisateurs
          </button>
          <button 
            onClick={() => window.location.href = '/subscriptions'}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Voir Abonnements
          </button>
        </div>
      </div>

      {/* Modal Ajouter Film */}
      {showAddMovieModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Ajouter un Film</h3>
              <button 
                onClick={() => setShowAddMovieModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddMovie} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titre du film
                </label>
                <input 
                  type="text" 
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="Ex: Avatar 2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea 
                  value={movieDescription}
                  onChange={(e) => setMovieDescription(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  rows={3}
                  placeholder="Description du film..."
                />
              </div>
              
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}