'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ─── Data ────────────────────────────────────────────────────────────────────

interface Target {
  rank: number;
  name: string;
  age: number;
  nationality: string;
  club: string;
  league: string;
  position: string;
  height: string;
  foot: string;
  marketValue: string;
  contract: string;
  apps: number;
  goals: number;
  assists: number;
  minutes: number;
  goalsP90: number;
  xgP90: number;
  sotPct: number;
  touchesBox: number;
  verdict: string;
  verdictColor: string;
  estFee: string;
  estSalary: string;
  euPassport: boolean;
  strengths: string[];
  weaknesses: string[];
  hasVideo: boolean;
  screenshots: string[];
  tmUrl: string;
}

const TARGETS: Target[] = [
  {
    rank: 1,
    name: "Murat Bajraj",
    age: 25,
    nationality: "🇸🇮🇽🇰",
    club: "ND Beltinci",
    league: "Slovenia 2. SNL",
    position: "CF",
    height: "185cm",
    foot: "Left",
    marketValue: "€175k",
    contract: "Unknown",
    apps: 16, goals: 12, assists: 0, minutes: 1037,
    goalsP90: 1.04, xgP90: 0.90, sotPct: 53.1, touchesBox: 5.06,
    verdict: "PRIMARY TARGET",
    verdictColor: "green",
    estFee: "€0-25k",
    estSalary: "€2,500-4,000/mo",
    euPassport: true,
    strengths: ["12 goals in 16 apps", "Left-footed CF", "Hat-trick capability", "EU passport", "Cheapest option"],
    weaknesses: ["Zero assists", "Low league level", "Weak aerial duels"],
    hasVideo: true,
    screenshots: ["bajraj-profile.png", "bajraj-goal1-ilirija.png", "bajraj-goal4-header-jesenice.png", "bajraj-goal9-early-dravinja.png", "bajraj-stats.png"],
    tmUrl: "https://www.transfermarkt.com/murat-bajraj/profil/spieler/977990"
  },
  {
    rank: 2,
    name: "Tim van der Leij",
    age: 19,
    nationality: "🇳🇱",
    club: "RKC Waalwijk",
    league: "Netherlands Eerste Divisie",
    position: "CF",
    height: "N/A",
    foot: "Right",
    marketValue: "€275k",
    contract: "30/06/2028",
    apps: 25, goals: 13, assists: 3, minutes: 1102,
    goalsP90: 1.06, xgP90: 0.71, sotPct: 42.1, touchesBox: 5.63,
    verdict: "HIGHEST CEILING",
    verdictColor: "blue",
    estFee: "€150-300k",
    estSalary: "€4,000-6,000/mo",
    euPassport: true,
    strengths: ["13 goals + 3 assists", "Only 19 years old", "Dutch 2nd division level", "PSV academy pedigree", "Resale value"],
    weaknesses: ["Most expensive option", "Contract until 2028", "Agent involved"],
    hasVideo: false,
    screenshots: [],
    tmUrl: "https://www.transfermarkt.com/tim-van-der-leij/profil/spieler/1030528"
  },
  {
    rank: 3,
    name: "El Hadji Ndiaye",
    age: 26,
    nationality: "🇸🇳",
    club: "Opava (loan from Zlín)",
    league: "Czech 2. Liga",
    position: "CF/RW/SS",
    height: "190cm",
    foot: "Right",
    marketValue: "€200k",
    contract: "31/12/2026 (Zlín)",
    apps: 11, goals: 5, assists: 1, minutes: 874,
    goalsP90: 0.51, xgP90: 0.83, sotPct: 44.1, touchesBox: 6.48,
    verdict: "STRONG OPTION",
    verdictColor: "orange",
    estFee: "€50-100k",
    estSalary: "€3,000-5,000/mo",
    euPassport: false,
    strengths: ["190cm physical presence", "Hat-trick capability", "Versatile positions", "Czech 2nd div proven", "Contract expiring"],
    weaknesses: ["Non-EU passport", "Complicated loan structure", "Red card history", "Age 26 no resale"],
    hasVideo: false,
    screenshots: [],
    tmUrl: "https://www.transfermarkt.com/el-hadji-ndiaye/profil/spieler/211485"
  },
  {
    rank: 4,
    name: "Gašper Černe",
    age: 21,
    nationality: "🇸🇮",
    club: "NK Brinje Grosuplje",
    league: "Slovenia 2. SNL",
    position: "CF",
    height: "N/A",
    foot: "N/A",
    marketValue: "€150k",
    contract: "Unknown",
    apps: 14, goals: 5, assists: 3, minutes: 697,
    goalsP90: 0.65, xgP90: 0.73, sotPct: 60.9, touchesBox: 4.63,
    verdict: "BACKUP OPTION",
    verdictColor: "yellow",
    estFee: "€0-20k",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    strengths: ["Best shot accuracy (61%)", "Good G+A/90 ratio", "Young (21)", "EU passport", "Cheap"],
    weaknesses: ["Can't hold starting spot", "Only 47 min/game avg", "Dropped from 1. SNL club", "Low sample size"],
    hasVideo: false,
    screenshots: [],
    tmUrl: "https://www.transfermarkt.com/gasper-cerne/profil/spieler/722379"
  },
  {
    rank: 5,
    name: "Muhammed Suso",
    age: 20,
    nationality: "🇬🇲",
    club: "FK Pardubice",
    league: "Czech 1. Liga",
    position: "LW (NOT CF)",
    height: "N/A",
    foot: "Left",
    marketValue: "€150k",
    contract: "Unknown",
    apps: 9, goals: 0, assists: 2, minutes: 517,
    goalsP90: 0.00, xgP90: 0.55, sotPct: 47.5, touchesBox: 7.50,
    verdict: "NOT RECOMMENDED",
    verdictColor: "red",
    estFee: "N/A",
    estSalary: "N/A",
    euPassport: false,
    strengths: ["Good dribbling stats", "Young age"],
    weaknesses: ["ZERO goals", "Actually a left winger", "Can't break into first team", "Playing reserve football", "Non-EU"],
    hasVideo: false,
    screenshots: [],
    tmUrl: "https://www.transfermarkt.com/muhammed-suso/profil/spieler/1279570"
  }
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<string, string> = {
  green: 'bg-green-600 text-white',
  blue: 'bg-blue-600 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-black',
  red: 'bg-red-600 text-white',
};

const RANK_BORDER: Record<number, string> = {
  1: 'border-green-500',
  2: 'border-blue-500',
  3: 'border-orange-500',
  4: 'border-yellow-500',
  5: 'border-red-500',
};

const RANK_BG: Record<number, string> = {
  1: 'bg-green-500/10',
  2: 'bg-blue-500/10',
  3: 'bg-orange-500/10',
  4: 'bg-yellow-500/10',
  5: 'bg-red-500/10',
};

const RANK_NUM: Record<number, string> = {
  1: 'text-green-400',
  2: 'text-blue-400',
  3: 'text-orange-400',
  4: 'text-yellow-400',
  5: 'text-red-400',
};

function StatCell({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-lg font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</div>
      <div className="text-[10px] uppercase text-zinc-500 tracking-wider">{label}</div>
    </div>
  );
}

// ─── Screenshot Gallery ──────────────────────────────────────────────────────

function ScreenshotGallery({ screenshots }: { screenshots: string[] }) {
  const [selected, setSelected] = useState<number | null>(null);

  if (screenshots.length === 0) return null;

  const captions: Record<string, string> = {
    'bajraj-profile.png': 'Wyscout Profile',
    'bajraj-goal1-ilirija.png': 'Goal vs Ilirija',
    'bajraj-goal4-header-jesenice.png': 'Header Goal vs Jesenice',
    'bajraj-goal9-early-dravinja.png': 'Early Goal vs Dravinja',
    'bajraj-stats.png': 'Season Statistics',
  };

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold text-zinc-300 mb-3">📸 Wyscout Screenshots</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {screenshots.map((file, i) => (
          <button
            key={file}
            onClick={() => setSelected(selected === i ? null : i)}
            className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
              selected === i ? 'border-green-400 ring-2 ring-green-400/30' : 'border-zinc-700 hover:border-zinc-500'
            }`}
          >
            <Image
              src={`/targets/${file}`} unoptimized
              alt={captions[file] || file}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
            />
            <div className="absolute bottom-0 inset-x-0 bg-black/70 px-1 py-0.5">
              <span className="text-[10px] text-zinc-300">{captions[file] || file}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected !== null && (
        <div className="mt-3 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <Image
              src={`/targets/${screenshots[selected]}`} unoptimized
              alt={captions[screenshots[selected]] || screenshots[selected]}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <div className="px-3 py-2 bg-zinc-900 text-center">
            <span className="text-sm text-zinc-300">{captions[screenshots[selected]] || screenshots[selected]}</span>
            <button onClick={() => setSelected(null)} className="ml-4 text-xs text-zinc-500 hover:text-white">✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Player Card ─────────────────────────────────────────────────────────────

function PlayerCard({ target }: { target: Target }) {
  const [expanded, setExpanded] = useState(false);
  const isNotRecommended = target.verdictColor === 'red';

  return (
    <div
      className={`rounded-xl border-l-4 ${RANK_BORDER[target.rank]} ${RANK_BG[target.rank]} bg-zinc-800/80 overflow-hidden transition-all`}
    >
      {/* Compact header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-4 sm:px-6 hover:bg-zinc-700/30 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Rank + name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`text-2xl font-black ${RANK_NUM[target.rank]} tabular-nums`}>
              #{target.rank}
            </span>
            <div className="min-w-0">
              <h3 className={`text-lg font-bold text-white truncate ${isNotRecommended ? 'line-through opacity-60' : ''}`}>
                {target.nationality} {target.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {target.age}y · {target.position} · {target.club} · {target.league}
              </p>
            </div>
          </div>

          {/* Key stats row */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <StatCell label="G/90" value={target.goalsP90.toFixed(2)} highlight={target.goalsP90 >= 1.0} />
            <StatCell label="xG/90" value={target.xgP90.toFixed(2)} />
            <StatCell label="SoT%" value={`${target.sotPct}%`} highlight={target.sotPct >= 50} />
            <StatCell label="Tch/Box" value={target.touchesBox.toFixed(1)} />

            {/* Verdict badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${VERDICT_STYLES[target.verdictColor]}`}>
              {target.verdict}
            </span>

            {/* Expand chevron */}
            <svg
              className={`w-5 h-5 text-zinc-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-zinc-700/50 px-4 py-4 sm:px-6 space-y-4">
          {/* Top row: bio + financials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bio */}
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Profile</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Height</span><span className="text-white">{target.height}</span>
                <span className="text-zinc-500">Foot</span><span className="text-white">{target.foot}</span>
                <span className="text-zinc-500">Market Value</span><span className="text-white">{target.marketValue}</span>
                <span className="text-zinc-500">Contract</span><span className="text-white">{target.contract}</span>
                <span className="text-zinc-500">EU Passport</span>
                <span className={target.euPassport ? 'text-green-400' : 'text-red-400'}>
                  {target.euPassport ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>

            {/* Season stats */}
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Season Stats</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Appearances</span><span className="text-white">{target.apps}</span>
                <span className="text-zinc-500">Goals</span><span className="text-white font-bold">{target.goals}</span>
                <span className="text-zinc-500">Assists</span><span className="text-white">{target.assists}</span>
                <span className="text-zinc-500">Minutes</span><span className="text-white">{target.minutes}</span>
                <span className="text-zinc-500">Min/Goal</span>
                <span className="text-white">{target.goals > 0 ? Math.round(target.minutes / target.goals) : '∞'}</span>
              </div>
            </div>

            {/* Financials */}
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Financial Estimate</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Transfer Fee</span><span className="text-white font-bold">{target.estFee}</span>
                <span className="text-zinc-500">Salary</span><span className="text-white">{target.estSalary}</span>
              </div>
              <a
                href={target.tmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
              >
                Transfermarkt ↗
              </a>
            </div>
          </div>

          {/* Strengths & weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-green-500 uppercase mb-2">✅ Strengths</h4>
              <ul className="space-y-1">
                {target.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">+</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-red-500 uppercase mb-2">⚠️ Weaknesses</h4>
              <ul className="space-y-1">
                {target.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">−</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Video badge */}
          {target.hasVideo && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <span>🎬</span> Wyscout video clips available in Film Room
            </div>
          )}

          {/* Screenshots gallery (Bajraj) */}
          {target.screenshots.length > 0 && (
            <ScreenshotGallery screenshots={target.screenshots} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Comparison Table ────────────────────────────────────────────────────────

function ComparisonTable() {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">📊 Quick Comparison</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50 text-zinc-400 text-xs uppercase">
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-center">Age</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-center">Apps</th>
              <th className="px-3 py-2 text-center">Goals</th>
              <th className="px-3 py-2 text-center">G/90</th>
              <th className="px-3 py-2 text-center">xG/90</th>
              <th className="px-3 py-2 text-center">SoT%</th>
              <th className="px-3 py-2 text-center">EU</th>
              <th className="px-3 py-2 text-right">Value</th>
              <th className="px-3 py-2 text-right">Est. Fee</th>
              <th className="px-3 py-2 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {TARGETS.map((t) => {
              const isNotRec = t.verdictColor === 'red';
              return (
                <tr key={t.rank} className={`hover:bg-zinc-700/20 ${isNotRec ? 'opacity-50' : ''}`}>
                  <td className={`px-3 py-2 font-bold ${RANK_NUM[t.rank]}`}>{t.rank}</td>
                  <td className={`px-3 py-2 font-medium text-white whitespace-nowrap ${isNotRec ? 'line-through' : ''}`}>
                    {t.nationality} {t.name}
                  </td>
                  <td className="px-3 py-2 text-center text-zinc-300">{t.age}</td>
                  <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{t.club}</td>
                  <td className="px-3 py-2 text-center text-zinc-300">{t.apps}</td>
                  <td className="px-3 py-2 text-center text-white font-bold">{t.goals}</td>
                  <td className={`px-3 py-2 text-center font-mono ${t.goalsP90 >= 1.0 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                    {t.goalsP90.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-zinc-300">{t.xgP90.toFixed(2)}</td>
                  <td className={`px-3 py-2 text-center font-mono ${t.sotPct >= 50 ? 'text-green-400' : 'text-zinc-300'}`}>
                    {t.sotPct}%
                  </td>
                  <td className="px-3 py-2 text-center">{t.euPassport ? '✅' : '❌'}</td>
                  <td className="px-3 py-2 text-right text-zinc-300 whitespace-nowrap">{t.marketValue}</td>
                  <td className="px-3 py-2 text-right text-zinc-300 whitespace-nowrap">{t.estFee}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${VERDICT_STYLES[t.verdictColor]}`}>
                      {t.verdict}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TargetsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-5 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">🎯 Transfer Targets — Striker Shortlist</h1>
              <p className="text-sm text-zinc-500 mt-1">February 2026 | FC Bacău Scouting Department</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                📋 Dashboard
              </Link>
              <Link href="/compare"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                ⚖️ Compare
              </Link>
              <Link href="/teams"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                📊 Teams
              </Link>
              <Link href="/scouting-reports"
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700">
                🎬 Film Room
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 space-y-6">
        {/* Summary table */}
        <ComparisonTable />

        {/* Player cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
            Detailed Player Cards — Click to Expand
          </h2>
          {TARGETS.map((target) => (
            <PlayerCard key={target.rank} target={target} />
          ))}
        </div>

        {/* Footer notes */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500 space-y-1">
          <p><strong className="text-zinc-400">Methodology:</strong> All per-90 stats calculated from Wyscout data. xG from Wyscout model. Market values from Transfermarkt.</p>
          <p><strong className="text-zinc-400">Recommendation:</strong> Pursue Bajraj immediately (€0-25k, EU passport, 1.04 G/90). Monitor Van der Leij as aspirational target. Ndiaye as Plan B if non-EU slot available.</p>
          <p><strong className="text-zinc-400">Budget context:</strong> FC Bacău estimated transfer budget: €50-150k total. Salary budget for new striker: €3,000-5,000/mo.</p>
        </div>
      </main>
    </div>
  );
}
