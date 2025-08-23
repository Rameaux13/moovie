'use client'

import { useEffect, useState } from 'react'

interface ActiveSubscription {
  id: number
  plan_type: string
  start_date: string
  end_date: string
  status: string
}

interface UserStats {
  favorites_count: number
  watch_history_count: number
}

interface User {
  id: number
  name: string
  email: string
  role: string
  subscription_status: string
  preferencesCompleted: boolean
  created_at: string
  updated_at: string
  activeSubscription: ActiveSubscription | null
  stats: UserStats
}

interface ApiStats {
  total: number
  admins: number
  active_subscriptions: number
  preferences_completed: number
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [apiStats, setApiStats] = useState<ApiStats>({
    total: 0,
    admins: 0,
    active_subscriptions: 0,
    preferences_completed: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPassword, setUserPassword] = useState('')
  const [userRole, setUserRole] = useState('USER')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/users')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des utilisateurs')
      }
      
      const result = await response.json()
      setUsers(result.data)
      setApiStats(result.stats)
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Nom', 'Email', 'Rôle', 'Statut Abonnement', 'Favoris', 'Historique', 'Inscription'],
      ...users.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.subscription_status,
        user.stats.favorites_count,
        user.stats.watch_history_count,
        new Date(user.created_at).toLocaleDateString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    showMessage('Export CSV téléchargé avec succès!')
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userName.trim() || !userEmail.trim()) {
      showMessage('Veuillez remplir tous les champs obligatoires')
      return
    }
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim(),
          role: userRole,
          password: userPassword || 'MotDePasse123!'
        })
      })
      
      if (response.ok) {
        showMessage('Utilisateur créé avec succès!')
        setUserName('')
        setUserEmail('')
        setUserPassword('')
        setUserRole('USER')
        setShowCreateModal(false)
        fetchUsers()
      } else {
        const errorData = await response.json()
        showMessage(errorData.error || 'Erreur lors de la création de l\'utilisateur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la création de l\'utilisateur')
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setUserName(user.name)
    setUserEmail(user.email)
    setUserRole(user.role)
    setShowEditModal(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser || !userName.trim() || !userEmail.trim()) {
      showMessage('Veuillez remplir tous les champs')
      return
    }
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName.trim(),
          email: userEmail.trim(),
          role: userRole
        })
      })
      
      if (response.ok) {
        showMessage('Utilisateur modifié avec succès!')
        setUserName('')
        setUserEmail('')
        setUserRole('USER')
        setShowEditModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        showMessage('Erreur lors de la modification de l\'utilisateur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la modification de l\'utilisateur')
    }
  }

  const handleManageSubscription = (user: User) => {
    setSelectedUser(user)
    setShowSubscriptionModal(true)
  }

  const handleSubscriptionAction = async (action: string, planType?: string) => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          planType: planType
        })
      })
      
      if (response.ok) {
        showMessage(`Abonnement ${action} avec succès!`)
        setShowSubscriptionModal(false)
        setSelectedUser(null)
        fetchUsers()
      } else {
        showMessage('Erreur lors de la gestion de l\'abonnement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la gestion de l\'abonnement')
    }
  }

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        showMessage('Utilisateur supprimé avec succès!')
        fetchUsers()
      } else {
        showMessage('Erreur lors de la suppression de l\'utilisateur')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la suppression de l\'utilisateur')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Actif</span>
      case 'INACTIVE':
        return <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Inactif</span>
      case 'EXPIRED':
        return <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Expiré</span>
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">{status}</span>
    }
  }

  const getRoleBadge = (role: string) => {
    return role === 'ADMIN' 
      ? <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">Admin</span>
      : <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Utilisateur</span>
  }

  const getPlanBadge = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'basic':
        return <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Basic (200 CFA)</span>
      case 'premium':
        return <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">Premium (500 CFA)</span>
      case 'family':
        return <span className="bg-gold-600 text-white px-2 py-1 rounded text-xs">Famille (1000 CFA)</span>
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">{planType}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-lg">Chargement des utilisateurs...</div>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestion des Utilisateurs</h1>
          <p className="text-gray-400 mt-2">Gérez vos {apiStats.total} utilisateurs et leurs permissions</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Exporter CSV
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            + Créer Utilisateur
          </button>
        </div>
      </div>

      {/* Statistiques rapides avec vraies données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Total Utilisateurs</p>
          <p className="text-2xl font-bold text-white">{apiStats.total}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Abonnés Actifs</p>
          <p className="text-2xl font-bold text-green-500">{apiStats.active_subscriptions}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Administrateurs</p>
          <p className="text-2xl font-bold text-purple-500">{apiStats.admins}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Préférences Complètes</p>
          <p className="text-2xl font-bold text-blue-500">{apiStats.preferences_completed}</p>
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Utilisateur</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Rôle</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Abonnement</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Préférences</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Activité</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Inscription</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {getStatusBadge(user.subscription_status)}
                      {user.activeSubscription && (
                        <div>
                          {getPlanBadge(user.activeSubscription.plan_type)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.preferencesCompleted ? (
                      <span className="text-green-500">✓ Complétées</span>
                    ) : (
                      <span className="text-yellow-500">⏳ En attente</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-300">
                      <div>❤️ {user.stats.favorites_count} favoris</div>
                      <div>📺 {user.stats.watch_history_count} vues</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleManageSubscription(user)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Abonnement
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Créer Utilisateur */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Créer un Utilisateur</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet *
                </label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input 
                  type="email" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="jean@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe
                </label>
                <input 
                  type="password" 
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="Laisser vide pour mot de passe par défaut"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Par défaut: MotDePasse123!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rôle
                </label>
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier Utilisateur */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier l'Utilisateur</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom complet
                </label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input 
                  type="email" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  placeholder="jean@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rôle
                </label>
                <select 
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              
              <div className="flex space-x-4">
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gestion Abonnement */}
      {showSubscriptionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Gestion Abonnement</h3>
              <button 
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-300">Utilisateur: <span className="text-white font-semibold">{selectedUser.name}</span></p>
                <p className="text-gray-300">Statut actuel: {getStatusBadge(selectedUser.subscription_status)}</p>
                {selectedUser.activeSubscription && (
                  <p className="text-gray-300 mt-2">Plan actuel: {getPlanBadge(selectedUser.activeSubscription.plan_type)}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-gray-300 font-semibold">Actions disponibles:</p>
                <button 
                  onClick={() => handleSubscriptionAction('activate', 'basic')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Activer Abonnement Basic (200 CFA)
                </button>
                <button 
                  onClick={() => handleSubscriptionAction('activate', 'premium')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Activer Abonnement Premium (500 CFA)
                </button>
                <button 
                  onClick={() => handleSubscriptionAction('activate', 'family')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Activer Abonnement Famille (1000 CFA)
                </button>
                <button 
                  onClick={() => handleSubscriptionAction('renew')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Renouveler Abonnement Actuel
                </button>
                <button 
                  onClick={() => handleSubscriptionAction('cancel')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Annuler Abonnement
                </button>
              </div>
              
              <button 
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}