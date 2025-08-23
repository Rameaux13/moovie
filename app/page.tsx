'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const trendingMovies = [
    { id: 1, title: "Une nature sauvage", rank: 1, poster: "/images/posters/nature-sauvage.jpg" },
    { id: 2, title: "À bout", rank: 2, poster: "/images/posters/a-bout.jpg" },
    { id: 3, title: "To Kill a Monkey", rank: 3, poster: "/images/posters/kill-monkey.jpeg" },
    { id: 4, title: "Squid Game", rank: 4, poster: "/images/posters/squid-game.jpg" },
    { id: 5, title: "Prison Break", rank: 5, poster: "/images/posters/prison-break.jpg" },
    { id: 6, title: "Ginny & Georgia", rank: 6, poster: "/images/posters/ginny-georgia.jpg" },
    { id: 7, title: "The Old Guard 2", rank: 7, poster: "/images/posters/old-guard-2.jpg" },
    { id: 8, title: "KPop Demon Hunters", rank: 8, poster: "/images/posters/kpop-hunters.jpg" },
    { id: 9, title: "Blacklist", rank: 9, poster: "/images/posters/blacklist.jpg" },
    { id: 10, title: "Madea : Mariage exotique", rank: 10, poster: "/images/posters/madea.jpg" },
  ]

  const itemsPerPage = 5
  const totalPages = Math.ceil(trendingMovies.length / itemsPerPage)

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalPages - 1 ? 0 : prevIndex + 1
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1
    )
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Image d'arrière-plan */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/23b75276bb24c41bbbb603ca22e67253.jpg')"
        }}
      ></div>
      
      {/* Overlay sombre pour la lisibilité */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-6 bg-black/30 backdrop-blur-sm">
        <div className="flex items-center">
          <h1 className="text-4xl font-bold text-red-600 tracking-wider">
            NETFLIX
          </h1>
         <select className="ml-6 bg-gray-800 text-white border border-gray-600 px-3 py-2 rounded focus:outline-none focus:border-red-500 hover:bg-gray-700 transition-colors">
  <option value="fr" className="bg-gray-800 text-white"> Français</option>
  <option value="en" className="bg-gray-800 text-white"> English</option>
</select>
        </div>
        <Link 
          href="/login" 
          className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded font-semibold transition-colors"
        >
          Se connecter
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 text-center py-20 px-6">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">
          Films et séries en illimité,<br />et bien plus
        </h2>
        <p className="text-xl mb-8">
          À partir de 3000fcfa . Annulable à tout moment.
        </p>
        
        <div className="max-w-md mx-auto">
          <p className="mb-4 text-lg">
            Prêt à regarder NETFLIX ? Saisissez votre adresse e-mail pour vous abonner.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Adresse e-mail"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-red-600"
            />
            <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-semibold transition-colors">
              Commencer
            </button>
          </div>
        </div>
      </section>

      {/* Tendances actuelles */}
      <section className="relative z-10 py-16 px-6">
        <h3 className="text-3xl font-bold mb-8 text-center">Tendances actuelles</h3>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Bouton Précédent */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Précédent"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Bouton Suivant */}
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            aria-label="Suivant"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Carrousel des films */}
          <div className="overflow-hidden mx-12">
            <div 
              className="flex transition-transform duration-500 ease-in-out gap-4"
              style={{
                transform: `translateX(-${currentIndex * 100}%)`
              }}
            >
              {Array.from({ length: totalPages }).map((_, pageIndex) => (
                <div key={pageIndex} className="flex gap-4 min-w-full">
                  {trendingMovies.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage).map((movie) => (
                    <div key={movie.id} className="flex-1 relative group cursor-pointer">
                      <div className="relative bg-gray-800 aspect-[3/4] rounded-lg overflow-hidden hover:scale-105 transition-transform duration-300">
                        {/* Image de l'affiche */}
                        <img 
                          src={movie.poster} 
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Image de fallback si l'affiche n'existe pas
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        {/* Fallback avec numéro si pas d'image */}
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-6xl font-bold text-red-600">{movie.rank}</span>
                        </div>
                        
                        {/* Overlay avec le rang */}
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center">
                          {movie.rank}
                        </div>
                        
                        {/* Overlay hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="text-center">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 mb-2">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="text-sm font-semibold">Regarder</p>
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-center truncate font-medium">{movie.title}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Indicateurs de page */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index ? 'bg-red-600' : 'bg-gray-400'
                }`}
                aria-label={`Page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="relative z-10 py-16 px-6 bg-black/40 backdrop-blur-sm">
        <h3 className="text-3xl font-bold mb-12 text-center">
          Encore plus de raisons de vous abonner
        </h3>
        
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Regardez NETFLIX sur votre TV</h4>
            <p className="text-gray-400">
              Regardez sur votre Smart TV, PlayStation, Xbox, Chromecast, Apple TV et bien plus.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Téléchargez vos séries</h4>
            <p className="text-gray-400">
              Enregistrez vos programmes et ayez toujours quelque chose à regarder hors connexion.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Où que vous soyez</h4>
            <p className="text-gray-400">
              Regardez des films et séries en accès illimité sur votre TV, smartphone, tablette et ordinateur.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2">Profils pour enfants</h4>
            <p className="text-gray-400">
              Les enfants découvrent de nouvelles aventures dans un espace sûr, inclus dans votre abonnement.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-black/60 backdrop-blur-sm py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <p className="mb-4 text-lg">
              Prêt à regarder NETFLIX ? Saisissez votre adresse e-mail pour vous abonner.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Adresse e-mail"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-red-600"
              />
              <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-semibold transition-colors">
                Commencer
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}