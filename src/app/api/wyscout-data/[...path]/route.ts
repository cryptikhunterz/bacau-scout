import { NextRequest, NextResponse } from 'next/server';
import { readFile, access, readdir } from 'fs/promises';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const filePath = segments.join('/');
  
  // Debug endpoint
  if (filePath === 'debug.json') {
    const cwd = process.cwd();
    const checks: Record<string, string> = { cwd };
    for (const base of [
      path.join(cwd, 'public', 'data'),
      path.join(cwd, 'data'),
      path.join(cwd, '.next', 'static', 'data'),
      '/app/public/data',
      '/app/data',
    ]) {
      try {
        await access(base);
        const files = await readdir(base);
        checks[base] = files.slice(0, 10).join(', ');
      } catch {
        checks[base] = 'NOT FOUND';
      }
    }
    return NextResponse.json(checks);
  }
  
  // Security: only allow .json files, no traversal
  if (!filePath.endsWith('.json') || filePath.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  
  // Try multiple possible locations
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'public', 'data', filePath),
    path.join(cwd, 'data', filePath),
    path.join('/app', 'public', 'data', filePath),
    path.join('/app', 'data', filePath),
  ];
  
  for (const fullPath of candidates) {
    try {
      const data = await readFile(fullPath, 'utf-8');
      return new NextResponse(data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch {
      continue;
    }
  }
  
  return NextResponse.json({ error: 'Not found', tried: candidates }, { status: 404 });
}
