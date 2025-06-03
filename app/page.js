'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: 'purple', fontSize: '2.5rem', marginBottom: 20 }}>
        🎬 Moovie
      </h1>

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Rechercher un film..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: 10,
            width: '100%',
            maxWidth: 400,
            fontSize: 16,
            borderRadius: 8,
            border: '1px solid #ccc'
          }}
        />
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: 10 }}>
        {isSearching ? 'Résultats de recherche' : 'Films populaires'}
      </h2>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          justifyContent: 'center'
        }}
      >
        {films.map((film) => (
          <Link
            href={`/film/${film.id}`}
            key={film.id}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div
              style={{
                width: 200,
                border: '1px solid #ccc',
                borderRadius: 10,
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                backgroundColor: '#fff',
                transition: 'transform 0.2s',
              }}
            >
              <Image
                src={`https://image.tmdb.org/t/p/w300${film.poster_path}`}
                alt={film.title}
                width={300}
                height={450}
                style={{ width: '100%', height: 'auto' }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: 10,
                  fontSize: 14,
                }}
              >
                <strong>{film.title}</strong>
                <br />
                Sortie : {film.release_date}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
