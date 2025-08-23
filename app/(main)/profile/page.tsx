'use client';

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Users, Plus, Crown, Baby, Settings } from "lucide-react";

// Interface pour les genres disponibles
interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// Interface pour les préférences utilisateur avec genres
interface UserPreferenceWithGenre {
  id: string;
  userId: number;
  genreId: string;
  genre: Genre;
}

// Interface pour l'utilisateur complet
interface UserWithPreferences {
  id: number;
  name: string;
  email: string;
  created_at: Date;
  preferencesCompleted: boolean;
  userPreferences: UserPreferenceWithGenre[];
}

// ✨ NOUVEAU : Interface pour les profils famille
interface Profile {
  id: number;
  name: string;
  avatar_url: string | null;
  is_main: boolean;
  is_child: boolean;
  created_at: string;
  _count: {
    favorites: number;
    watch_history: number;
  };
}

interface ProfilesData {
  profiles: Profile[];
  activeProfileId: number | null;
  subscriptionStatus: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // États pour les données utilisateur
  const [user, setUser] = useState<UserWithPreferences | null>(null);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✨ NOUVEAU : États pour les profils famille
  const [profilesData, setProfilesData] = useState<ProfilesData | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  
  // ✨ NOUVEAU : État pour la modal d'abonnement
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  
  // États pour les modals
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditPreferences, setShowEditPreferences] = useState(false);
  
  // États pour les formulaires
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    email: ''
  });
  
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Messages de feedback
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Utilitaire pour afficher un message
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Redirection si non connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Chargement des données utilisateur
  useEffect(() => {
    if (session?.user?.email && status === 'authenticated') {
      fetchUserData();
      fetchGenres();
      fetchProfiles(); // ✨ NOUVEAU : Charger les profils
    }
  }, [session?.user?.email, status]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setEditProfileForm({
          name: userData.name || '',
          email: userData.email || ''
        });
        setLoading(false);
      } else {
        console.error('Erreur API profile:', response.status);
        setLoading(false);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await fetch('/api/genres');
      if (response.ok) {
        const genres = await response.json();
        setAvailableGenres(genres);
      } else {
        console.error('Erreur API genres:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des genres:', error);
    }
  };

  // ✨ NOUVEAU : Charger les profils famille
  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      if (response.ok) {
        const data = await response.json();
        setProfilesData(data);
      } else {
        console.error('Erreur API profiles:', response.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des profils:', error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  // ✨ NOUVEAU : Fonction pour vérifier l'abonnement
  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription-status');
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data);
        return data;
      }
    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
    }
    return null;
  };

  // ✨ NOUVEAU : Fonction pour gérer le clic sur "Profils Famille"
  // ✨ REMPLACER la fonction handleProfilesClick pour debug complet

// ✨ NOUVEAU : Fonction pour gérer le clic sur "Profils Famille" - VERSION DEBUG
const handleProfilesClick = async () => {
  console.log('🔍 Vérification abonnement famille...');
  
  const subscription = await checkSubscription();
  console.log('📊 Données abonnement COMPLÈTES:', JSON.stringify(subscription, null, 2));
  
  // ✅ DEBUG - Voir tous les champs
  console.log('🔍 hasActiveSubscription:', subscription?.hasActiveSubscription);
  console.log('🔍 subscription object:', subscription?.subscription);
  console.log('🔍 planType exact:', subscription?.subscription?.planType);
  console.log('🔍 planType type:', typeof subscription?.subscription?.planType);
  
  // Vérifier si l'utilisateur a un abonnement actif ET si c'est un plan FAMILLE
  const hasActiveSubscription = subscription?.hasActiveSubscription;
  const planType = subscription?.subscription?.planType;
  
  console.log(`📋 Abonnement actif: ${hasActiveSubscription}`);
  console.log(`📋 Plan actuel: ${planType}`);
  
  // ✅ NOUVELLE LOGIQUE - Vérifier les deux variantes
  const hasValidFamilySubscription = hasActiveSubscription && (
    planType === 'FAMILLE' ||  // Version française
    planType === 'FAMILY' ||   // Version anglaise
    planType === 'Famille'     // Version avec majuscule
  );

  console.log('✅ A un abonnement Famille valide:', hasValidFamilySubscription);
  console.log(`📋 Conditions:`);
  console.log(`   - hasActiveSubscription: ${hasActiveSubscription}`);
  console.log(`   - planType === 'FAMILLE': ${planType === 'FAMILLE'}`);
  console.log(`   - planType === 'FAMILY': ${planType === 'FAMILY'}`);
  console.log(`   - planType === 'Famille': ${planType === 'Famille'}`);

  if (hasValidFamilySubscription) {
    console.log('✅ Abonnement Famille valide → Redirection vers /profiles');
    router.push('/profiles');
  } else {
    console.log('❌ Pas d abonnement Famille → Affichage modal upgrade');
    console.log(`   Raison: Plan "${planType}" ne correspond pas à FAMILLE/FAMILY`);
    setShowUpgradeModal(true);
  }
};

  // Gestion de la déconnexion
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Gestion de l'édition du profil
  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfileForm)
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setShowEditProfile(false);
        showMessage('success', 'Profil mis à jour avec succès !');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  // Gestion du changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: changePasswordForm.currentPassword,
          newPassword: changePasswordForm.newPassword
        })
      });
      
      if (response.ok) {
        setShowChangePassword(false);
        setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showMessage('success', 'Mot de passe modifié avec succès !');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  // Gestion de la modification des préférences
  const handleEditPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedGenres.length < 3 || selectedGenres.length > 5) {
      showMessage('error', 'Veuillez sélectionner entre 3 et 5 genres');
      return;
    }
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreIds: selectedGenres })
      });
      
      if (response.ok) {
        fetchUserData(); // Recharger les données
        setShowEditPreferences(false);
        showMessage('success', 'Préférences mises à jour avec succès !');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour des préférences');
      }
    } catch (error: any) {
      showMessage('error', error.message);
    }
  };

  // Ouverture du modal de modification des préférences
  const openEditPreferences = () => {
    setSelectedGenres(user?.userPreferences.map(p => p.genreId) || []);
    setShowEditPreferences(true);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Calcul de statistiques
  const memberSince = new Date(user.created_at).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Message de feedback */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-medium`}>
          {message.text}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="bg-gray-900 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/home" className="text-gray-400 hover:text-red-400 transition-colors">
              Accueil
            </a>
            <span className="text-gray-500">/</span>
            <span className="text-red-400 font-medium">Mon Profil</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de profil */}
        <div className="bg-gradient-to-r from-red-900/50 to-black rounded-2xl p-8 mb-8 border border-red-800/30">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            </div>

            {/* Informations principales */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.name || "Utilisateur NETFLIX"}
              </h1>
              <p className="text-gray-300 mb-4">{user.email}</p>
              
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>Membre depuis le {memberSince}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Profil vérifié</span>
                </div>
              </div>
            </div>

            {/* Bouton d'action */}
            <div>
              <button 
                onClick={() => setShowEditProfile(true)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Modifier le profil
              </button>
            </div>
          </div>
        </div>

        {/* Grille des sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations du compte */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Informations du compte
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Nom d'utilisateur</span>
                <span className="text-white font-medium">
                  {user.name || "Non défini"}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Email</span>
                <span className="text-white font-medium">{user.email}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-800">
                <span className="text-gray-400">Statut du compte</span>
                <span className="text-green-400 font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Actif
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Préférences configurées</span>
                <span className="text-green-400 font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Oui ({user.userPreferences.length} genres)
                </span>
              </div>
            </div>
          </div>

          {/* Vos genres préférés */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Vos genres préférés
            </h2>
            
            <div className="grid grid-cols-2 gap-3">
              {user.userPreferences.map((preference) => (
                <div 
                  key={preference.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105`}
                  style={{ 
                    backgroundColor: `${preference.genre.color}20`,
                    borderColor: preference.genre.color 
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{preference.genre.icon}</span>
                    <span 
                      className="font-semibold text-sm"
                      style={{ color: preference.genre.color }}
                    >
                      {preference.genre.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={openEditPreferences}
              className="w-full mt-4 px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/10 transition-colors"
            >
              Modifier mes préférences
            </button>
          </div>

          {/* ✨ NOUVEAU : Section Profils Famille */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              <Users className="w-5 h-5 mr-2" />
              Profils Famille
            </h2>
            
            {loadingProfiles ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-400">Chargement des profils...</p>
              </div>
            ) : profilesData && profilesData.profiles.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {profilesData.profiles.slice(0, 4).map((profile) => (
                    <div key={profile.id} className="text-center">
                      <div className="relative w-16 h-16 bg-gradient-to-br from-red-600 to-red-800 rounded-lg mb-2 flex items-center justify-center mx-auto">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-white text-lg">
                            {profile.is_child ? <Baby className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                          </div>
                        )}
                        
                        {profile.is_main && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                            <Crown className="w-3 h-3 text-black" />
                          </div>
                        )}
                        
                        {profilesData.activeProfileId === profile.id && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                            <span className="text-xs text-white">✓</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-white text-sm font-medium truncate">{profile.name}</h3>
                      <div className="text-gray-400 text-xs">
                        {profile._count.favorites} favoris
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleProfilesClick}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    Gérer tous les profils ({profilesData.profiles.length})
                  </button>
                  
                  {profilesData.profiles.length < 5 && profilesData.subscriptionStatus === 'ACTIVE' && (
                    <button
                      onClick={handleProfilesClick}
                      className="flex-1 px-4 py-2 border border-red-600 text-red-400 rounded-lg hover:bg-red-600/10 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter un profil
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Aucun profil famille configuré</p>
                <button
                  onClick={handleProfilesClick}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                >
                  Configurer les profils
                </button>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
              Actions rapides
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button 
                onClick={() => setShowChangePassword(true)}
                className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🔐</span>
                  <div>
                    <div className="font-semibold">Changer mot de passe</div>
                    <div className="text-sm text-gray-300">Sécuriser votre compte</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={openEditPreferences}
                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎭</span>
                  <div>
                    <div className="font-semibold">Modifier préférences</div>
                    <div className="text-sm text-gray-300">Changer vos genres</div>
                  </div>
                </div>
              </button>

              {/* ✨ NOUVEAU : Bouton Profils Famille */}
              <button 
                onClick={handleProfilesClick}
                className="px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <Users className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">Profils Famille</div>
                    <div className="text-sm text-gray-300">Gérer les profils</div>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={handleLogout}
                className="px-6 py-4 bg-red-900/30 hover:bg-red-900/50 border border-red-800 rounded-lg transition-colors text-left text-red-400"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🚪</span>
                  <div>
                    <div className="font-semibold">Se déconnecter</div>
                    <div className="text-sm text-red-300">Quitter NETFLIX</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Modifier le profil */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Modifier le profil</h2>
            
            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={editProfileForm.name}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Votre nom"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editProfileForm.email}
                  onChange={(e) => setEditProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Changer le mot de passe */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-6">Changer le mot de passe</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={changePasswordForm.currentPassword}
                  onChange={(e) => setChangePasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Mot de passe actuel"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Nouveau mot de passe"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum 6 caractères avec majuscule, minuscule et chiffre
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  value={changePasswordForm.confirmPassword}
                  onChange={(e) => setChangePasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                  placeholder="Confirmer le mot de passe"
                  required
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setChangePasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Modifier les préférences */}
      {showEditPreferences && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-6">Modifier vos genres préférés</h2>
            
            <form onSubmit={handleEditPreferences}>
              <p className="text-gray-300 text-sm mb-4">
                Sélectionnez entre 3 et 5 genres que vous préférez ({selectedGenres.length}/5)
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedGenres(prev => prev.filter(id => id !== genre.id));
                        } else if (selectedGenres.length < 5) {
                          setSelectedGenres(prev => [...prev, genre.id]);
                        }
                      }}
                      disabled={!isSelected && selectedGenres.length >= 5}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'scale-105 shadow-lg'
                          : selectedGenres.length >= 5
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${genre.color}30` : `${genre.color}10`,
                        borderColor: isSelected ? genre.color : `${genre.color}50`
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{genre.icon}</span>
                        <span 
                          className="font-semibold text-sm"
                          style={{ color: genre.color }}
                        >
                          {genre.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditPreferences(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={selectedGenres.length < 3 || selectedGenres.length > 5}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Sauvegarder ({selectedGenres.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UPGRADE FAMILLE - ✨ NOUVEAU */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-lg border border-gray-800">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Profils Famille
              </h2>
              <p className="text-gray-400">
                Fonctionnalité réservée au plan Famille
              </p>
            </div>

            {/* Contenu */}
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Plan Famille - 1000 CFA/mois
              </h3>
              
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Jusqu'à 5 profils famille
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Contrôle parental pour enfants
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Préférences individuelles
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Historique séparé par profil
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  10 téléchargements offline
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Qualité 4K Ultra HD
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  5 écrans simultanés
                </li>
              </ul>
            </div>

            {/* Message d'encouragement */}
            <div className="text-center mb-6">
              <p className="text-gray-300 text-sm">
                <span className="text-red-400 font-semibold">Profitez</span> de l'expérience Netflix complète 
                avec toute votre famille ! 👨‍👩‍👧‍👦
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  router.push('/pricing');
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white py-3 rounded-lg font-medium transition-all transform hover:scale-105"
              >
                Passer au plan Famille
              </button>
            </div>

            {/* Note légale */}
            <p className="text-gray-500 text-xs text-center mt-4">
              Facturé mensuellement • Annulable à tout moment
            </p>
          </div>
        </div>
      )}
    </div>
  );
}