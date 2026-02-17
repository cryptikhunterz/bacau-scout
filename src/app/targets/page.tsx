'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  POTENTIAL_LABELS,
  VERDICT_OPTIONS,
  ATTRIBUTE_CATEGORIES,
  getPotentialColor,
  getAbilityColor,
} from '@/lib/grades';
import type { Verdict } from '@/lib/grades';

// ─── Data ────────────────────────────────────────────────────────────────────

interface TargetPlayer {
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
  // Wyscout metrics
  apps: number;
  goals: number;
  assists: number;
  minutes: number;
  goalsP90: number;
  xgP90: number;
  sotPct: number;
  touchesBox: number;
  dribblesP90: number;
  progRuns: number;
  // Scout evaluation
  physical: { strength: number; speed: number; agility: number; coordination: number };
  technique: {
    control: number; shortPasses: number; longPasses: number; aerial: number;
    crossing: number; finishing: number; dribbling: number; oneVsOneOff: number; oneVsOneDef: number;
  };
  tactic: {
    positioning: number; transition: number; decisions: number;
    anticipations: number; duels: number; setPieces: number;
  };
  ability: number;
  potential: number;
  scoutingTags: string[];
  verdict: Verdict;
  role: string;
  conclusion: string;
  notes: string;
  screenshots: string[];
  hasVideo: boolean;
  estFee: string;
  estSalary: string;
  euPassport: boolean;
  tmUrl: string;
}

const TARGETS_DATA: TargetPlayer[] = [
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
    goalsP90: 1.04, xgP90: 0.90, sotPct: 53.1, touchesBox: 5.06, dribblesP90: 2.32, progRuns: 1.5,
    physical: { strength: 3, speed: 4, agility: 4, coordination: 3 },
    technique: { control: 3, shortPasses: 2, longPasses: 2, aerial: 2, crossing: 2, finishing: 5, dribbling: 3, oneVsOneOff: 3, oneVsOneDef: 2 },
    tactic: { positioning: 4, transition: 4, decisions: 3, anticipations: 4, duels: 3, setPieces: 2 },
    ability: 4,
    potential: 5,
    scoutingTags: ["Chance conversion", "Runs in behind", "Acceleration"],
    verdict: "Sign",
    role: "Centre-Forward / Poacher",
    conclusion: "Elite goals-per-90 for his level. Left-footed CF with excellent movement and finishing. Cheapest option with EU passport. Zero assists is a concern — this is a pure goalscorer, not a link-up forward. Low league level needs accounting for but output is undeniable.",
    notes: "12 goals in 16 apps including hat-trick vs Jesenice. Left foot dominant. Weak aerial presence for a CF. Would need adjustment period moving from Slovenia 2. SNL to Romania Liga 2.",
    screenshots: ["bajraj-profile.png", "bajraj-goal1-ilirija.png", "bajraj-goal4-header-jesenice.png", "bajraj-goal9-early-dravinja.png", "bajraj-stats.png"],
    hasVideo: true,
    estFee: "€0-25k",
    estSalary: "€2,500-4,000/mo",
    euPassport: true,
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
    goalsP90: 1.06, xgP90: 0.71, sotPct: 42.1, touchesBox: 5.63, dribblesP90: 2.44, progRuns: 1.8,
    physical: { strength: 3, speed: 4, agility: 4, coordination: 4 },
    technique: { control: 4, shortPasses: 3, longPasses: 2, aerial: 3, crossing: 2, finishing: 4, dribbling: 3, oneVsOneOff: 3, oneVsOneDef: 2 },
    tactic: { positioning: 5, transition: 4, decisions: 3, anticipations: 4, duels: 3, setPieces: 2 },
    ability: 4,
    potential: 7,
    scoutingTags: ["Runs in behind", "Game intelligence", "Finishing"],
    verdict: "Monitor",
    role: "Centre-Forward / Inside Forward",
    conclusion: "Highest ceiling on the list. 19-year-old outscoring xG in the Dutch second division — the best league quality on our shortlist. PSV academy pedigree. Contract until 2028 makes him expensive but resale value is significant. Needs film review to confirm movement quality.",
    notes: "13 goals + 3 assists at 19 in Eerste Divisie. Former PSV and Vitesse academy. RKC will demand a proper fee (€150-300k). Loan-to-buy structure would be ideal. Agent involved — expect negotiation.",
    screenshots: [],
    hasVideo: false,
    estFee: "€150-300k",
    estSalary: "€4,000-6,000/mo",
    euPassport: true,
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
    goalsP90: 0.51, xgP90: 0.83, sotPct: 44.1, touchesBox: 6.48, dribblesP90: 2.46, progRuns: 1.2,
    physical: { strength: 5, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 2, aerial: 4, crossing: 2, finishing: 3, dribbling: 3, oneVsOneOff: 3, oneVsOneDef: 2 },
    tactic: { positioning: 4, transition: 3, decisions: 3, anticipations: 3, duels: 4, setPieces: 3 },
    ability: 4,
    potential: 5,
    scoutingTags: ["Height / body build", "Hold-up play", "Aerial duels"],
    verdict: "Monitor",
    role: "Target Man / Hold-Up Forward",
    conclusion: "Best physical profile on the shortlist. 190cm with proven output in Czech 2nd division (stronger than Slovenia 2. SNL). Hat-trick capability confirmed. Versatile across CF/RW/SS. Non-EU passport and complicated loan structure (Zlín parent club) are main obstacles. Discipline concern — red card on record.",
    notes: "5 goals + 1 assist in 9 starts. Hat-trick vs Ústí nad Labem. On loan from FC Zlín, parent contract expires 31/12/2026. Senegalese passport — check non-EU slot availability. Agent: Daniel Chrysostome.",
    screenshots: [],
    hasVideo: false,
    estFee: "€50-100k",
    estSalary: "€3,000-5,000/mo",
    euPassport: false,
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
    goalsP90: 0.65, xgP90: 0.73, sotPct: 60.9, touchesBox: 4.63, dribblesP90: 2.32, progRuns: 1.3,
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 2, aerial: 3, crossing: 2, finishing: 4, dribbling: 3, oneVsOneOff: 3, oneVsOneDef: 2 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 3, duels: 3, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Chance conversion", "Finishing", "Competitive mentality"],
    verdict: "Monitor",
    role: "Impact Substitute / Poacher",
    conclusion: "Highest shot accuracy on the list (61%) but can't hold a starting spot — averages only 47 min/game. Previously dropped from NK Domžale (1. SNL). Good G+A/90 ratio suggests clinical instincts. Best as a backup option if primary targets fall through. EU passport is a plus.",
    notes: "5 goals + 3 assists in 697 minutes. Was at NK Domžale before dropping to 2. SNL. Low sample size — monitor through spring before committing.",
    screenshots: [],
    hasVideo: false,
    estFee: "€0-20k",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
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
    goalsP90: 0.00, xgP90: 0.55, sotPct: 47.5, touchesBox: 7.50, dribblesP90: 7.12, progRuns: 3.2,
    physical: { strength: 2, speed: 4, agility: 4, coordination: 3 },
    technique: { control: 4, shortPasses: 3, longPasses: 2, aerial: 2, crossing: 3, finishing: 1, dribbling: 5, oneVsOneOff: 4, oneVsOneDef: 1 },
    tactic: { positioning: 2, transition: 3, decisions: 2, anticipations: 2, duels: 2, setPieces: 1 },
    ability: 2,
    potential: 3,
    scoutingTags: ["Dribbling", "Acceleration", "Technique under pressure"],
    verdict: "Discard",
    role: "Left Winger (NOT a striker)",
    conclusion: "Wrong position — this is a left winger, not a centre-forward. Zero goals in 9 appearances. Can't break into Pardubice first team. Playing Czech 3rd tier reserve football. Good dribbling stats but no end product. Non-EU passport adds another obstacle. Remove from striker shortlist.",
    notes: "Misidentified as FW in data — actually plays LW. 0 goals is disqualifying for a striker search. Gambian passport requires work permit.",
    screenshots: [],
    hasVideo: false,
    estFee: "N/A",
    estSalary: "N/A",
    euPassport: false,
    tmUrl: "https://www.transfermarkt.com/muhammed-suso/profil/spieler/1279570"
  }
];

// ─── Attribute mapping from target data to grades.ts keys ────────────────────

function getAttributeValue(target: TargetPlayer, key: string): number {
  const map: Record<string, number> = {
    physStrength: target.physical.strength,
    physSpeed: target.physical.speed,
    physAgility: target.physical.agility,
    physCoordination: target.physical.coordination,
    techControl: target.technique.control,
    techShortPasses: target.technique.shortPasses,
    techLongPasses: target.technique.longPasses,
    techAerial: target.technique.aerial,
    techCrossing: target.technique.crossing,
    techFinishing: target.technique.finishing,
    techDribbling: target.technique.dribbling,
    techOneVsOneOffense: target.technique.oneVsOneOff,
    techOneVsOneDefense: target.technique.oneVsOneDef,
    tacPositioning: target.tactic.positioning,
    tacTransition: target.tactic.transition,
    tacDecisions: target.tactic.decisions,
    tacAnticipations: target.tactic.anticipations,
    tacDuels: target.tactic.duels,
    tacSetPieces: target.tactic.setPieces,
  };
  return map[key] ?? 0;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAttrRatingColor(value: number): string {
  switch (value) {
    case 5: return 'bg-green-400 text-black';
    case 4: return 'bg-green-600 text-white';
    case 3: return 'bg-yellow-500 text-black';
    case 2: return 'bg-orange-500 text-white';
    case 1: return 'bg-red-600 text-white';
    default: return 'bg-zinc-700 text-zinc-400';
  }
}

function getVerdictStyle(verdict: Verdict): string {
  const opt = VERDICT_OPTIONS.find(v => v.value === verdict);
  if (!opt) return 'bg-zinc-600 text-white';
  // Map bg classes to include text
  switch (opt.color) {
    case 'bg-green-600': return 'bg-green-600 text-white';
    case 'bg-yellow-500': return 'bg-yellow-500 text-black';
    case 'bg-zinc-600': return 'bg-zinc-600 text-white';
    case 'bg-red-600': return 'bg-red-600 text-white';
    case 'bg-red-900': return 'bg-red-900 text-white';
    default: return 'bg-zinc-600 text-white';
  }
}

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
    <div>
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

// ─── Attribute Grid ──────────────────────────────────────────────────────────

function AttributeGrid({ title, attrs, target }: {
  title: string;
  attrs: { key: string; label: string }[];
  target: TargetPlayer;
}) {
  return (
    <div className="bg-zinc-900/50 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h4>
      <div className="space-y-1.5">
        {attrs.map(({ key, label }) => {
          const val = getAttributeValue(target, key);
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-sm text-zinc-300 flex-1 truncate">{label}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <div
                    key={n}
                    className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center ${
                      n <= val ? getAttrRatingColor(val) : 'bg-zinc-800 text-zinc-600'
                    }`}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Player Card ─────────────────────────────────────────────────────────────

function PlayerCard({ target }: { target: TargetPlayer }) {
  const [expanded, setExpanded] = useState(false);
  const isDiscarded = target.verdict === 'Discard';

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
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`text-2xl font-black ${RANK_NUM[target.rank]} tabular-nums`}>
              #{target.rank}
            </span>
            <div className="min-w-0">
              <h3 className={`text-lg font-bold text-white truncate ${isDiscarded ? 'line-through opacity-60' : ''}`}>
                {target.nationality} {target.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {target.age}y · {target.position} · {target.club} · {target.league}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <StatCell label="G/90" value={target.goalsP90.toFixed(2)} highlight={target.goalsP90 >= 1.0} />
            <StatCell label="xG/90" value={target.xgP90.toFixed(2)} />
            <StatCell label="SoT%" value={`${target.sotPct}%`} highlight={target.sotPct >= 50} />
            <StatCell label="Tch/Box" value={target.touchesBox.toFixed(1)} />

            {/* Verdict badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getVerdictStyle(target.verdict)}`}>
              {target.verdict}
            </span>

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
        <div className="border-t border-zinc-700/50 px-4 py-4 sm:px-6 space-y-5">
          {/* ── Row 1: Player header + Wyscout metrics + Financial ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Profile */}
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

            {/* Wyscout Data Metrics */}
            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Wyscout Data</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Appearances</span><span className="text-white">{target.apps}</span>
                <span className="text-zinc-500">Goals / Assists</span><span className="text-white font-bold">{target.goals} / {target.assists}</span>
                <span className="text-zinc-500">Minutes</span><span className="text-white">{target.minutes}</span>
                <span className="text-zinc-500">G/90</span>
                <span className={`font-bold ${target.goalsP90 >= 1.0 ? 'text-green-400' : 'text-white'}`}>{target.goalsP90.toFixed(2)}</span>
                <span className="text-zinc-500">xG/90</span><span className="text-white">{target.xgP90.toFixed(2)}</span>
                <span className="text-zinc-500">SoT%</span>
                <span className={`${target.sotPct >= 50 ? 'text-green-400' : 'text-white'}`}>{target.sotPct}%</span>
                <span className="text-zinc-500">Touches in box/90</span><span className="text-white">{target.touchesBox.toFixed(2)}</span>
                <span className="text-zinc-500">Dribbles/90</span><span className="text-white">{target.dribblesP90.toFixed(2)}</span>
                <span className="text-zinc-500">Prog. runs/90</span><span className="text-white">{target.progRuns.toFixed(1)}</span>
              </div>
            </div>

            {/* Financial Estimate */}
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

          {/* ── Row 2: Scout Evaluation — Attributes ── */}
          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">⚽ Scout Evaluation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AttributeGrid
                title={ATTRIBUTE_CATEGORIES.physical.title}
                attrs={ATTRIBUTE_CATEGORIES.physical.attrs}
                target={target}
              />
              <AttributeGrid
                title={ATTRIBUTE_CATEGORIES.technique.title}
                attrs={ATTRIBUTE_CATEGORIES.technique.attrs}
                target={target}
              />
              <AttributeGrid
                title={ATTRIBUTE_CATEGORIES.tactic.title}
                attrs={ATTRIBUTE_CATEGORIES.tactic.attrs}
                target={target}
              />
            </div>
          </div>

          {/* ── Row 3: Overall Assessment — ABILITY + POTENTIAL ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Ability</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.ability)}`}>
                    {target.ability}
                  </span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.ability] || '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Potential</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.potential)}`}>
                    {target.potential}
                  </span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.potential] || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 4: Scouting Tags ── */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Scouting Tags</h4>
            <div className="flex flex-wrap gap-2">
              {target.scoutingTags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-zinc-700 text-zinc-200 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* ── Row 5: Verdict ── */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Verdict</h4>
            <span className={`inline-block px-5 py-2 rounded-lg text-sm font-bold ${getVerdictStyle(target.verdict)}`}>
              {target.verdict}
            </span>
          </div>

          {/* ── Row 6: Role ── */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Role</h4>
            <p className="text-sm text-white font-medium">{target.role}</p>
          </div>

          {/* ── Row 7: Conclusion ── */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Conclusion</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{target.conclusion}</p>
          </div>

          {/* ── Row 8: Notes ── */}
          {target.notes && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Notes</h4>
              <p className="text-sm text-zinc-500 leading-relaxed italic">{target.notes}</p>
            </div>
          )}

          {/* ── Row 9: Video badge ── */}
          {target.hasVideo && (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <span>🎬</span> Wyscout video clips available in Film Room
            </div>
          )}

          {/* ── Row 10: Screenshots gallery ── */}
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
              <th className="px-3 py-2 text-center">Ability</th>
              <th className="px-3 py-2 text-center">Potential</th>
              <th className="px-3 py-2 text-center">EU</th>
              <th className="px-3 py-2 text-right">Est. Fee</th>
              <th className="px-3 py-2 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {TARGETS_DATA.map((t) => {
              const isDiscarded = t.verdict === 'Discard';
              return (
                <tr key={t.rank} className={`hover:bg-zinc-700/20 ${isDiscarded ? 'opacity-50' : ''}`}>
                  <td className={`px-3 py-2 font-bold ${RANK_NUM[t.rank]}`}>{t.rank}</td>
                  <td className={`px-3 py-2 font-medium text-white whitespace-nowrap ${isDiscarded ? 'line-through' : ''}`}>
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
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${getPotentialColor(t.ability)}`}>
                      {t.ability}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${getPotentialColor(t.potential)}`}>
                      {t.potential}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">{t.euPassport ? '✅' : '❌'}</td>
                  <td className="px-3 py-2 text-right text-zinc-300 whitespace-nowrap">{t.estFee}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getVerdictStyle(t.verdict)}`}>
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
            Detailed Scout Reports — Click to Expand
          </h2>
          {TARGETS_DATA.map((target) => (
            <PlayerCard key={target.rank} target={target} />
          ))}
        </div>

        {/* Footer notes */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500 space-y-1">
          <p><strong className="text-zinc-400">Methodology:</strong> All per-90 stats calculated from Wyscout data. xG from Wyscout model. Market values from Transfermarkt. Scout evaluations use FCB standard grading template.</p>
          <p><strong className="text-zinc-400">Recommendation:</strong> Pursue Bajraj immediately (€0-25k, EU passport, 1.04 G/90). Monitor Van der Leij as aspirational target. Ndiaye as Plan B if non-EU slot available.</p>
          <p><strong className="text-zinc-400">Budget context:</strong> FC Bacău estimated transfer budget: €50-150k total. Salary budget for new striker: €3,000-5,000/mo.</p>
        </div>
      </main>
    </div>
  );
}
