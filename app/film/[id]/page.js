import Image from 'next/image';

async function getFilm(id) {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=89fac671eaae61da98b82ec96529f862&language=fr-FR`
  );
  return res.json();
}

export default async function Page({ params }) {
  const film = await getFilm(params.id);

  return (
    <main style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ fontSize: '2rem', color: 'purple' }}>{film.title}</h1>
      <Image
        src={`https://image.tmdb.org/t/p/w500${film.poster_path}`}
        alt={film.title}
        width={500}
        height={750}
        style={{ maxWidth: '100%', borderRadius: 10 }}
      />
      <p><strong>Date de sortie :</strong> {film.release_date}</p>
      <p><strong>Note moyenne :</strong> {film.vote_average}/10</p>
      <p><strong>Description :</strong> {film.overview}</p>
    </main>
  );
}
