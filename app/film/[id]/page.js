import FilmDetailClient from './FilmDetailClient';

async function getFilm(id) {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=89fac671eaae61da98b82ec96529f862&language=fr-FR`);
  return res.json();
}

export default async function Page({ params }) {
  const film = await getFilm(params.id);

  return <FilmDetailClient film={film} />;
}
