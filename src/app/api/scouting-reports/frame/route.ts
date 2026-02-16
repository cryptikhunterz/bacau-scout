import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const player = searchParams.get('player');
  const file = searchParams.get('file');

  if (!player || !file) {
    return NextResponse.json({ error: 'Missing player or file param' }, { status: 400 });
  }

  // Sanitize inputs
  const safePl = player.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeFl = file.replace(/[^a-zA-Z0-9_.-]/g, '');

  const filePath = path.join(process.cwd(), 'wyscout-clips', safePl, 'frames', safeFl);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Frame not found' }, { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
