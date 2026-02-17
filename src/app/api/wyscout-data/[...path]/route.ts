import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = segments.join('/');
  
  // Security: only allow .json files, no traversal
  if (!filePath.endsWith('.json') || filePath.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  try {
    const fullPath = path.join(process.cwd(), 'public', 'data', filePath);
    const data = await readFile(fullPath, 'utf-8');
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
