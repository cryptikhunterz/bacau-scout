'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface ClipData {
  filename: string;
  name: string;
  path: string;
  size: number;
}

interface FrameData {
  filename: string;
  path: string;
  timestamp: string;
}

interface ReportData {
  id: string;
  name: string;
  age: string;
  club: string;
  position: string;
  marketValue: string;
  contract: string;
  agent: string;
  recommendation: string;
  reportMarkdown: string;
  clips: ClipData[];
  frames: FrameData[];
  totalClips: number;
  totalFrames: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function ClipCard({ clip, playerName }: { clip: ClipData; playerName: string }) {
  const [playing, setPlaying] = useState(false);

  // Parse goal info from filename
  const label = clip.name
    .replace(/^goal\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (
    <div className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors">
      {playing ? (
        <video
          src={clip.path}
          controls
          autoPlay
          className="w-full aspect-video bg-black"
          onEnded={() => setPlaying(false)}
        />
      ) : (
        <button
          onClick={() => setPlaying(true)}
          className="w-full aspect-video bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors group relative"
        >
          <div className="w-16 h-16 rounded-full bg-blue-600/80 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="absolute bottom-2 right-2 text-xs text-zinc-400">{formatBytes(clip.size)}</span>
        </button>
      )}
      <div className="p-3">
        <p className="text-sm text-zinc-200 capitalize">{label || clip.name}</p>
      </div>
    </div>
  );
}

function FrameStrip({ frames, clipName }: { frames: FrameData[]; clipName: string }) {
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  // Filter frames for this clip
  const clipBase = clipName.replace('.mp4', '');
  const clipFrames = frames.filter(f => f.filename.startsWith(clipBase));

  if (clipFrames.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 overflow-x-auto pb-2">
        {clipFrames.map(frame => (
          <button
            key={frame.filename}
            onClick={() => setSelectedFrame(selectedFrame === frame.path ? null : frame.path)}
            className={`flex-shrink-0 rounded overflow-hidden border-2 transition-colors ${
              selectedFrame === frame.path ? 'border-blue-500' : 'border-transparent hover:border-zinc-500'
            }`}
          >
            <img
              src={frame.path}
              alt={frame.filename}
              className="h-16 w-auto object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {selectedFrame && (
        <div className="mt-2 rounded-lg overflow-hidden border border-zinc-600 relative">
          <img src={selectedFrame} alt="Frame analysis" className="w-full" />
          {/* Prev / Next navigation */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            {clipFrames.indexOf(clipFrames.find(f => f.path === selectedFrame)!) > 0 && (
              <button
                onClick={() => {
                  const idx = clipFrames.findIndex(f => f.path === selectedFrame);
                  if (idx > 0) setSelectedFrame(clipFrames[idx - 1].path);
                }}
                className="pointer-events-auto bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
              >
                ‹
              </button>
            )}
            <div />
            {clipFrames.indexOf(clipFrames.find(f => f.path === selectedFrame)!) < clipFrames.length - 1 && (
              <button
                onClick={() => {
                  const idx = clipFrames.findIndex(f => f.path === selectedFrame);
                  if (idx < clipFrames.length - 1) setSelectedFrame(clipFrames[idx + 1].path);
                }}
                className="pointer-events-auto bg-black/70 hover:bg-black/90 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors"
              >
                ›
              </button>
            )}
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {clipFrames.findIndex(f => f.path === selectedFrame) + 1} / {clipFrames.length}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerReport({ report }: { report: ReportData }) {
  const [expanded, setExpanded] = useState(false);
  const [showFrames, setShowFrames] = useState(false);
  const [activeTab, setActiveTab] = useState<'clips' | 'report' | 'frames'>('clips');

  const recColor = report.recommendation.includes('SIGN')
    ? 'text-green-400 bg-green-900/30 border-green-700'
    : report.recommendation.includes('OBSERVE')
    ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700'
    : 'text-zinc-400 bg-zinc-800 border-zinc-600';

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="p-5 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl font-bold text-white">{report.name}</h2>
            {report.recommendation && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${recColor}`}>
                {report.recommendation}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-400">
            {report.age && <span>Age: <span className="text-zinc-200">{report.age}</span></span>}
            {report.club && <span>Club: <span className="text-zinc-200">{report.club}</span></span>}
            {report.position && <span>Pos: <span className="text-zinc-200">{report.position}</span></span>}
            {report.marketValue && <span>Value: <span className="text-zinc-200">{report.marketValue}</span></span>}
            {report.contract && <span>Contract: <span className="text-zinc-200">{report.contract}</span></span>}
            {report.agent && <span>Agent: <span className="text-zinc-200">{report.agent}</span></span>}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-zinc-500">
            <span>🎬 {report.totalClips} clips</span>
            <span>📸 {report.totalFrames} frames</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-zinc-700 flex">
        {(['clips', 'frames', 'report'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400 bg-zinc-800/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            {tab === 'clips' ? '🎬 Video Clips' : tab === 'frames' ? '📸 Frame Analysis' : '📄 Full Report'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {activeTab === 'clips' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.clips.map(clip => (
              <div key={clip.filename}>
                <ClipCard clip={clip} playerName={report.name} />
                <FrameStrip frames={report.frames} clipName={clip.filename} />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'frames' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {report.frames.map(frame => (
              <a
                key={frame.filename}
                href={frame.path}
                target="_blank"
                rel="noopener"
                className="rounded overflow-hidden border border-zinc-700 hover:border-zinc-400 transition-colors"
              >
                <img src={frame.path} alt={frame.filename} className="w-full aspect-video object-cover" loading="lazy" />
                <div className="p-1 text-center">
                  <span className="text-[10px] text-zinc-500">{frame.filename.split('_').slice(-1)[0].replace('.jpg', '')}</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-zinc-300 font-sans leading-relaxed bg-zinc-800/50 p-4 rounded-lg">
              {report.reportMarkdown || 'No written report available.'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScoutingReportsPage() {
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  useEffect(() => {
    fetch('/api/scouting-reports')
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load scouting reports:', err);
        setLoading(false);
      });
  }, []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 text-lg">Loading scouting reports...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-white transition-colors">
              ← Dashboard
            </Link>
            <h1 className="text-xl font-bold text-white">🎬 Film Room</h1>
            <span className="text-sm text-zinc-500">{reports.length} player{reports.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/compare" className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg font-medium transition-colors text-sm">
              ⚖️ Compare
            </Link>
            <Link href="/search" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
              + Scout New Player
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {reports.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-zinc-300 mb-2">No video reports yet</h2>
            <p className="text-zinc-500">Wyscout video scouting reports will appear here once generated.</p>
          </div>
        ) : (
          reports.map(report => (
            <PlayerReport key={report.id} report={report} />
          ))
        )}
      </main>
    </div>
  );
}
