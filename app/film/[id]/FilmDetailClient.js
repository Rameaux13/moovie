'use client';

export default function FilmDetailClient({ film }) {
  return (
    <main className="container">
      <h1 className="title">{film.title}</h1>
      <div className="content">
        {film.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
            alt={film.title}
            className="poster"
          />
        ) : (
          <div className="no-poster">Pas d'affiche disponible</div>
        )}
        <div className="details">
          <p><strong>Date de sortie :</strong> {film.release_date || 'N/A'}</p>
          <p><strong>Note moyenne :</strong> {film.vote_average}/10</p>
          <p><strong>Description :</strong><br /> {film.overview || 'Pas de description'}</p>
        </div>
      </div>

      <style jsx>{`
        .container {
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .title {
          color: purple;
          font-size: 2.8rem;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
        }
        .content {
          display: flex;
          gap: 30px;
          align-items: flex-start;
          flex-wrap: wrap;
          justify-content: center;
        }
        .poster {
          border-radius: 12px;
          max-width: 300px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(128, 0, 128, 0.3);
          object-fit: cover;
          aspect-ratio: 2 / 3;
        }
        .no-poster {
          width: 300px;
          height: 450px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #eee;
          color: #999;
          font-style: italic;
          border-radius: 12px;
        }
        .details {
          max-width: 550px;
          font-size: 1.1rem;
          color: #333;
          line-height: 1.5;
        }
        .details p {
          margin-bottom: 15px;
        }

        /* Responsive */
        @media (max-width: 700px) {
          .content {
            flex-direction: column;
            align-items: center;
          }
          .details {
            max-width: 100%;
            font-size: 1rem;
          }
          .poster, .no-poster {
            max-width: 100%;
            height: auto;
          }
        }
      `}</style>
    </main>
  );
}
