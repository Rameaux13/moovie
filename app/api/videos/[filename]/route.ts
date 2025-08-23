import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // ✅ SÉCURISATION : Vérification authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized - Please login to access videos', { 
        status: 401 
      });
    }

    // 🔒 VÉRIFICATION : Bloquer l'accès direct depuis le navigateur
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent') || '';
    
    // Autoriser seulement si la requête vient de notre lecteur vidéo
    if (!referer || !referer.includes('/watch/')) {
      return new NextResponse('Direct access forbidden - Please use the video player', { 
        status: 403 
      });
    }

    const { filename } = await params;
    const videoPath = path.join(process.cwd(), 'public', 'videos', filename);
    
    if (!fs.existsSync(videoPath)) {
      return new NextResponse('Video not found', { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      return new NextResponse(file as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/mp4',
          // 🔒 PROTECTION ANTI-TÉLÉCHARGEMENT RENFORCÉE
          'Content-Disposition': 'inline; filename=""',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'same-origin',
          'X-Robots-Tag': 'noindex, nofollow',
          'Content-Security-Policy': "default-src 'self'"
        },
      });
    } else {
      const file = fs.createReadStream(videoPath);
      return new NextResponse(file as any, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/mp4',
          // 🔒 PROTECTION ANTI-TÉLÉCHARGEMENT RENFORCÉE
          'Content-Disposition': 'inline; filename=""',
          'Cache-Control': 'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN',
          'Referrer-Policy': 'same-origin',
          'X-Robots-Tag': 'noindex, nofollow',
          'Content-Security-Policy': "default-src 'self'"
        },
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}