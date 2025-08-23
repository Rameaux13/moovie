'use client'

import { useEffect, useState } from 'react'

interface Genre {
  id: string
  name: string
  color: string
}

interface Movie {
  id: number
  title: string
  description: string
  duration: number
  rating: number
  views: number
  release_date: string
  thumbnail_url: string
  video_file_path: string
  genres: Genre[]
}

export default function MoviesAdmin() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddMovieModal, setShowAddMovieModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)
  const [movieTitle, setMovieTitle] = useState('')
  const [movieDescription, setMovieDescription] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchMovies()
  }, [])

  const showMessage = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 3000)
  }

  const fetchMovies = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/movies')
      
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des films')
      }
      
      const result = await response.json()
      setMovies(result.data)
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur récupération films:', error)
      setLoading(false)
    }
  }

  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        showMessage('Film ajouté avec succès!')
        setMovieTitle('')
        setMovieDescription('')
        setShowAddMovieModal(false)
        fetchMovies()
      } else {
        showMessage('Erreur lors de l\'ajout du film')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de l\'ajout du film')
    }
  }

  const handleEditMovie = (movie: Movie) => {
    setSelectedMovie(movie)
    setMovieTitle(movie.title)
    setMovieDescription(movie.description)
    setShowEditModal(true)
  }

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMovie || !movieTitle.trim() || !movieDescription.trim()) {
      showMessage('Veuillez remplir tous les champs')
      return
    }
    
    try {
      const response = await fetch(`/api/admin/movies/${selectedMovie.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: movieTitle.trim(),
          description: movieDescription.trim()
        })
      })
      
      if (response.ok) {
        showMessage('Film modifié avec succès!')
        setMovieTitle('')
        setMovieDescription('')
        setShowEditModal(false)
        setSelectedMovie(null)
        fetchMovies()
      } else {
        showMessage('Erreur lors de la modification du film')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showMessage('Erreur lors de la modification du film')
    }
  }

 const handleDeleteMovie = async (movie: Movie) => {
  try {
    const response = await fetch(`/api/admin/movies/${movie.id}`, {
      method: 'DELETE'
    })
    
    if (response.ok) {
      showMessage('Film supprimé avec succès!')
      fetchMovies()
    } else {
      showMessage('Erreur lors de la suppression du film')
    }
  } catch (error) {
    console.error('Erreur:', error)
    showMessage('Erreur lors de la suppression du film')
  }
}

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-white text-lg">Chargement des films...</div>
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
          <h1 className="text-3xl font-bold text-white">Gestion des Films</h1>
          <p className="text-gray-400 mt-2">Gérez votre catalogue de {movies.length} films</p>
        </div>
        <button 
          onClick={() => setShowAddMovieModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          + Ajouter un Film
        </button>
      </div>

      {/* Tableau des films */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-white font-semibold">Titre</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Genres</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Durée</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Vues</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Note</th>
                <th className="px-6 py-4 text-left text-white font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-gray-800 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={movie.thumbnail_url} 
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div>
                        <div className="text-white font-medium">{movie.title}</div>
                        <div className="text-gray-400 text-sm truncate max-w-xs">
                          {movie.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {movie.genres.map((genre) => (
                        <span 
                          key={genre.id}
                          className="px-2 py-1 rounded-full text-xs text-white"
                          style={{ backgroundColor: genre.color }}
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{movie.duration} min</td>
                  <td className="px-6 py-4 text-gray-300">{movie.views.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-300 ml-1">{movie.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditMovie(movie)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => handleDeleteMovie(movie)}
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

      {/* Modal Modifier Film */}
      {showEditModal && selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Modifier le Film</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleUpdateMovie} className="space-y-4">
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
    </div>
  )
}