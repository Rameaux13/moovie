const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVideos() {
  const videos = await prisma.videos.findMany({
    select: {
      id: true,
      title: true,
      video_file_path: true
    }
  });
  
  console.log('FILMS DANS LA BASE :');
  videos.forEach(video => {
    console.log(`ID: ${video.id} | Titre: ${video.title} | Fichier: ${video.video_file_path}`);
  });
  
  await prisma.$disconnect();
}

checkVideos();