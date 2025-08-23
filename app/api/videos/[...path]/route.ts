import { NextRequest } from 'next/server';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = join(process.cwd(), 'public', 'videos', ...path);
  
  try {
    const stat = statSync(filePath);
    const stream = createReadStream(filePath);
    
    return new Response(stream as any, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size.toString(),
      },
    });
  } catch {
    return new Response('Not Found', { status: 404 });
  }
}