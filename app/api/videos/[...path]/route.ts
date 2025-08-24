import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = join(process.cwd(), 'public', 'videos', ...path);
  
  // ✅ NOUVEAU : Vérifier le Referer pour autoriser ton site
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  console.log('🎬 Requête vidéo:', {
    filePath: path.join('/'),
    referer,
    host,
    userAgent: request.headers.get('user-agent')?.slice(0, 50)
  });
  
  // ✅ NOUVEAU : Autoriser les requêtes depuis ton propre site
  const allowedDomains = [
    'moovie1-seven.vercel.app',
    'moovie-omega.vercel.app', 
    'localhost:3000',
    host // Le domaine actuel
  ];
  
  const isAllowed = !referer || allowedDomains.some(domain => 
    referer.includes(domain)
  );
  
  if (!isAllowed) {
    console.log('❌ Accès refusé:', referer);
    return NextResponse.json(
      { error: 'Direct access forbidden - Please use the video player' },
      { status: 403 }
    );
  }

  try {
    console.log('📁 Chemin vidéo complet:', filePath);
    
    const stat = statSync(filePath);
    const stream = createReadStream(filePath);
    
    // ✅ NOUVEAU : Headers optimisés pour le streaming
    return new Response(stream as any, {
      status: 206, // Partial Content pour le streaming
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        // ✅ NOUVEAU : Headers CORS pour autoriser ton site
        'Access-Control-Allow-Origin': `https://${host}`,
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Range, Content-Type',
      },
    });
  } catch (error) {
    console.error('❌ Erreur vidéo:', error);
    return new Response('Video Not Found', { status: 404 });
  }
}