import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Reads scouting report data from wyscout-clips directory
export async function GET() {
  try {
    const clipsDir = path.join(process.cwd(), 'wyscout-clips');
    
    if (!fs.existsSync(clipsDir)) {
      return NextResponse.json({ reports: [] });
    }

    const playerDirs = fs.readdirSync(clipsDir).filter(d => {
      const fullPath = path.join(clipsDir, d);
      return fs.statSync(fullPath).isDirectory();
    });

    const reports = playerDirs.map(playerDir => {
      const playerPath = path.join(clipsDir, playerDir);
      const reportPath = path.join(playerPath, 'SCOUTING_REPORT.md');
      const framesDir = path.join(playerPath, 'frames');

      // Read report markdown if exists
      let reportMarkdown = '';
      if (fs.existsSync(reportPath)) {
        reportMarkdown = fs.readFileSync(reportPath, 'utf-8');
      }

      // List video clips
      const clips = fs.readdirSync(playerPath)
        .filter(f => f.endsWith('.mp4'))
        .sort()
        .map(f => ({
          filename: f,
          name: f.replace('.mp4', '').replace(/_/g, ' '),
          path: `/api/scouting-reports/clip?player=${playerDir}&file=${f}`,
          size: fs.statSync(path.join(playerPath, f)).size,
        }));

      // List frame images
      let frames: { filename: string; path: string; timestamp: string }[] = [];
      if (fs.existsSync(framesDir)) {
        frames = fs.readdirSync(framesDir)
          .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
          .sort()
          .map(f => ({
            filename: f,
            path: `/api/scouting-reports/frame?player=${playerDir}&file=${f}`,
            timestamp: f.match(/_(\d{6})\./)?.[1] || '',
          }));
      }

      // Parse key info from report
      const nameMatch = reportMarkdown.match(/# .+ SCOUTING REPORT: (.+)/);
      const ageMatch = reportMarkdown.match(/\*\*Age:\*\* (\d+)/);
      const clubMatch = reportMarkdown.match(/\*\*Club:\*\* (.+)/);
      const posMatch = reportMarkdown.match(/\*\*Position:\*\* (.+)/);
      const valueMatch = reportMarkdown.match(/\*\*Market Value:\*\* (.+)/);
      const contractMatch = reportMarkdown.match(/\*\*Contract:\*\* (.+)/);
      const agentMatch = reportMarkdown.match(/\*\*Agent:\*\* (.+)/);
      const recMatch = reportMarkdown.match(/\*\*RECOMMENDATION: (.+)\*\*/);

      return {
        id: playerDir,
        name: nameMatch?.[1] || playerDir.charAt(0).toUpperCase() + playerDir.slice(1),
        age: ageMatch?.[1] || '',
        club: clubMatch?.[1] || '',
        position: posMatch?.[1] || '',
        marketValue: valueMatch?.[1] || '',
        contract: contractMatch?.[1] || '',
        agent: agentMatch?.[1] || '',
        recommendation: recMatch?.[1] || '',
        reportMarkdown,
        clips,
        frames,
        totalClips: clips.length,
        totalFrames: frames.length,
      };
    });

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error reading scouting reports:', error);
    return NextResponse.json({ reports: [], error: 'Failed to read reports' }, { status: 500 });
  }
}
