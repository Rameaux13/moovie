const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const newMovies = [
  {
    title: "The Foreigner",
    description: "Un homme humble devient une machine à tuer pour venger sa fille dans ce thriller d'action intense.",
    duration: 108,
    genre: "Action",
    release_date: new Date('2003-10-11'),
    thumbnail_url: "https://image.tmdb.org/t/p/w500/fzXbz3Oix7PXPdPLhJ8Jeg1gr8z.jpg",
    video_file_path: "/videos/the-foreigner.mp4",
    views: 0,
    rating: 4.2,
    genres: ["Action", "Thriller"]
  },
  {
    title: "Deadpool & Wolverine",
    description: "Wade Wilson et Logan s'associent dans cette aventure explosive qui bouleverse l'univers Marvel.",
    duration: 127,
    genre: "Action",
    release_date: new Date('2024-07-24'),
    thumbnail_url: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    video_file_path: "/videos/deadpool-wolverine.mp4",
    views: 0,
    rating: 4.6,
    genres: ["Action", "Comédie"]
  },
  {
    title: "Transformers : Le Commencement",
    description: "L'histoire des origines d'Optimus Prime et Megatron sur la planète Cybertron.",
    duration: 104,
    genre: "Science-Fiction",
    release_date: new Date('2024-09-11'),
    thumbnail_url: "https://image.tmdb.org/t/p/w500/qrwI2T844nrBUv3eDwQZRDdgSFs.jpg",
    video_file_path: "/videos/transformers-one.mp4",
    views: 0,
    rating: 4.3,
    genres: ["Science-Fiction", "Animation"]
  },
  {
    title: "Le Comte de Monte-Cristo",
    description: "L'adaptation moderne du classique d'Alexandre Dumas sur la vengeance et la rédemption.",
    duration: 178,
    genre: "Drame",
    release_date: new Date('2024-06-28'),
    thumbnail_url: "https://image.tmdb.org/t/p/w500/zw4kV7npGtaqvUxvJE9IdqdFsNc.jpg",
    video_file_path: "/videos/monte-cristo.mp4",
    views: 0,
    rating: 4.5,
    genres: ["Drame", "Aventure"]
  },
  {
    title: "M3GAN 2.0",
    description: "Le retour de la poupée AI mortelle dans une suite encore plus terrifiante et technologique.",
    duration: 102,
    genre: "Horreur",
    release_date: new Date('2025-01-17'),
    thumbnail_url: "https://image.tmdb.org/t/p/w500/sKSK9JIAmdL6TGHmTiPGtNNVN1d.jpg",
    video_file_path: "/videos/m3gan-2.mp4",
    views: 0,
    rating: 4.1,
    genres: ["Horreur", "Science-Fiction"]
  }
]

async function main() {
  console.log('🎬 Ajout des nouveaux films...')

  for (const movieData of newMovies) {
    const { genres, ...videoData } = movieData

    // Créer le film
    const video = await prisma.video.create({
      data: videoData
    })

    console.log(`✅ Film créé: ${video.title} (ID: ${video.id})`)

    // Associer aux genres
    for (const genreName of genres) {
      const genre = await prisma.genre.findFirst({
        where: { name: genreName }
      })

      if (genre) {
        await prisma.videoGenre.create({
          data: {
            videoId: video.id,
            genreId: genre.id
          }
        })
        console.log(`   🏷️ Genre ajouté: ${genreName}`)
      }
    }
  }

  console.log('🎉 Tous les nouveaux films ont été ajoutés avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })