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
    // Deep scan for any data directory
    const { execSync } = require('child_process');
    try {
      const found = execSync('find /app -name "leagues.json" -maxdepth 5 2>/dev/null || find / -name "leagues.json" -maxdepth 5 2>/dev/null | head -10', { encoding: 'utf-8', timeout: 5000 });
      checks['find_leagues'] = found.trim() || 'NONE';
    } catch (e: any) {
      checks['find_leagues'] = e.stdout?.trim() || 'ERROR';
    }
    try {
      const ls = execSync('ls -la /app/ 2>/dev/null', { encoding: 'utf-8', timeout: 3000 });
      checks['ls_app'] = ls.trim();
    } catch {
      checks['ls_app'] = 'ERROR';
    }
    try {
      const ls2 = execSync('ls -la /app/public/ 2>/dev/null || echo NO_PUBLIC', { encoding: 'utf-8', timeout: 3000 });
      checks['ls_app_public'] = ls2.trim();
    } catch {
      checks['ls_app_public'] = 'ERROR';
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
