'use client';

// app/(main)/profiles/page.tsx
// 👨‍👩‍👧‍👦 PAGE SÉLECTION/GESTION PROFILS FAMILLE

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, User, Baby, Crown, Edit3, Trash2 } from 'lucide-react';

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

export default function ProfilesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profilesData, setProfilesData] = useState<ProfilesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileIsChild, setNewProfileIsChild] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileIsChild, setEditProfileIsChild] = useState(false);
  const [error, setError] = useState('');

  // Charger les profils
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfiles();
    }
  }, [session]);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/profiles');
      const data = await response.json();
      
      if (response.ok) {
        setProfilesData(data);
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Changer de profil actif
  const switchProfile = async (profileId: number) => {
    try {
      const response = await fetch('/api/profiles/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId })
      });

      if (response.ok) {
        // Rediriger vers la page d'accueil avec le nouveau profil
        router.push('/home');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors du changement de profil');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  // Créer un nouveau profil
  const createProfile = async () => {
    if (!newProfileName.trim()) {
      setError('Le nom du profil est requis');
      return;
    }

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProfileName.trim(),
          is_child: newProfileIsChild
        })
      });

      const data = await response.json();

      if (response.ok) {
        setNewProfileName('');
        setNewProfileIsChild(false);
        setIsCreating(false);
        setError('');
        fetchProfiles(); // Recharger la liste
      } else {
        setError(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  // Modifier un profil
  const updateProfile = async (profileId: number) => {
    if (!editProfileName.trim()) {
      setError('Le nom du profil est requis');
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProfileName.trim(),
          is_child: editProfileIsChild
        })
      });

      if (response.ok) {
        setIsEditing(null);
        setEditProfileName('');
        setEditProfileIsChild(false);
        setError('');
        fetchProfiles(); // Recharger la liste
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la modification');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  // Supprimer un profil
  const deleteProfile = async (profileId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce profil ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchProfiles(); // Recharger la liste
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur de connexion');
    }
  };

  // Ouvrir l'édition d'un profil
  const openEditProfile = (profile: Profile) => {
    setEditProfileName(profile.name);
    setEditProfileIsChild(profile.is_child);
    setIsEditing(profile.id);
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white">Chargement des profils...</p>
        </div>
      </div>
    );
  }

  if (!profilesData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-gray-400 mb-4">{error || 'Impossible de charger les profils'}</p>
          <button
            onClick={() => router.push('/home')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const { profiles, subscriptionStatus } = profilesData;

  // Déterminer le nombre max de profils selon l'abonnement
  const getMaxProfiles = () => {
    if (subscriptionStatus === 'ACTIVE') {
      // TODO: Récupérer le plan exact depuis les abonnements
      return 5; // Famille par défaut
    }
    return 1; // Basic
  };

  const maxProfiles = getMaxProfiles();
  const canCreateMore = profiles.length < maxProfiles;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            Qui regarde Netflix ?
          </h1>
          <p className="text-gray-400 text-center">
            Sélectionnez votre profil pour continuer
          </p>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-red-600/20 border border-red-600 rounded-lg p-4">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-red-300 text-sm mt-2 mx-auto block"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Grille des profils */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {/* Profils existants */}
          {profiles.map((profile) => (
            <div key={profile.id} className="text-center group">
              <div className="relative">
                {/* Avatar */}
                <div 
                  onClick={() => switchProfile(profile.id)}
                  className="relative w-32 h-32 bg-gradient-to-br from-red-600 to-red-800 rounded-lg mb-4 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 group-hover:ring-4 group-hover:ring-red-600/50"
                >
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-white text-4xl">
                      {profile.is_child ? <Baby /> : <User />}
                    </div>
                  )}
                  
                  {/* Badge profil principal */}
                  {profile.is_main && (
                    <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                      <Crown className="w-4 h-4 text-black" />
                    </div>
                  )}

                  {/* Badge profil actif */}
                  {profilesData.activeProfileId === profile.id && (
                    <div className="absolute -bottom-2 -left-2 bg-green-500 rounded-full p-1">
                      <span className="text-xs text-white font-bold">✓</span>
                    </div>
                  )}
                </div>

                {/* Actions profil */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditProfile(profile)}
                      className="bg-black/80 hover:bg-black text-white p-1 rounded"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {!profile.is_main && (
                      <button
                        onClick={() => deleteProfile(profile.id)}
                        className="bg-red-600/80 hover:bg-red-600 text-white p-1 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Nom et stats */}
              <h3 className="text-white font-medium mb-1">{profile.name}</h3>
              <div className="text-gray-400 text-sm">
                {profile._count.favorites} favoris • {profile._count.watch_history} vus
              </div>
              {profile.is_child && (
                <div className="text-blue-400 text-xs mt-1">👶 Profil enfant</div>
              )}
            </div>
          ))}

          {/* Bouton Ajouter un profil */}
          {canCreateMore && (
            <div className="text-center">
              <div 
                onClick={() => setIsCreating(true)}
                className="w-32 h-32 border-2 border-dashed border-gray-600 rounded-lg mb-4 flex items-center justify-center cursor-pointer hover:border-red-600 hover:bg-red-600/10 transition-colors duration-200"
              >
                <Plus className="w-8 h-8 text-gray-400 hover:text-red-600" />
              </div>
              <h3 className="text-gray-400 font-medium">Ajouter un profil</h3>
              <div className="text-gray-500 text-sm">
                {profiles.length}/{maxProfiles} profils
              </div>
            </div>
          )}
        </div>

        {/* Limite atteinte */}
        {!canCreateMore && subscriptionStatus !== 'ACTIVE' && (
          <div className="text-center mt-12">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-white font-bold mb-2">Limite atteinte</h3>
              <p className="text-gray-400 text-sm mb-4">
                Votre plan Basic ne permet qu'un seul profil. 
                Passez au plan Famille pour créer jusqu'à 5 profils !
              </p>
              <button
                onClick={() => router.push('/pricing')}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Voir les plans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Créer un profil */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-white text-xl font-bold mb-4">Nouveau profil</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nom du profil
                </label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ex: Papa, Maman, Lucas..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  maxLength={20}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isChild"
                  checked={newProfileIsChild}
                  onChange={(e) => setNewProfileIsChild(e.target.checked)}
                  className="mr-3 h-4 w-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600"
                />
                <label htmlFor="isChild" className="text-gray-300 text-sm">
                  Profil enfant (contrôle parental)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewProfileName('');
                  setNewProfileIsChild(false);
                  setError('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createProfile}
                disabled={!newProfileName.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier un profil */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-white text-xl font-bold mb-4">Modifier le profil</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Nom du profil
                </label>
                <input
                  type="text"
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  placeholder="Ex: Papa, Maman, Lucas..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  maxLength={20}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsChild"
                  checked={editProfileIsChild}
                  onChange={(e) => setEditProfileIsChild(e.target.checked)}
                  className="mr-3 h-4 w-4 text-red-600 bg-gray-800 border-gray-600 rounded focus:ring-red-600"
                />
                <label htmlFor="editIsChild" className="text-gray-300 text-sm">
                  Profil enfant (contrôle parental)
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsEditing(null);
                  setEditProfileName('');
                  setEditProfileIsChild(false);
                  setError('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => updateProfile(isEditing)}
                disabled={!editProfileName.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boutons de navigation */}
      <div className="text-center mt-12 pb-20">
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/home')}
            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Continuer sans changer
          </button>
          <button
            onClick={() => router.push('/profile')}
            className="border border-red-600 text-red-400 hover:bg-red-600/10 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Gérer le compte
          </button>
        </div>
      </div>
    </div>
  );
}