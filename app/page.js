'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [films, setFilms] = useState([]);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const url = search
      ? `https://api.themoviedb.org/3/search/movie?api_key=89fac671eaae61da98b82ec96529f862&language=fr-FR&query=${encodeURIComponent(search)}`
      : `https://api.themoviedb.org/3/movie/popular?api_key=89fac671eaae61da98b82ec96529f862&language=fr-FR&page=1`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setFilms(data.results);
        setIsSearching(!!search);
      });
  }, [search]);

  return (
    <main className="container">
      <h1 className="title">Moovie</h1>

      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher un film..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      <h2>{isSearching ? 'Films trouvés' : 'Films populaires'}</h2>

      <div className="films-grid">
        {films && films.length > 0 ? (
          films.map((film) => (
            <Link
              href={`/film/${film.id}`}
              key={film.id}
              className="film-card-link"
            >
              <div className="film-card">
                {film.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${film.poster_path}`}
                    alt={film.title}
                    className="film-poster"
                  />
                ) : (
                  <div className="no-poster">Pas d'affiche</div>
                )}
                <div className="film-info">
                  <strong>{film.title}</strong>
                  <br />
                  Sortie : {film.release_date || 'N/A'}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p>Aucun film trouvé.</p>
        )}
      </div>

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .title {
          color: purple;
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }
        .search-container {
          text-align: center;
          margin-bottom: 30px;
        }
        .search-input {
          padding: 12px 15px;
          width: 100%;
          max-width: 400px;
          font-size: 16px;
          border-radius: 8px;
          border: 1px solid #ccc;
          transition: border-color 0.3s ease;
        }
        .search-input:focus {
          border-color: purple;
          outline: none;
          box-shadow: 0 0 6px rgba(128, 0, 128, 0.5);
        }
        h2 {
          margin-bottom: 15px;
          color: #333;
          font-weight: 600;
        }
        .films-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill,minmax(200px,1fr));
          gap: 20px;
        }
        .film-card-link {
          text-decoration: none;
          color: inherit;
        }
        .film-card {
          border: 1px solid #ccc;
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          transition: box-shadow 0.3s ease;
          background: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .film-card:hover {
          box-shadow: 0 8px 20px rgba(128,0,128,0.4);
        }
        .film-poster {
          width: 100%;
          border-bottom: 1px solid #ddd;
          object-fit: cover;
          aspect-ratio: 2 / 3;
        }
        .no-poster {
          width: 100%;
          height: 300px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: #999;
          font-style: italic;
          background: #eee;
        }
        .film-info {
          padding: 10px;
          text-align: center;
          font-size: 14px;
          color: #333;
          background: #fafafa;
          width: 100%;
        }

        /* Responsive */
        @media (max-width: 600px) {
          .title {
            font-size: 2.2rem;
          }
          .films-grid {
            grid-template-columns: repeat(auto-fill,minmax(140px,1fr));
            gap: 12px;
          }
          .film-info {
            font-size: 12px;
            padding: 8px;
          }
          .no-poster {
            height: 210px;
          }
        }
      `}</style>
    </main>
  );
}
