'use client'

import { useEffect, useState } from 'react'

interface User {
  id: number
  name: string
  email: string
}

interface Subscription {
  id: number
  user: User
  plan_type: string
  status: string
  start_date: string
  end_date: string
  moneyfusion_subscription_id: string | null
  created_at: string
  updated_at: string
  daysUntilExpiry: number
  isExpiringSoon: boolean
  isActive: boolean
}

interface ApiStats {
  total: number
  active: number
  expired: number
  expiring_soon: number
}

interface ApiRevenue {
  total: number
  byPlan: {
    basic: number
    premium: number
    family: number
  }
  monthly: number
}

export default function SubscriptionsAdmin() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [apiStats, setApiStats] = useState<ApiStats>({
    total: 0,
    active: 0,
    expired: 0,
    expiring_soon: 0
  })
  const [apiRevenue, setApiRevenue] = useState<ApiRevenue>({
    total: 0,
    byPlan: { basic: 0, premium: 0, family: 0 },
    monthly: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('BASIC')
  const [users, setUsers] = useState<User[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSubscriptions()
    fetchUsers()
  }, [])

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchSubscriptions = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/subscriptions')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des abonnements')
      }
      
      const result = await response.json()
      setSubscriptions(result.data)
      setApiStats(result.stats)
      setApiRevenue(result.revenue)
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur récupération abonnements:', error)
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const result = await response.json()
        setUsers(result.data)
      }
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error)
    }
  }

  const handleExportRevenue = () => {
    const reportData = [
      ['Plan', 'Revenus (CFA)', 'Nombre d\'abonnements'],
      ['Basic', apiRevenue.byPlan.basic, apiRevenue.byPlan.basic / 200],
      ['Premium', apiRevenue.byPlan.premium, apiRevenue.byPlan.premium / 500],
      ['Famille', apiRevenue.byPlan.family, apiRevenue.byPlan.family / 1000],
      ['TOTAL', apiRevenue.total, apiStats.active]
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([reportData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `rapport_revenus_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    showMessage('Rapport de revenus téléchargé avec succès!')
  }

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUserId || !selectedPlan) {
      showMessage('Veuillez sélectionner un utilisateur et un plan')
      return
    }
    
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(selectedUserId),
          planType: selectedPlan
        })
      })
      
      if (response.ok) {
        showMessage('Abonnement créé avec succès!')
        setSelectedUserId('')
        setSelectedPlan('BASIC')
        setShowCreateModal(false)
        fetchSubscriptions()
      } else {
        const errorData = await response.json()
        showMessage(errorData.error || 'Erreur lors de la création de l\'abonnement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la création de l\'abonnement')
    }
  }

  const handleRenewSubscription = async (subscription: Subscription) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renew'
        })
      })
      
      if (response.ok) {
        showMessage('Abonnement renouvelé avec succès!')
        fetchSubscriptions()
      } else {
        showMessage('Erreur lors du renouvellement de l\'abonnement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors du renouvellement de l\'abonnement')
    }
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setSelectedPlan(subscription.plan_type)
    setShowEditModal(true)
  }

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSubscription) return
    
    try {
      const response = await fetch(`/api/admin/subscriptions/${selectedSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          planType: selectedPlan
        })
      })
      
      if (response.ok) {
        showMessage('Abonnement modifié avec succès!')
        setShowEditModal(false)
        setSelectedSubscription(null)
        fetchSubscriptions()
      } else {
        showMessage('Erreur lors de la modification de l\'abonnement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la modification de l\'abonnement')
    }
  }

  const handleCancelSubscription = async (subscription: Subscription) => {
    try {
      const response = await fetch(`/api/admin/subscriptions/${subscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel'
        })
      })
      
      if (response.ok) {
        showMessage('Abonnement annulé avec succès!')
        fetchSubscriptions()
      } else {
        showMessage('Erreur lors de l\'annulation de l\'abonnement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de l\'annulation de l\'abonnement')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">Actif</span>
      case 'EXPIRED':
        return <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">Expiré</span>
      case 'CANCELLED':
        return <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Annulé</span>
      case 'PENDING':
        return <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">En attente</span>
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">{status}</span>
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan.toUpperCase()) {
      case 'BASIC':
        return <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Basic (200 CFA)</span>
      case 'PREMIUM':
        return <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">Premium (500 CFA)</span>
      case 'FAMILY':
        return <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">Famille (1000 CFA)</span>
      default:
        return <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs">{plan}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-lg">Chargement des abonnements...</div>
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
          <h1 className="text-3xl font-bold text-white">Gestion des Abonnements</h1>
          <p className="text-gray-400 mt-2">Suivez tous les {apiStats.total} abonnements MoneyFusion</p>
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleExportRevenue}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Rapport Revenus
          </button>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Créer Abonnement
          </button>
        </div>
      </div>

      {/* Statistiques revenus avec vraies données */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Total Abonnements</p>
          <p className="text-2xl font-bold text-white">{apiStats.total}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Abonnements Actifs</p>
          <p className="text-2xl font-bold text-green-500">{apiStats.active}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Expirent Bientôt</p>
          <p className="text-2xl font-bold text-yellow-500">{apiStats.expiring_soon}</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-sm">Revenus Mensuels</p>
          <p className="text-2xl font-bold text-green-400">{apiRevenue.monthly.toLocaleString()} CFA</p>
        </div>
      </div>

      {/* Détail des revenus par plan */}
      <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
        <h2 className="text-xl font-bold text-white mb-4">Revenus par Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-600 p-4 rounded-lg">
            <p className="text-white font-semibold">Plan Basic</p>
            <p className="text-2xl font-bold text-white">{apiRevenue.byPlan.basic.toLocaleString()} CFA</p>
            <p className="text-blue-200 text-sm">{apiRevenue.byPlan.basic / 200} abonnements</p>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <p className="text-white font-semibold">Plan Premium</p>
            <p className="text-2xl font-bold text-white">{apiRevenue.byPlan.premium.toLocaleString()} CFA</p>
            <p className="text-purple-200 text-sm">{apiRevenue.byPlan.premium / 500} abonnements</p>
          </div>
          <div className="bg-yellow-600 p-4 rounded-lg">
            <p className="text-white font-semibold">Plan Famille</p>
            <p className="text-2xl font-bold text-white">{apiRevenue.byPlan.family.toLocaleString()} CFA</p>
            <p className="text-yellow-200 text-sm">{apiRevenue.byPlan.family / 1000} abonnements</p>
          </div>
        </div>
      </div>

      {/* Tableau des abonnements */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Utilisateur</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Plan</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Statut</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Début</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Fin</th>
                <th className="px-6 py-4 text-left text-white font-semibold">MoneyFusion ID</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{subscription.user.name}</div>
                      <div className="text-gray-400 text-sm">{subscription.user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlanBadge(subscription.plan_type)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(subscription.status)}
                      {subscription.isExpiringSoon && (
                        <span className="text-yellow-500 text-xs">⚠️ Expire dans {subscription.daysUntilExpiry} jours</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(subscription.start_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(subscription.end_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                      {subscription.moneyfusion_subscription_id || 'N/A'}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleRenewSubscription(subscription)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Renouveler
                      </button>
                      <button 
                        onClick={() => handleEditSubscription(subscription)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleCancelSubscription(subscription)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Créer Abonnement */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Créer un Abonnement</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Utilisateur
                </label>
                <select 
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                  required
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Plan d'abonnement
                </label>
                <select 
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                >
                  <option value="BASIC">Basic (200 CFA/mois)</option>
                  <option value="PREMIUM">Premium (500 CFA/mois)</option>
                  <option value="FAMILY">Famille (1000 CFA/mois)</option>
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

      {/* Modal Modifier Abonnement */}
      {showEditModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier l'Abonnement</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300">Utilisateur: <span className="text-white font-semibold">{selectedSubscription.user.name}</span></p>
              <p className="text-gray-300">Plan actuel: {getPlanBadge(selectedSubscription.plan_type)}</p>
            </div>
            
            <form onSubmit={handleUpdateSubscription} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau plan
                </label>
                <select 
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value)}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-600"
                >
                  <option value="BASIC">Basic (200 CFA/mois)</option>
                  <option value="PREMIUM">Premium (500 CFA/mois)</option>
                  <option value="FAMILY">Famille (1000 CFA/mois)</option>
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
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}