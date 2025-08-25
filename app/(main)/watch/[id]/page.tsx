'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  ArrowLeft,
  Heart,
  SkipForward,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// ===== CONFIGURATION TPE CLOUD =====
const TPE_CLOUD_CONFIG = {
  BASE_URL: 'https://sp-p6.com/axelle',
  VIDEOS_PATH: '/videos/',
  THUMBNAILS_PATH: '/images/',
  
  getVideoUrl: (fileName: string) => {
    return `${TPE_CLOUD_CONFIG.BASE_URL}${TPE_CLOUD_CONFIG.VIDEOS_PATH}${fileName}`;
  },
  
  getThumbnailUrl: (fileName: string) => {
    return `${TPE_CLOUD_CONFIG.BASE_URL}${TPE_CLOUD_CONFIG.THUMBNAILS_PATH}${fileName}`;
  }
};

// Configuration vidéo
const VIDEO_CONFIG = {
  crossOrigin: "anonymous" as const,
  preload: "metadata" as const,
  playsInline: true
};

interface MovieData {
  id: number;
  title: string;
  description: string;
  duration: number;
  release_date: string;
  thumbnail_url: string;
  video_file_path: string;
  rating: number;
  views: number;
  genres: Array<{
    id: string;
    name: string;
    color: string;
    icon: string;
  }>;
}

interface WatchData {
  movie: MovieData;
  userProgress: number;
  continueWatching: boolean;
  isFavorite: boolean;
  relatedMovies: Array<{
    id: number;
    title: string;
    thumbnail_url: string;
    rating: number;
    duration: number;
    genres: string[];
  }>;
  returnContext: string;
}

interface DownloadStatus {
  isDownloaded: boolean;
  canDownload: boolean;
  planType: string;
  downloadId?: number;
  isLoading: boolean;
  error?: string;
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [watchData, setWatchData] = useState<WatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États du lecteur vidéo
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  
  // États pour protection anti-enregistrement
  const [isRecordingDetected, setIsRecordingDetected] = useState(false);
  const [recordingWarningCount, setRecordingWarningCount] = useState(0);
  const [isVideoBlocked, setIsVideoBlocked] = useState(false);
  
  // États gestion téléchargement
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({
    isDownloaded: false,
    canDownload: false,
    planType: 'BASIC',
    isLoading: false
  });
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const saveProgressInterval = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);
  const recordingDetectionInterval = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour vérifier le statut de téléchargement
  const checkDownloadStatus = async (movieId: number) => {
    try {
      const response = await fetch('/api/downloads');
      const data = await response.json();
      
      if (data.success) {
        const existingDownload = data.downloads.find((d: any) => d.videoId === movieId);
        const canDownload = data.stats.plan_type === 'PREMIUM' || data.stats.plan_type === 'FAMILLE';
        
        setDownloadStatus({
          isDownloaded: !!existingDownload,
          canDownload,
          planType: data.stats.plan_type,
          downloadId: existingDownload?.id,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Erreur vérification téléchargement:', error);
      setDownloadStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Fonction pour télécharger un film
  const handleDownload = async () => {
    if (!watchData || downloadStatus.isDownloaded || !downloadStatus.canDownload) return;

    setDownloadStatus(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      const response = await fetch('/api/downloads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: watchData.movie.id })
      });

      const data = await response.json();

      if (data.success) {
        setDownloadStatus(prev => ({ 
          ...prev, 
          isDownloaded: true, 
          downloadId: data.download.id,
          isLoading: false 
        }));
        
        setShowDownloadMessage(true);
        setTimeout(() => setShowDownloadMessage(false), 3000);
      } else {
        setDownloadStatus(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: data.error 
        }));
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      setDownloadStatus(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Erreur lors du téléchargement' 
      }));
    }
  };

  // Obtenir l'icône et le texte du bouton téléchargement
  const getDownloadButtonContent = () => {
    if (downloadStatus.isLoading) {
      return { icon: <Loader2 className="w-6 h-6 animate-spin" />, text: "Téléchargement..." };
    }
    
    if (downloadStatus.isDownloaded) {
      return { icon: <CheckCircle className="w-6 h-6" />, text: "Téléchargé" };
    }
    
    if (!downloadStatus.canDownload) {
      return { icon: <AlertCircle className="w-6 h-6" />, text: "Premium requis" };
    }
    
    return { icon: <Download className="w-6 h-6" />, text: "Télécharger" };
  };

  // Protection anti-téléchargement
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.key === 'U') ||
          (e.ctrlKey && e.key === 'S') ||
          (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    const video = videoRef.current;
    if (video) {
      video.addEventListener('contextmenu', handleContextMenu);
      video.setAttribute('controlsList', 'nodownload noremoteplayback');
      video.setAttribute('disablePictureInPicture', 'true');
      video.setAttribute('oncontextmenu', 'return false;');
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      
      if (video) {
        video.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, []);

  // Protection anti-enregistrement complète
  useEffect(() => {
    let isRecording = false;
    let warningShown = false;

    const handleRecordingDetected = () => {
      if (isRecording) return;
      
      isRecording = true;
      setIsRecordingDetected(true);
      setRecordingWarningCount(prev => prev + 1);

      console.log('🚨 ENREGISTREMENT DÉTECTÉ - Activation des protections');

      if (recordingWarningCount === 0) {
        console.log('⚠️ PREMIER AVERTISSEMENT - Floutage activé');
        
        setTimeout(() => {
          if (!warningShown) {
            setIsRecordingDetected(false);
            isRecording = false;
          }
        }, 8000);
      } else if (recordingWarningCount >= 1) {
        console.log('🚨 DEUXIÈME DÉTECTION - ARRÊT DE LA VIDÉO');
        setIsVideoBlocked(true);
        
        if (videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }

      warningShown = true;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && e.key === 'F9') ||
        (e.ctrlKey && e.shiftKey && e.key === 'R') ||
        (e.key === 'F9') ||
        (e.ctrlKey && e.altKey && e.key === 'r') ||
        (e.key === 'PrintScreen') ||
        (e.metaKey && e.key === 'g') ||
        (e.metaKey && e.altKey && e.key === 'r') ||
        (e.metaKey && e.shiftKey && e.key === 'S')
      ) {
        console.log('🚨 COMBINAISON D\'ENREGISTREMENT DÉTECTÉE');
        handleRecordingDetected();
      }
    };

    let focusChangeCount = 0;
    let lastFocusTime = Date.now();
    
    const handleBlur = () => {
      const now = Date.now();
      if (now - lastFocusTime < 5000) {
        focusChangeCount++;
        console.log(`⚠️ Changement de focus #${focusChangeCount}`);
        
        if (focusChangeCount > 2) {
          console.log('🚨 ACTIVITÉ SUSPECTE - Changements de focus répétés');
          handleRecordingDetected();
          focusChangeCount = 0;
        }
      }
      lastFocusTime = now;
    };

    const performanceCheck = () => {
      const start = performance.now();
      setTimeout(() => {
        const lag = performance.now() - start;
        if (lag > 100) {
          console.log(`⚠️ Lag détecté: ${lag}ms`);
          handleRecordingDetected();
        }
      }, 0);
    };

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    
    const performanceInterval = setInterval(performanceCheck, 5000);

    if (navigator.mediaDevices?.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function(...args) {
        console.log('🚨 CAPTURE D\'ÉCRAN DÉTECTÉE - API getDisplayMedia');
        handleRecordingDetected();
        return originalGetDisplayMedia.apply(this, args);
      };
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      clearInterval(performanceInterval);
    };
  }, [recordingWarningCount]);

  // Fonction pour réactiver après arrêt d'enregistrement
  const handleStopRecording = () => {
    setIsRecordingDetected(false);
    setIsVideoBlocked(false);
    setRecordingWarningCount(0);
    console.log('✅ Protection désactivée - Lecture normale');
  };

  // Gestion de la progression automatique
  useEffect(() => {
    if (isPlaying && watchData) {
      saveProgressInterval.current = setInterval(() => {
        saveProgress();
      }, 30000);
    } else {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }
    }

    return () => {
      if (saveProgressInterval.current) {
        clearInterval(saveProgressInterval.current);
      }
    };
  }, [isPlaying, watchData]);

  // Gestion de l'affichage des contrôles
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      
      hideControlsTimeout.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) {
          setShowControls(false);
        }
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [isPlaying]);

  // Masquer l'overlay après 5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOverlay(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // Récupérer les données du film
  useEffect(() => {
    const fetchWatchData = async () => {
      try {
        setLoading(true);
        const from = searchParams.get('from') || 'home';
        const resolvedParams = await params;
        const movieId = parseInt(resolvedParams.id);

        const response = await fetch(`/api/watch/${movieId}?from=${from}`);

        if (!response.ok) {
          throw new Error('Film non trouvé');
        }
        
        const data: WatchData = await response.json();
        setWatchData(data);
        
        await checkDownloadStatus(movieId);
        
        if (data.userProgress > 0 && data.userProgress < 95) {
          const startTime = (data.userProgress / 100) * (data.movie.duration * 60);
          setCurrentTime(startTime);
        }
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchWatchData();
    }
  }, [searchParams, session]);

  // Fonctions du lecteur vidéo
  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        if (videoRef.current.readyState >= 2) {
          await videoRef.current.play();
        } else {
          videoRef.current.addEventListener('loadeddata', async () => {
            try {
              await videoRef.current?.play();
            } catch (error) {
              console.log('Erreur lecture différée:', error);
            }
          }, { once: true });
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.log('Erreur lecture:', error);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    
    if (watchData && watchData.userProgress > 0 && watchData.userProgress < 95) {
      const startTime = (watchData.userProgress / 100) * videoRef.current.duration;
      videoRef.current.currentTime = startTime;
    }
  };

  const saveProgress = async () => {
    if (!watchData || !videoRef.current) return;
    
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    
    try {
      await fetch('/api/watch/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: watchData.movie.id,
          progress: Math.round(progress * 100) / 100
        })
      });
    } catch (error) {
      console.error('Erreur sauvegarde progression:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!watchData) return;
    
    try {
      const method = watchData.isFavorite ? 'DELETE' : 'POST';
      const response = await fetch('/api/favorites', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId: watchData.movie.id })
      });

      if (response.ok) {
        setWatchData({
          ...watchData,
          isFavorite: !watchData.isFavorite
        });
      }
    } catch (error) {
      console.error('Erreur favoris:', error);
    }
  };

  const skipForward = () => {
    if (!videoRef.current) return;
    
    const newTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleBackClick = () => {
    saveProgress();
    
    switch (watchData?.returnContext) {
      case 'browse':
        router.push('/browse');
        break;
      case 'my-list':
        router.push('/my-list');
        break;
      case 'downloads':
        router.push('/downloads');
        break;
      default:
        router.push('/home');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Chargement du film...</p>
        </div>
      </div>
    );
  }

  if (error || !watchData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-2xl mb-4">Erreur</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link 
            href="/home"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const { icon: downloadIcon, text: downloadText } = getDownloadButtonContent();

  // ===== CONSTRUCTION DE L'URL VIDÉO DYNAMIQUE =====
  const videoSrc = TPE_CLOUD_CONFIG.getVideoUrl(watchData.movie.video_file_path);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-screen bg-black overflow-hidden transition-all duration-300 select-none ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
      onClick={() => setShowControls(!showControls)}
      style={{ userSelect: 'none' }}
    >
      {/* Vidéo - MODIFIÉE POUR UTILISER TPE CLOUD */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain select-none pointer-events-auto transition-all duration-500 ${
          isRecordingDetected ? 'blur-3xl' : ''
        }`}
        src={videoSrc}
        {...VIDEO_CONFIG}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          saveProgress();
        }}
        onError={(e) => {
          const target = e.target as HTMLVideoElement;
          console.log('ERREUR VIDÉO:', target.src);
          console.log('URL utilisée:', videoSrc);
          setError(`Erreur de chargement: ${watchData.movie.video_file_path}`);
        }}
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture={true}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{ 
          userSelect: 'none', 
          pointerEvents: 'auto',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          display: isVideoBlocked ? 'none' : 'block'
        }}
      />

      {/* Message de succès téléchargement */}
      {showDownloadMessage && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-40">
          <CheckCircle className="w-5 h-5" />
          <span>Film téléchargé avec succès !</span>
        </div>
      )}

      {/* Alerte enregistrement détecté */}
      {isRecordingDetected && !isVideoBlocked && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-8 rounded-lg text-center max-w-md">
            <div className="text-6xl mb-4">🚨</div>
            <h2 className="text-2xl font-bold mb-4">ENREGISTREMENT DÉTECTÉ</h2>
            <p className="mb-4">
              Nous avons détecté une tentative d'enregistrement. La vidéo est temporairement floutée.
            </p>
            <p className="text-sm mb-6">
              Arrêtez l'enregistrement pour continuer à regarder.
            </p>
            <button
              onClick={handleStopRecording}
              className="bg-white text-red-600 px-6 py-2 rounded font-bold hover:bg-gray-100"
            >
              J'ai arrêté l'enregistrement
            </button>
          </div>
        </div>
      )}

      {/* Vidéo bloquée */}
      {isVideoBlocked && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="bg-red-600 text-white p-8 rounded-lg text-center max-w-md">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold mb-4">LECTURE BLOQUÉE</h2>
            <p className="mb-4">
              Plusieurs tentatives d'enregistrement ont été détectées.
            </p>
            <p className="text-sm mb-6">
              La lecture a été interrompue pour protéger le contenu.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleStopRecording}
                className="bg-white text-red-600 px-6 py-2 rounded font-bold hover:bg-gray-100 block w-full"
              >
                Reprendre (j'ai arrêté)
              </button>
              <button
                onClick={handleBackClick}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 block w-full"
              >
                Retour au catalogue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay d'informations du film */}
      {showOverlay && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-500">
          <div className="text-center text-white max-w-2xl px-8">
            <h1 className="text-4xl font-bold mb-4">{watchData.movie.title}</h1>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="bg-yellow-600 text-black px-2 py-1 rounded text-sm font-bold">
                ⭐ {watchData.movie.rating}
              </span>
              <span className="text-gray-300">{new Date(watchData.movie.release_date).getFullYear()}</span>
              <span className="text-gray-300">{watchData.movie.duration} min</span>
            </div>
            <p className="text-lg text-gray-300 mb-6 line-clamp-3">
              {watchData.movie.description}
            </p>
            <div className="flex items-center justify-center gap-2">
              {watchData.movie.genres.map(genre => (
                <span 
                  key={genre.id}
                  className="px-3 py-1 rounded-full text-sm"
                  style={{ backgroundColor: genre.color + '20', color: genre.color }}
                >
                  {genre.icon} {genre.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contrôles du lecteur */}
      <div className={`absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0'
      }`}>
        
        {/* Barre de progression */}
        <div className="px-6 pb-4">
          <div 
            ref={progressRef}
            className="w-full h-2 bg-gray-600 rounded cursor-pointer hover:h-3 transition-all"
            onClick={(e) => {
              if (!videoRef.current || !progressRef.current) return;
              const rect = progressRef.current.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newTime = (clickX / rect.width) * duration;
              videoRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            }}
          >
            <div 
              className="h-full bg-red-600 rounded transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Contrôles principaux */}
        <div className="flex items-center justify-between px-6 pb-6">
          
          {/* Contrôles gauche */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="text-white hover:text-red-400 transition-colors"
            >
              <ArrowLeft className="w-8 h-8" />
            </button>
            
            <button
              onClick={togglePlay}
              className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Contrôles centre */}
          <div className="text-white text-center">
            <h2 className="text-xl font-semibold">{watchData.movie.title}</h2>
            {watchData.continueWatching && (
              <p className="text-sm text-gray-400">Reprise de la lecture</p>
            )}
          </div>

          {/* Contrôles droite */}
          <div className="flex items-center gap-4">
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!videoRef.current) return;
                  videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }}
                className="text-white hover:text-red-400 transition-colors"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  if (!videoRef.current) return;
                  const newVolume = parseFloat(e.target.value);
                  videoRef.current.volume = newVolume;
                  setVolume(newVolume);
                  setIsMuted(newVolume === 0);
                  }}
                className="w-20 accent-red-600"
              />
            </div>

            {/* Bouton téléchargement */}
            <button 
              onClick={handleDownload}
              disabled={downloadStatus.isLoading || downloadStatus.isDownloaded || !downloadStatus.canDownload}
              className={`transition-colors ${
                downloadStatus.isDownloaded 
                  ? 'text-green-400' 
                  : downloadStatus.canDownload 
                    ? 'text-white hover:text-red-400' 
                    : 'text-gray-500 cursor-not-allowed'
              }`}
              title={downloadText}
            >
              {downloadIcon}
            </button>

            {/* Favoris */}
            <button 
              onClick={toggleFavorite}
              className="text-white hover:text-red-400 transition-colors"
            >
              <Heart className={`w-6 h-6 ${watchData.isFavorite ? 'fill-red-600 text-red-600' : ''}`} />
            </button>

            {/* Avancer 10 secondes */}
            <button 
              onClick={skipForward}
              className="text-white hover:text-red-400 transition-colors"
              title="Avancer de 10 secondes"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Plein écran */}
            <button
              onClick={() => {
                if (!containerRef.current) return;
                if (!isFullscreen) {
                  containerRef.current.requestFullscreen();
                } else {
                  document.exitFullscreen();
                }
                setIsFullscreen(!isFullscreen);
              }}
              className="text-white hover:text-red-400 transition-colors"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Tooltip d'erreur téléchargement */}
      {downloadStatus.error && (
        <div className="absolute bottom-32 right-6 bg-red-600 text-white px-4 py-2 rounded-lg max-w-xs">
          <p className="text-sm">{downloadStatus.error}</p>
        </div>
      )}
    </div>
  );
}