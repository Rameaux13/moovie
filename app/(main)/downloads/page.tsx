'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Download, 
  Play, 
  Trash2, 
  Clock, 
  HardDrive, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Crown,
  Calendar
} from 'lucide-react';

interface DownloadItem {
  id: number;
  title: string;
  thumbnail: string;
  duration: number;
  genre: string;
  rating: number;
  videoId: number;
  file_size: number;
  file_size_mb: number;
  download_date: string;
  expires_at: string;
  days_remaining: number;
  is_expiring_soon: boolean;
}

interface DownloadStats {
  total_downloads: number;
  max_downloads: number;
  remaining_slots: number;
  total_size_mb: number;
  plan_type: string;
}

interface DownloadsData {
  downloads: DownloadItem[];
  stats: DownloadStats;
}

export default function DownloadsPage() {
  const { data: session } = useSession();
  const [downloadsData, setDownloadsData] = useState<DownloadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Récupérer les téléchargements
  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/downloads');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDownloadsData(data);
      } else {
        setError(data.error || 'Erreur inconnue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un téléchargement
  const handleDelete = async (downloadId: number, title: string) => {
    if (!confirm(`Supprimer "${title}" de vos téléchargements ?`)) {
      return;
    }

    setDeletingId(downloadId);
    
    try {
      const response = await fetch(`/api/downloads/${downloadId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Actualiser la liste
        await fetchDownloads();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // Formatage des dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatage de la durée
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  // Formatage de la taille de fichier
  const formatFileSize = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // Charger les données au montage
  useEffect(() => {
    if (session) {
      fetchDownloads();
    }
  }, [session]);

  // États de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
              <p className="text-lg">Chargement de vos téléchargements...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // État d'erreur ou pas d'abonnement Premium/Famille
  if (error || !downloadsData) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <Download className="w-8 h-8 text-red-600" />
            Mes Téléchargements
          </h1>
          
          <div className="text-center py-16">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Abonnement Premium requis</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Les téléchargements offline sont disponibles uniquement avec les plans Premium et Famille.
            </p>
            <Link
              href="/pricing"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <Crown className="w-5 h-5" />
              Passer à Premium
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { downloads, stats } = downloadsData;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header avec statistiques */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Download className="w-8 h-8 text-red-600" />
            Mes Téléchargements
          </h1>
          
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Téléchargés</span>
              </div>
              <p className="text-2xl font-bold">{stats.total_downloads}</p>
              <p className="text-sm text-gray-400">sur {stats.max_downloads} maximum</p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Download className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Slots restants</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">{stats.remaining_slots}</p>
              <p className="text-sm text-gray-400">téléchargements disponibles</p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Espace utilisé</span>
              </div>
              <p className="text-2xl font-bold">{formatFileSize(stats.total_size_mb)}</p>
              <p className="text-sm text-gray-400">stockage total</p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Plan actuel</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{stats.plan_type}</p>
              <p className="text-sm text-gray-400">abonnement actif</p>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="bg-gray-800 rounded-full h-3 mb-2">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${(stats.total_downloads / stats.max_downloads) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-400">
            {stats.total_downloads} / {stats.max_downloads} téléchargements utilisés
          </p>
        </div>

        {/* Liste des téléchargements */}
        {downloads.length === 0 ? (
          <div className="text-center py-16">
            <Download className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Aucun téléchargement</h2>
            <p className="text-gray-400 mb-8">
              Téléchargez vos films préférés pour les regarder offline !
            </p>
            <Link
              href="/browse"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Découvrir le catalogue
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {downloads.map((download) => (
              <div key={download.id} className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors">
                
                {/* Miniature */}
                <div className="relative aspect-video">
                  <Image
                    src={download.thumbnail}
                    alt={download.title}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Badge expiration */}
                  {download.is_expiring_soon && (
                    <div className="absolute top-2 left-2 bg-orange-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {download.days_remaining}j restants
                    </div>
                  )}
                  
                  {/* Overlay lecture */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center group">
                    <Link
                      href={`/watch/${download.videoId}?from=downloads`}
                      className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100"
                    >
                      <Play className="w-6 h-6" />
                    </Link>
                  </div>
                </div>
                
                {/* Informations */}
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{download.title}</h3>
                  
                  {/* Métadonnées */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(download.duration)}
                    </span>
                    <span className="bg-yellow-600 text-black px-2 py-1 rounded text-xs">
                      ⭐ {download.rating}
                    </span>
                  </div>
                  
                  {/* Genre */}
                  <p className="text-sm text-gray-500 mb-3">{download.genre}</p>
                  
                  {/* Détails téléchargement */}
                  <div className="space-y-2 text-xs text-gray-400 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        Taille:
                      </span>
                      <span>{formatFileSize(download.file_size_mb)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Téléchargé:
                      </span>
                      <span>{formatDate(download.download_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expire:
                      </span>
                      <span className={download.is_expiring_soon ? 'text-orange-400' : ''}>
                        {download.days_remaining} jours
                      </span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/watch/${download.videoId}?from=downloads`}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-center text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Regarder
                    </Link>
                    
                    <button
                      onClick={() => handleDelete(download.id, download.title)}
                      disabled={deletingId === download.id}
                      className="bg-gray-700 hover:bg-red-600 text-white px-3 py-2 rounded transition-colors disabled:opacity-50"
                    >
                      {deletingId === download.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Liens utiles */}
        <div className="mt-12 text-center">
          <div className="bg-gray-900 rounded-lg p-6 inline-block">
            <h3 className="text-lg font-bold mb-4">Besoin de plus d'espace ?</h3>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="/browse"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded transition-colors"
              >
                Découvrir plus de films
              </Link>
              {stats.plan_type === 'PREMIUM' && (
                <Link
                  href="/pricing"
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded transition-colors flex items-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  Passer à Famille (10 téléchargements)
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}