'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
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
  },
  {
    rank: 6,
    name: "Tommaso Carcani",
    age: 23,
    nationality: "🇮🇹",
    club: "Tau Calcio Altopascio",
    league: "Italy Serie D - Girone E",
    position: "CF",
    height: "N/A",
    foot: "Both (R10, L6, H1)",
    marketValue: "€125k",
    contract: "30/06/2026 (expiring)",
    apps: 24, goals: 14, assists: 0, minutes: 1707,
    goalsP90: 0.74, xgP90: 0.63, sotPct: 44.8, touchesBox: 0.0, dribblesP90: 1.98, progRuns: 0.0,
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 2, aerial: 2, crossing: 2, finishing: 4, dribbling: 3, oneVsOneOff: 3, oneVsOneDef: 2 },
    tactic: { positioning: 4, transition: 3, decisions: 3, anticipations: 3, duels: 2, setPieces: 3 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Chance conversion", "Two-footed", "Penalty specialist"],
    verdict: "Monitor",
    role: "Centre-Forward / Poacher",
    conclusion: "14 goals in 24 apps looks elite but 6 are penalties (43%). Open play: 8 goals from 11.99 xG — slightly outperforming. Genuinely two-footed (right 10, left 6, head 1) which is rare. Weak in duels (36.5%) and aerials (35.1%) — gets physically dominated. 74.4% pass accuracy, only 14.56 passes/90 — not a link-up striker. Serie D is Italy's 4th tier; all stats must be viewed in that context. Contract expiring June 2026, no agent — affordable.",
    notes: "Hat-trick vs Foligno (3-1), brace vs Ghiviborgo (2-1), hat-trick vs San Donato Tavarnelle (3-0). Career: 49 apps, 10 goals before this season breakout. VIDEO LOCKED — Ceahlăul Wyscout subscription doesn't cover Italian Serie D clips. Recommend in-person scouting or sourcing match footage independently.",
    screenshots: [],
    hasVideo: false,
    estFee: "€0-50k (expiring, no agent)",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "https://www.transfermarkt.com/tommaso-carcani/profil/spieler/1056751"
  }
];

// ─── Position Tabs ───────────────────────────────────────────────────────────

type PositionTab = 'strikers' | 'dms' | 'cbs';

// ─── DM-specific metrics interface ──────────────────────────────────────────

interface DMMetrics {
  interceptionsP90: number;
  defDuelsP90: number;
  defDuelsWonPct: number;
  passesP90: number;
  passAccPct: number;
  foulsP90: number;
}

// ─── CB-specific metrics interface ──────────────────────────────────────────

interface CBMetrics {
  aerialDuelsP90: number;
  aerialWonPct: number;
  defDuelsWonPct: number;
  interceptionsP90: number;
  passAccPct: number;
  foulsP90: number;
}

// ─── DM Targets Data ────────────────────────────────────────────────────────

const DM_TARGETS_DATA: (TargetPlayer & { dmMetrics: DMMetrics })[] = [
  {
    rank: 1,
    name: "I. Cărăruș",
    age: 29,
    nationality: "🇲🇩🇷🇴",
    club: "Corvinul Hunedoara",
    league: "Romania Liga II",
    position: "DMF",
    height: "182cm",
    foot: "Right",
    marketValue: "€200K",
    contract: "30/06/2026 (expiring)",
    apps: 24, goals: 5, assists: 0, minutes: 2221,
    goalsP90: 0.20, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    dmMetrics: { interceptionsP90: 5.96, defDuelsP90: 10.01, defDuelsWonPct: 66.40, passesP90: 55.23, passAccPct: 87.31, foulsP90: 1.58 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 4 },
    technique: { control: 4, shortPasses: 4, longPasses: 4, aerial: 3, crossing: 2, finishing: 2, dribbling: 3, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 4, decisions: 4, anticipations: 4, duels: 5, setPieces: 2 },
    ability: 4,
    potential: 4,
    scoutingTags: ["Elite ball recovery", "Highest duel volume", "Romanian passport", "Goal threat from DM"],
    verdict: "Sign",
    role: "Defensive Midfielder / Complete DM",
    conclusion: "#1 — Best overall DM in Liga 2. Elite numbers across the board: 5.96 int/90, 10.01 def duels/90 (HIGHEST in league), 87% pass accuracy, 55 passes/90. 4 headed goals from DM shows aerial dominance from set pieces. 182cm/77kg, right-footed. Moldovan-born with Romanian passport. Contract expiring 30/06/2026 — negotiate now for summer or minimal fee. Corvinul is top of Liga 2 though, so may demand a fee.",
    notes: "FILM REVIEW: 15 pages of interception clips — elite reading of the game. Consistently steps into passing lanes to cut off supply. 15 pages of defending duels — physical presence in midfield. ALL 4 goals are headers from set pieces — a DM who's a genuine aerial threat. 91st-minute tackle vs Slatina protecting 1-0 win shows mentality. 24 matches/2221 mins = undisputed starter at Corvinul (top of Liga 2, Romanian Cup winners). 3 yellows is clean for his duel volume.",
    screenshots: [
      "dm-cararusi-interception-vs-afumati-36min.png",
      "dm-cararusi-interception-read-vs-afumati-36min.png",
      "dm-cararusi-defduels-vs-poliasi-3min.png",
      "dm-cararusi-defduels-vs-poliasi-13min.png",
      "dm-cararusi-header-goal-vs-gloriabistr-64min.png",
      "dm-cararusi-passes-vs-poliasi-kickoff.png",
      "dm-cararusi-tackle-vs-slatina-91min.png",
    ],
    hasVideo: true,
    estFee: "€50-150K (expiring)",
    estSalary: "€3,000-5,000/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 2,
    name: "R. Sierra",
    age: 29,
    nationality: "🇪🇸",
    club: "FC Argeș",
    league: "Romania SuperLiga",
    position: "DMF / RDMF / LDMF",
    height: "181cm",
    foot: "Right",
    marketValue: "€250K",
    contract: "Expired 30/06/2024 (FREE AGENT status)",
    apps: 27, goals: 3, assists: 0, minutes: 2386,
    goalsP90: 0.08, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    dmMetrics: { interceptionsP90: 5.45, defDuelsP90: 5.53, defDuelsWonPct: 59.15, passesP90: 56.83, passAccPct: 88.90, foulsP90: 1.95 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 4 },
    technique: { control: 4, shortPasses: 5, longPasses: 3, aerial: 3, crossing: 2, finishing: 2, dribbling: 3, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 5, transition: 3, decisions: 4, anticipations: 5, duels: 3, setPieces: 2 },
    ability: 4,
    potential: 4,
    scoutingTags: ["Best passer in Liga 2", "Positional interceptor", "Spanish passport", "Experienced"],
    verdict: "Sign",
    role: "Defensive Midfielder / Deep-Lying Playmaker",
    conclusion: "#2 — SUPERLIGA STARTER available on expired contract. Currently playing top-flight Romanian football at Argeș: 27 matches, 2386 mins, 3 goals in SuperLiga 2025/26. 88.90% pass accuracy, 56.83 passes/90 — elite distribution. 181cm, Spanish passport (EU). Contract expired 30/06/2024 — potential FREE AGENT. This is a massive upgrade for any Liga 2 club. Plays DMF/RDMF/LDMF — positional versatility.",
    notes: "FILM REVIEW: SuperLiga broadcast quality video. 15 pages of interceptions — reads the game at a top-flight level. 15 pages of defending duels — physically engages well despite not being the biggest. 14 pages of passes — moves the ball forward intelligently with quick, accurate short passes. Plays for Argeș who beat Petrolul 2-1 and Hermannstadt 3-1 in recent SuperLiga matches. 2 yellows, 0 reds in 27 starts = very disciplined.",
    screenshots: [
      "dm-sierra-interception-vs-petrolul-80min.png",
      "dm-sierra-defduels-vs-petrolul-45min.png",
      "dm-sierra-passes-vs-petrolul-9min.png",
    ],
    hasVideo: true,
    estFee: "FREE (contract expired)",
    estSalary: "€3,000-5,000/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 3,
    name: "I. Roșu",
    age: 31,
    nationality: "🇷🇴",
    club: "Chindia Târgoviște",
    league: "Romania Liga II",
    position: "RCMF / DMF",
    height: "N/A",
    foot: "Right",
    marketValue: "€100K",
    contract: "30/06/2027",
    apps: 23, goals: 4, assists: 1, minutes: 1568,
    goalsP90: 0.23, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    dmMetrics: { interceptionsP90: 5.40, defDuelsP90: 5.40, defDuelsWonPct: 68.09, passesP90: 36.05, passAccPct: 77.07, foulsP90: 1.03 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 3, crossing: 2, finishing: 3, dribbling: 3, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 4, setPieces: 3 },
    ability: 3,
    potential: 3,
    scoutingTags: ["Best duel win rate", "Goal threat", "Romanian passport", "Experienced"],
    verdict: "Sign",
    role: "Defensive Midfielder / Box-to-Box",
    conclusion: "#3 — Best defensive duel win rate among DM targets (68.09%). Romanian passport. 4 goals + 1 assist from a DM/CM role is a valuable attacking bonus. Very clean — only 1.03 fouls/90. At €100K with Romanian passport, excellent value. 31 is older but brings experience for a Liga 2 push.",
    notes: "23 matches/1568 mins = regular starter at Chindia. 5 yellows. 9.82 successful defensive actions/90. Pass accuracy (77%) is the lowest among targets — more of a destroyer than a playmaker. Contract until 2027 means a fee is needed.",
    screenshots: [
      "dm-rosu-interception-vs-dinamo-22min.png",
      "dm-rosu-defduels-vs-dinamo-15min.png",
      "dm-rosu-passes-vs-dinamo-4min.png",
      "dm-rosu-tackles-vs-dinamo-11min.png",
    ],
    hasVideo: true,
    estFee: "€50-100K",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 4,
    name: "O. Kaplan",
    age: 26,
    nationality: "🇷🇴",
    club: "Afumați",
    league: "Romania Liga II",
    position: "LCMF / RDMF",
    height: "N/A",
    foot: "Right",
    marketValue: "N/A",
    contract: "Unknown",
    apps: 17, goals: 0, assists: 0, minutes: 1552,
    goalsP90: 0.0, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    dmMetrics: { interceptionsP90: 5.22, defDuelsP90: 6.15, defDuelsWonPct: 66.04, passesP90: 43.09, passAccPct: 84.52, foulsP90: 1.22 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 4, longPasses: 4, aerial: 2, crossing: 2, finishing: 1, dribbling: 3, oneVsOneOff: 2, oneVsOneDef: 3 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 4, duels: 3, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Romanian passport", "Budget option", "Good passer", "Young enough"],
    verdict: "Sign",
    role: "Defensive Midfielder / Balanced DM",
    conclusion: "#4 — Balanced profile at a bargain price. 5.22 int/90 and 84.52% pass accuracy show a two-way midfielder. No market value listed + Afumați is a small club = very affordable. Romanian passport. At 26, still has development years. 62.5% long pass accuracy is best among DM targets — can switch play.",
    notes: "17 matches/1552 mins at Afumați. 4 yellows. Aerial duel win rate (39.62%) is poor — not a physical presence. 9.39 successful defensive actions/90. No goals or assists — purely a defensive contributor.",
    screenshots: [
      "dm-kaplan-interception-vs-satummare-30min.png",
      "dm-kaplan-defduels-vs-satummare-11min.png",
      "dm-kaplan-passes-vs-satummare-2min.png",
    ],
    hasVideo: true,
    estFee: "Minimal or FREE",
    estSalary: "€1,500-2,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 5,
    name: "M. Onișa",
    age: 25,
    nationality: "🇷🇴",
    club: "Voluntari",
    league: "Romania Liga II",
    position: "LCMF / DMF",
    height: "N/A",
    foot: "Right",
    marketValue: "€200K",
    contract: "30/06/2026 (expiring)",
    apps: 21, goals: 2, assists: 3, minutes: 1550,
    goalsP90: 0.12, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    dmMetrics: { interceptionsP90: 5.05, defDuelsP90: 5.46, defDuelsWonPct: 67.02, passesP90: 48.89, passAccPct: 83.61, foulsP90: 0.87 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 4, longPasses: 3, aerial: 3, crossing: 2, finishing: 2, dribbling: 3, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Youngest DM target", "Romanian passport", "Most assists", "Expiring contract"],
    verdict: "Sign",
    role: "Defensive Midfielder / Ball-Playing DM",
    conclusion: "#5 — Best young option. Only 25, Romanian passport, 2 goals + 3 assists shows attacking contribution. 67.02% defensive duel win rate with only 0.87 fouls/90 = clean defender. 83.61% pass accuracy at 48.89 passes/90 shows composure on the ball. Contract expiring 30/06/2026 — negotiate for summer.",
    notes: "21 matches/1550 mins at Voluntari (relegated from SuperLiga). 3 yellows — very disciplined. 66% aerial duel win rate is surprisingly good. 9.23 successful defensive actions/90. Voluntari's relegation means he may be looking for a move.",
    screenshots: [
      "dm-onisa-interception-vs-muscelul-4min.png",
      "dm-onisa-interception-vs-selimbar-3min.png",
      "dm-onisa-defduels-vs-muscelul-18min.png",
      "dm-onisa-passes-vs-muscelul-0min.png",
      "dm-onisa-tackles-vs-selimbar-14min.png",
    ],
    hasVideo: true,
    estFee: "FREE or €50K (expiring)",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 6,
    name: "D. Hergheligiu",
    age: 26,
    nationality: "🇮🇹🇷🇴",
    club: "Latina (on loan)",
    league: "Italy Serie C",
    position: "DMF / RCMF / LCMF",
    height: "185cm",
    foot: "Right",
    marketValue: "€150K",
    contract: "30/06/2027",
    apps: 32, goals: 0, assists: 1, minutes: 2111,
    goalsP90: 0.0, xgP90: 0.02, sotPct: 12.5, touchesBox: 0.47, dribblesP90: 0.55, progRuns: 1.32,
    dmMetrics: { interceptionsP90: 2.86, defDuelsP90: 3.58, defDuelsWonPct: 58.33, passesP90: 45.75, passAccPct: 87.98, foulsP90: 0.77 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 4, longPasses: 3, aerial: 3, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 3 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 3, duels: 3, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Romanian passport", "Italy Serie C tested", "Elite passer (88%)", "On loan — investigate parent club"],
    verdict: "Monitor",
    role: "Defensive Midfielder / Deep-Lying Playmaker",
    conclusion: "#6 — Romanian with Italian passport playing Serie C at Latina (on loan). 32 matches/2111 mins = undisputed starter. 87.98% pass accuracy at 45.75 passes/90 — clean distributor. Lower defensive numbers than Liga II targets (2.86 int/90, 58% duel win) — more of a passer than a destroyer. Very clean discipline (5Y, 0.77 fouls/90). 185cm/75kg, right-footed. Playing abroad in a stronger league (Serie C > Liga II).",
    notes: "On loan at Latina — need to identify parent club. Progressive passes 6.52/90 and passes to final third 8.10/90 show he advances play well. Low aerial presence (0.64 aerial duels/90). Contract until 2027 means a fee or loan extension needed. Wyscout video confirmed available for Serie C.",
    screenshots: [
      "dm-hergheligiu-overview-latina.png",
    ],
    hasVideo: true,
    estFee: "€50-150K",
    estSalary: "€3,000-5,000/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 7,
    name: "C. Dros",
    age: 27,
    nationality: "🇲🇩🇷🇴",
    club: "Vllaznia Shkodër",
    league: "Albania Abissnet Superiore",
    position: "RCMF / DMF",
    height: "185cm",
    foot: "Right",
    marketValue: "€250K",
    contract: "30/06/2027",
    apps: 16, goals: 0, assists: 1, minutes: 1306,
    goalsP90: 0.0, xgP90: 0.01, sotPct: 10, touchesBox: 0.41, dribblesP90: 0.34, progRuns: 0.83,
    dmMetrics: { interceptionsP90: 4.13, defDuelsP90: 5.03, defDuelsWonPct: 56.16, passesP90: 35.97, passAccPct: 81.80, foulsP90: 1.52 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 2, crossing: 3, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 3 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 3, duels: 3, setPieces: 2 },
    ability: 3,
    potential: 3,
    scoutingTags: ["Romanian passport", "Albanian league tested", "Long pass specialist (60%)", "Moldovan-born"],
    verdict: "Monitor",
    role: "Defensive Midfielder / Box-to-Box",
    conclusion: "#7 — Moldovan-born with Romanian passport playing in Albanian top flight. 16 matches/1306 mins at Vllaznia. Weakest duel numbers on the list (56.16% defensive duel win). 81.80% pass accuracy — lowest among DM targets. Long passes at 60.34% accuracy and 6.34 passes to final third/90 show some progression ability. Poor aerial presence (34.29% aerial win). At €250K with 2027 contract, expensive relative to quality. Albanian league is weaker than Liga II.",
    notes: "Moldovan-born, Romanian passport. 185cm/75kg. 3 yellows in 16 matches. Low dribble numbers. Cross accuracy 33% is decent. Compare directly with Hergheligiu — similar profile but Hergheligiu has better stats in a stronger league (Serie C).",
    screenshots: [
      "dm-dros-overview-vllaznia.png",
    ],
    hasVideo: true,
    estFee: "€100-200K",
    estSalary: "€3,000-4,500/mo",
    euPassport: true,
    tmUrl: "",
  },
];

// ─── CB Targets Data ────────────────────────────────────────────────────────

const CB_TARGETS_DATA: (TargetPlayer & { cbMetrics: CBMetrics })[] = [
  {
    rank: 1,
    name: "C. Apro",
    age: 29,
    nationality: "🇷🇴",
    club: "Școlar Reșița",
    league: "Romania Liga II",
    position: "LCB",
    height: "N/A",
    foot: "Right",
    marketValue: "€175K",
    contract: "Unknown",
    apps: 17, goals: 1, assists: 1, minutes: 1608,
    goalsP90: 0.06, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 4.81, aerialWonPct: 68.60, defDuelsWonPct: 81.01, interceptionsP90: 5.71, passAccPct: 77.99, foulsP90: 0.67 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 4, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 5 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 5, setPieces: 2 },
    ability: 4,
    potential: 4,
    scoutingTags: ["BEST duel win rate", "Elite aerial %", "Romanian passport", "Clean defender"],
    verdict: "Sign",
    role: "Centre-Back / Stopper",
    conclusion: "#1 — Best defensive duel win rate in Liga 2 CBs (81.01%). Dominant in the air (68.60% aerial win). Romanian passport. Very clean — only 2Y/0R, 0.67 fouls/90. 10.19 progressive passes/90 shows he can carry the ball forward despite lower pass accuracy. A proven Liga 2 defender.",
    notes: "17 matches/1608 mins at Școlar Reșița. Pass accuracy (78%) is lowest among CB targets — not a ball-player. 9.35 successful defensive actions/90. At 29, limited resale but peak reliability. Școlar Reșița is a smaller club — should be gettable.",
    screenshots: [
      "cb-apro-interception-vs-asatgmures-6min.png",
      "cb-apro-defduels-vs-asatgmures-19min.png",
      "cb-apro-aerial-vs-asatgmures-49min.png",
    ],
    hasVideo: true,
    estFee: "€50-100K",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 2,
    name: "M. Manea",
    age: 25,
    nationality: "🇷🇴",
    club: "ASA Târgu Mureș",
    league: "Romania Liga II",
    position: "RCB / LCB",
    height: "N/A",
    foot: "Right",
    marketValue: "N/A",
    contract: "Unknown",
    apps: 16, goals: 1, assists: 0, minutes: 1474,
    goalsP90: 0.06, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 4.46, aerialWonPct: 57.53, defDuelsWonPct: 72.62, interceptionsP90: 5.68, passAccPct: 86.73, foulsP90: 0.98 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 4, shortPasses: 4, longPasses: 3, aerial: 3, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 4, setPieces: 2 },
    ability: 4,
    potential: 4,
    scoutingTags: ["Best passer among CBs", "Zero cards", "Romanian passport", "Young"],
    verdict: "Sign",
    role: "Centre-Back / Ball-Playing CB",
    conclusion: "#2 — Best passer among CB targets (86.73% accuracy). ZERO yellow or red cards in 16 matches — remarkable discipline. Romanian passport. At 25, prime development years with resale potential. 72.62% defensive duel win rate is strong. ASA Tg Mureș is a small club — should be very affordable.",
    notes: "16 matches/1474 mins. 8.00 progressive passes/90 shows composure to play out from the back. 9.53 successful defensive actions/90. No market value = likely cheap. Zero cards is elite discipline for a CB.",
    screenshots: [
      "cb-manea-interception-vs-scolarresita-42min.png",
      "cb-manea-defduels-vs-dinamo-22min.png",
      "cb-manea-defduels-vs-scolarresita-44min.png",
      "cb-manea-aerial-vs-scolarresita-66min.png",
      "cb-manea-goal-vs-dumbravita-17min.png",
    ],
    hasVideo: true,
    estFee: "Minimal (no MV listed)",
    estSalary: "€1,500-2,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 3,
    name: "B. Panaite",
    age: 25,
    nationality: "🇷🇴",
    club: "Dumbrăvița",
    league: "Romania Liga II",
    position: "RCB / LCB",
    height: "N/A",
    foot: "Right",
    marketValue: "N/A",
    contract: "Unknown",
    apps: 21, goals: 2, assists: 1, minutes: 1792,
    goalsP90: 0.10, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 4.52, aerialWonPct: 65.56, defDuelsWonPct: 70.83, interceptionsP90: 5.78, passAccPct: 79.51, foulsP90: 0.65 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 4, crossing: 2, finishing: 2, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 3, anticipations: 4, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["Most minutes played", "Good aerial presence", "Romanian passport", "Goal threat"],
    verdict: "Sign",
    role: "Centre-Back / All-Round CB",
    conclusion: "#3 — Most experienced on the list (21 matches/1792 mins). 2 goals from CB. Good aerial presence (65.56% win rate). Romanian passport. Very clean — 2Y/0R, 0.65 fouls/90. Dumbrăvița is a small club = affordable. Balanced profile without outstanding weaknesses.",
    notes: "21 matches is the highest on the CB list — iron man reliability. 7.63 progressive passes/90. 9.69 successful defensive actions/90. Teammate with Butnărașu (see #5) — package deal possible from Dumbrăvița.",
    screenshots: [
      "cb-panaite-interception-vs-arges-30min.png",
      "cb-panaite-defduels-vs-arges-13min.png",
      "cb-panaite-aerial-vs-arges-13min.png",
      "cb-panaite-goal-vs-csmsatumare-16min.png",
      "cb-panaite-passing-vs-arges-4min.png",
    ],
    hasVideo: true,
    estFee: "Minimal (no MV listed)",
    estSalary: "€1,500-2,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 4,
    name: "M. Bărăitaru",
    age: 19,
    nationality: "🇷🇴",
    club: "Slatina",
    league: "Romania Liga II",
    position: "RCB",
    height: "N/A",
    foot: "Right",
    marketValue: "N/A",
    contract: "30/06/2026 (expiring)",
    apps: 24, goals: 2, assists: 0, minutes: 2269,
    goalsP90: 0.08, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 3.65, aerialWonPct: 59.78, defDuelsWonPct: 76.47, interceptionsP90: 4.40, passAccPct: 79.92, foulsP90: 0.79 },
    physical: { strength: 3, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 3, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 3, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 5,
    scoutingTags: ["Only 19 years old", "Highest minutes in Liga 2", "Romanian passport", "Huge potential"],
    verdict: "Sign",
    role: "Centre-Back / Young Prospect",
    conclusion: "#4 — Only 19 and already a Liga 2 starter with 2269 minutes (most of ANY CB). 76.47% defensive duel win rate at his age is exceptional. Romanian passport. Contract expiring 30/06/2026 — sign now before bigger clubs notice. 2 goals from CB. The long-term investment pick.",
    notes: "24 matches at 19 years old — remarkable maturity. Only 2Y/0R. Lower interception rate (4.40/90) than others but he's 19 — will improve with coaching. Slatina is mid-table Liga 2 — realistic to buy from. Massive upside if he develops.",
    screenshots: [
      "cb-baraitaru-interception-vs-metaloglobus-54min.png",
      "cb-baraitaru-defduels-vs-metaloglobus-7min.png",
      "cb-baraitaru-aerial-vs-csmsatumare-32min.png",
      "cb-baraitaru-goal-vs-csmsatumare-67min.png",
    ],
    hasVideo: true,
    estFee: "€25-50K (expiring, young)",
    estSalary: "€1,000-2,000/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 5,
    name: "R. Butnărașu",
    age: 20,
    nationality: "🇷🇴",
    club: "Dumbrăvița",
    league: "Romania Liga II",
    position: "RCB",
    height: "N/A",
    foot: "Right",
    marketValue: "N/A",
    contract: "30/06/2026 (expiring)",
    apps: 25, goals: 1, assists: 0, minutes: 1942,
    goalsP90: 0.05, xgP90: 0.0, sotPct: 0, touchesBox: 0.0, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 4.91, aerialWonPct: 63.21, defDuelsWonPct: 72.66, interceptionsP90: 6.26, passAccPct: 73.62, foulsP90: 0.83 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 2, shortPasses: 3, longPasses: 3, aerial: 4, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 4, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 5,
    scoutingTags: ["Highest interception rate", "Young prospect", "Romanian passport", "Aggressive defender"],
    verdict: "Sign",
    role: "Centre-Back / Ball-Winning CB",
    conclusion: "#5 — Highest interception rate among all CB targets (6.26/90) at only 20 years old. 72.66% defensive duel win rate. Romanian passport. 4.91 aerial duels/90 with 63.21% win rate shows physical presence. Contract expiring 2026. Pass accuracy (73.62%) is the weakest — needs development on the ball. Teammate with Panaite (#3) — package deal from Dumbrăvița.",
    notes: "25 matches/1942 mins at 20 = trusted starter. 5Y/0R — slightly more cards than ideal. 11.35 successful defensive actions/90 is elite. The raw defending numbers are outstanding for his age — coaching can improve his passing.",
    screenshots: [
      "cb-butnarasu-interception-vs-arges-87min.png",
      "cb-butnarasu-interception-vs-voluntari-31min.png",
      "cb-butnarasu-defduels-vs-arges-87min.png",
      "cb-butnarasu-aerial-vs-slatina-26min.png",
      "cb-butnarasu-goal-header-vs-selimbar-12min.png",
    ],
    hasVideo: true,
    estFee: "€25-50K (expiring, young)",
    estSalary: "€1,000-2,000/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 6,
    name: "A. Moțoc",
    age: 23,
    nationality: "🇲🇩🇷🇴",
    club: "Trapani",
    league: "Italy Serie C",
    position: "RCB / CB / LCB",
    height: "195cm",
    foot: "Right",
    marketValue: "N/A",
    contract: "Unknown",
    apps: 13, goals: 1, assists: 0, minutes: 1241,
    goalsP90: 0.07, xgP90: 0.05, sotPct: 20, touchesBox: 0.51, dribblesP90: 0.22, progRuns: 0.36,
    cbMetrics: { aerialDuelsP90: 3.77, aerialWonPct: 67.31, defDuelsWonPct: 70.59, interceptionsP90: 4.42, passAccPct: 82.00, foulsP90: 1.23 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 4, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 3, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 5,
    scoutingTags: ["Youngest CB abroad", "195cm giant", "Romanian passport", "Serie C tested", "No market value — potentially cheap"],
    verdict: "Sign",
    role: "Centre-Back / Aerial Dominant CB",
    conclusion: "#6 — Moldovan-born, Romanian passport, 195cm/80kg — tallest CB on the entire list. Playing Serie C at Trapani (stronger league than Liga II). 67.31% aerial win rate, 70.59% defensive duel win at only 23. 82% pass accuracy is solid for a big CB. 1 header goal. No market value listed + unknown contract = potentially very cheap or even free. The youngest Romanian abroad option with the highest ceiling.",
    notes: "13 matches/1241 mins at Trapani. 2Y/0R — clean. 9.21 successful defensive actions/90. 0.94 shots blocked/90 is elite — physical shot blocker. 7.69 progressive passes/90 shows he can carry forward despite being a giant. Moldovan-born like Dumbravanu. CONTRACT EXPIRED 30/06/2025 — potential FREE AGENT.",
    screenshots: [
      "cb-motoc-defduels-vs-catania-00min.png",
      "cb-motoc-interception-vs-catania-05min.png",
      "cb-motoc-aerial-vs-catania-14min.png",
      "cb-motoc-goal-vs-giugliano-09min.png",
      "cb-motoc-overview-trapani.png",
    ],
    hasVideo: true,
    estFee: "€0-50K (no MV, unknown contract)",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 7,
    name: "E. Duțu",
    age: 24,
    nationality: "🇮🇹🇷🇴",
    club: "Latina",
    league: "Italy Serie C",
    position: "RCB / LCB",
    height: "189cm",
    foot: "Right",
    marketValue: "€50K",
    contract: "30/06/2027",
    apps: 22, goals: 0, assists: 1, minutes: 2000,
    goalsP90: 0.0, xgP90: 0.03, sotPct: 20, touchesBox: 0.63, dribblesP90: 0.18, progRuns: 0.63,
    cbMetrics: { aerialDuelsP90: 3.74, aerialWonPct: 67.47, defDuelsWonPct: 76.52, interceptionsP90: 4.64, passAccPct: 84.53, foulsP90: 0.99 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 4, longPasses: 3, aerial: 4, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 4, setPieces: 2 },
    ability: 4,
    potential: 4,
    scoutingTags: ["Best duel rate abroad (76.5%)", "Romanian passport", "Serie C iron man", "Teammate of Hergheligiu"],
    verdict: "Sign",
    role: "Centre-Back / Reliable Stopper",
    conclusion: "#7 — Italian-born Romanian playing Serie C at Latina alongside Hergheligiu (DM #6). 76.52% defensive duel win rate — best among the abroad CBs. 67.47% aerial win at 189cm. 84.53% pass accuracy is good for a CB. 22 matches/2000 mins = absolute iron man. Only €50K market value with 2027 contract. Package deal potential with Hergheligiu from the same club.",
    notes: "22 matches/2000 mins at 24 — nailed-on starter. 5Y/1R — discipline needs monitoring. 9.54 successful defensive actions/90. 1 assist shows some progressive play. Latina teammate with Hergheligiu — could negotiate both together. 0.36 shots blocked/90.",
    screenshots: [
      "cb-dutu-overview-latina.png",
    ],
    hasVideo: true,
    estFee: "€25-75K",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 8,
    name: "D. Dumbravanu",
    age: 24,
    nationality: "🇲🇩🇷🇴",
    club: "Voluntari (on loan)",
    league: "Italy Serie C / Romania Liga II",
    position: "LCB / LB",
    height: "192cm",
    foot: "Left",
    marketValue: "€75K",
    contract: "30/06/2026 (expiring)",
    apps: 11, goals: 0, assists: 0, minutes: 1085,
    goalsP90: 0.0, xgP90: 0.04, sotPct: 50, touchesBox: 0.17, dribblesP90: 0.0, progRuns: 0.0,
    cbMetrics: { aerialDuelsP90: 2.16, aerialWonPct: 46.15, defDuelsWonPct: 73.17, interceptionsP90: 4.48, passAccPct: 78.09, foulsP90: 1.08 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 3 },
    technique: { control: 3, shortPasses: 3, longPasses: 3, aerial: 3, crossing: 2, finishing: 1, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 3, transition: 3, decisions: 3, anticipations: 3, duels: 4, setPieces: 2 },
    ability: 3,
    potential: 4,
    scoutingTags: ["LEFT-FOOTED CB", "192cm", "Romanian passport", "Expiring contract", "Can play LB"],
    verdict: "Sign",
    role: "Centre-Back / Left-Footed LCB",
    conclusion: "#8 — LEFT-FOOTED 192cm CB — rare premium combination. Moldovan-born with Romanian passport. 73.17% defensive duel win rate is strong. Contract expiring 30/06/2026 — negotiate now for summer or minimal fee. Can also play LB for tactical flexibility. Low aerial win rate (46.15%) is surprising for his height — needs investigation on film. Only 11 matches/1085 mins — limited sample.",
    notes: "On loan from CFR Cluj at Voluntari (Liga II). 1Y/1R in 11 matches — the red card is a concern. 6.80 progressive passes/90 but 78% pass accuracy — tries to play forward but accuracy suffers. Long pass accuracy 45.65%. Left foot is his main selling point for a back line that needs balance. Previous career in Italy (Messina, Foggia) + Moldova international.",
    screenshots: [
      "cb-dumbravanu-defduels-vs-campulung-55min.png",
      "cb-dumbravanu-interception-vs-campulung-09min.png",
      "cb-dumbravanu-aerial-vs-campulung-16min.png",
      "cb-dumbravanu-overview-voluntari.png",
    ],
    hasVideo: true,
    estFee: "€0-50K (expiring)",
    estSalary: "€2,000-3,500/mo",
    euPassport: true,
    tmUrl: "",
  },
  {
    rank: 9,
    name: "S. Potop",
    age: 26,
    nationality: "🇮🇹🇷🇴",
    club: "AlbinoLeffe",
    league: "Italy Serie C",
    position: "CB",
    height: "N/A",
    foot: "Right",
    marketValue: "€200K",
    contract: "30/06/2027",
    apps: 37, goals: 3, assists: 0, minutes: 3538,
    goalsP90: 0.08, xgP90: 0.03, sotPct: 40, touchesBox: 0.43, dribblesP90: 0.15, progRuns: 0.99,
    cbMetrics: { aerialDuelsP90: 5.47, aerialWonPct: 64.19, defDuelsWonPct: 74.38, interceptionsP90: 3.89, passAccPct: 91.68, foulsP90: 1.04 },
    physical: { strength: 4, speed: 3, agility: 3, coordination: 4 },
    technique: { control: 4, shortPasses: 5, longPasses: 3, aerial: 4, crossing: 2, finishing: 2, dribbling: 2, oneVsOneOff: 2, oneVsOneDef: 4 },
    tactic: { positioning: 4, transition: 3, decisions: 4, anticipations: 4, duels: 4, setPieces: 3 },
    ability: 4,
    potential: 4,
    scoutingTags: ["ELITE passer (92%)", "Most minutes on entire list", "3 header goals", "Serie C iron man", "Romanian passport"],
    verdict: "Sign",
    role: "Centre-Back / Ball-Playing CB",
    conclusion: "#9 — The standout Romanian abroad CB. 91.68% pass accuracy is BY FAR the highest on the entire CB list (Liga II + abroad). 37 matches/3538 mins — most minutes of ANY defender across all targets. 74.38% defensive duel win, 64.19% aerial win, 5.47 aerial duels/90. 3 goals (all headers) from CB — set piece weapon. Playing Serie C at AlbinoLeffe which is a significantly stronger league than Liga II. At €200K with 2027 contract, he's the most expensive CB but arguably the best.",
    notes: "37 matches is insane durability — never misses. 8.55 successful defensive actions/90. 47.09 passes/90 is elite CB volume. 3 header goals shows aerial dominance from set pieces. 7Y is the highest card count — physical player. Italian-born Romanian. The pass accuracy (91.68%) puts every other CB to shame. Serie C quality > Liga II quality. This might be the best pure CB on the entire board.",
    screenshots: [
      "cb-potop-overview-albinoleffe.png",
    ],
    hasVideo: true,
    estFee: "€100-200K",
    estSalary: "€3,500-5,000/mo",
    euPassport: true,
    tmUrl: "",
  },
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
  6: 'border-purple-500',
  7: 'border-cyan-500',
  8: 'border-pink-500',
  9: 'border-teal-500',
};

const RANK_BG: Record<number, string> = {
  1: 'bg-green-500/10',
  2: 'bg-blue-500/10',
  3: 'bg-orange-500/10',
  4: 'bg-yellow-500/10',
  5: 'bg-red-500/10',
  6: 'bg-purple-500/10',
  7: 'bg-cyan-500/10',
  8: 'bg-pink-500/10',
  9: 'bg-teal-500/10',
};

const RANK_NUM: Record<number, string> = {
  1: 'text-green-400',
  2: 'text-blue-400',
  3: 'text-orange-400',
  4: 'text-yellow-400',
  5: 'text-red-400',
  6: 'text-purple-400',
  7: 'text-cyan-400',
  8: 'text-pink-400',
  9: 'text-teal-400',
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
    // DM Liga 2 screenshots
    'dm-cararusi-interception-vs-afumati-36min.png': 'Interception vs Afumați 36\'',
    'dm-cararusi-interception-read-vs-afumati-36min.png': 'Reading Play vs Afumați 36\'',
    'dm-cararusi-defduels-vs-poliasi-3min.png': 'Defending Duel vs Poli Iași 3\'',
    'dm-cararusi-defduels-vs-poliasi-13min.png': 'Defending Duel vs Poli Iași 13\'',
    'dm-cararusi-header-goal-vs-gloriabistr-64min.png': 'Header Goal vs Gloria Bistrița 64\'',
    'dm-cararusi-passes-vs-poliasi-kickoff.png': 'Passing vs Poli Iași',
    'dm-cararusi-tackle-vs-slatina-91min.png': 'Tackle vs Slatina 91\' (protecting 1-0)',
    // DM SuperLiga screenshots
    'dm-sierra-interception-vs-petrolul-80min.png': 'Interception vs Petrolul 80\' (SuperLiga)',
    'dm-sierra-defduels-vs-petrolul-45min.png': 'Defending Duel vs Petrolul 45\' (SuperLiga)',
    'dm-sierra-passes-vs-petrolul-9min.png': 'Passing vs Petrolul 9\' (SuperLiga)',
    // Legacy DM screenshots
    'dm-dican-interception-vs-rapid-32min.png': 'Interception vs Rapid 32\'',
    'dm-dican-defending-duel-vs-petrolul-79min.png': 'Defending Duel vs Petrolul 79\'',
    'dm-dican-aerial-duel-vs-rapid-23min.png': 'Aerial Duel vs Rapid 23\'',
    'dm-sierra-tackle-vs-otelul-93min.png': 'Tackle vs Oțelul 93\'',
    'dm-sierra-positioning-vs-steaua-58min.png': 'Positioning vs Steaua 58\'',
    'dm-sierra-goal-vs-ucluj-65min.png': 'Goal vs U Cluj 65\'',
    'dm-sierra-passing-vs-petrolul-10min.png': 'Passing vs Petrolul 10\'',
    'dm-petro-interception-vs-uta-1min.png': 'Interception vs UTA 1\'',
    'dm-petro-defending-duel-vs-uta-35min.png': 'Defending Duel vs UTA 35\'',
    'dm-petro-passing-vs-uta-4min.png': 'Passing vs UTA 4\'',
    'dm-petro-goal-vs-hermannstadt-27min.png': 'Goal vs Hermannstadt 27\'',
    'dm-vegh-interception-vs-uta-22min.png': 'Interception vs UTA 22\'',
    'dm-vegh-defending-duel-vs-uta-12min.png': 'Defending Duel vs UTA 12\'',
    'dm-vegh-passing-vs-uta-3min.png': 'Passing vs UTA 3\'',
    'dm-vegh-aerial-duel-vs-botosani-35min.png': 'Aerial Duel vs Botoșani 35\'',
    // CB screenshots
    'cb-dinu-defending-duel-vs-farul-57min.png': 'Defending Duel vs Farul 57\'',
    'cb-dinu-interception-vs-dinamo-47min.png': 'Interception vs Dinamo 47\'',
    'cb-dinu-aerial-duel-vs-dinamo-58min.png': 'Aerial Duel vs Dinamo 58\'',
    'cb-dinu-clearance-vs-dinamo-47min.png': 'Clearance vs Dinamo 47\'',
    'cb-camara-interception-vs-csikszereda-25min.png': 'Interception vs Csikszereda 25\'',
    'cb-camara-1v1-defense-vs-arges-5min.png': '1v1 Defense vs Argeș 5\'',
    'cb-pasagic-interception-vs-cfr-39min.png': 'Interception vs CFR 39\'',
    'cb-pasagic-defending-duel-vs-cfr-42min.png': 'Defending Duel vs CFR 42\'',
    'cb-pasagic-aerial-duel-vs-arges-4min.png': 'Aerial Duel vs Argeș 4\'',
    'cb-pasagic-passing-vs-cfr-6min.png': 'Passing vs CFR 6\'',
    'cb-hegedus-interception-vs-liesti-52min.png': 'Interception vs Lieşti 52\'',
    'cb-hegedus-defending-duel-vs-rapid-9min.png': 'Defending Duel vs Rapid 9\'',
    'cb-hegedus-aerial-duel-vs-liesti-86min.png': 'Aerial Duel vs Lieşti 86\'',
    'cb-nelopes-interception-vs-metaloglobus-12min.png': 'Interception vs Metaloglobus 12\'',
    'cb-nelopes-defending-duel-vs-metaloglobus-48min.png': 'Defending Duel vs Metaloglobus 48\'',
    'cb-nelopes-aerial-duel-vs-metaloglobus-34min.png': 'Aerial Duel vs Metaloglobus 34\'',
    // CB Liga II screenshots
    'cb-apro-interception-vs-asatgmures-6min.png': 'Interception vs ASA Tg Mureș 6\'',
    'cb-apro-defduels-vs-asatgmures-19min.png': 'Defending Duel vs ASA Tg Mureș 19\'',
    'cb-apro-aerial-vs-asatgmures-49min.png': 'Aerial Duel vs ASA Tg Mureș 49\'',
    'cb-manea-interception-vs-scolarresita-42min.png': 'Interception vs Școlar Reșița 42\'',
    'cb-manea-defduels-vs-dinamo-22min.png': 'Defending Duel vs Dinamo 22\'',
    'cb-manea-defduels-vs-scolarresita-44min.png': 'Defending Duel vs Școlar Reșița 44\'',
    'cb-manea-aerial-vs-scolarresita-66min.png': 'Aerial Duel vs Școlar Reșița 66\'',
    'cb-manea-goal-vs-dumbravita-17min.png': 'Goal vs Dumbrăvița 17\'',
    'cb-panaite-interception-vs-arges-30min.png': 'Interception vs Argeș 30\'',
    'cb-panaite-defduels-vs-arges-13min.png': 'Defending Duel vs Argeș 13\'',
    'cb-panaite-aerial-vs-arges-13min.png': 'Aerial Duel vs Argeș 13\'',
    'cb-panaite-goal-vs-csmsatumare-16min.png': 'Goal vs CSM Satu Mare 16\'',
    'cb-panaite-passing-vs-arges-4min.png': 'Passing vs Argeș 4\'',
    'cb-baraitaru-interception-vs-metaloglobus-54min.png': 'Interception vs Metaloglobus 54\'',
    'cb-baraitaru-defduels-vs-metaloglobus-7min.png': 'Defending Duel vs Metaloglobus 7\'',
    'cb-baraitaru-aerial-vs-csmsatumare-32min.png': 'Aerial Duel vs CSM Satu Mare 32\'',
    'cb-baraitaru-goal-vs-csmsatumare-67min.png': 'Goal vs CSM Satu Mare 67\'',
    'cb-butnarasu-interception-vs-arges-87min.png': 'Interception vs Argeș 87\'',
    'cb-butnarasu-interception-vs-voluntari-31min.png': 'Interception vs Voluntari 31\'',
    'cb-butnarasu-defduels-vs-arges-87min.png': 'Defending Duel vs Argeș 87\'',
    'cb-butnarasu-aerial-vs-slatina-26min.png': 'Aerial Duel vs Slatina 26\'',
    'cb-butnarasu-goal-header-vs-selimbar-12min.png': 'Header Goal vs Șelimbăr 12\'',
    // CB Abroad screenshots
    'cb-motoc-defduels-vs-catania-00min.png': 'Defending Duel vs Catania (Serie C)',
    'cb-motoc-interception-vs-catania-05min.png': 'Interception vs Catania 5\' (Serie C)',
    'cb-motoc-aerial-vs-catania-14min.png': 'Aerial Duel vs Catania 14\' (Serie C)',
    'cb-motoc-goal-vs-giugliano-09min.png': 'Header Goal vs Giugliano 9\' (Serie C)',
    'cb-motoc-overview-trapani.png': 'Wyscout Profile — Trapani',
    'cb-dutu-overview-latina.png': 'Wyscout Profile — Latina',
    'cb-dumbravanu-defduels-vs-campulung-55min.png': 'Defending Duel vs Câmpulung 55\'',
    'cb-dumbravanu-interception-vs-campulung-09min.png': 'Interception vs Câmpulung 9\'',
    'cb-dumbravanu-aerial-vs-campulung-16min.png': 'Aerial Duel vs Câmpulung 16\'',
    'cb-dumbravanu-overview-voluntari.png': 'Wyscout Profile — Voluntari',
    'cb-potop-overview-albinoleffe.png': 'Wyscout Profile — AlbinoLeffe',
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

// ─── DM Comparison Table ─────────────────────────────────────────────────────

function DMComparisonTable() {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">📊 DM Quick Comparison</h2>
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
              <th className="px-3 py-2 text-center">Int/90</th>
              <th className="px-3 py-2 text-center">Def.D/90</th>
              <th className="px-3 py-2 text-center">Def.D W%</th>
              <th className="px-3 py-2 text-center">Pass/90</th>
              <th className="px-3 py-2 text-center">Pass%</th>
              <th className="px-3 py-2 text-center">Fouls/90</th>
              <th className="px-3 py-2 text-center">EU</th>
              <th className="px-3 py-2 text-right">Est. Fee</th>
              <th className="px-3 py-2 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {DM_TARGETS_DATA.map((t) => (
              <tr key={t.rank} className="hover:bg-zinc-700/20">
                <td className={`px-3 py-2 font-bold ${RANK_NUM[t.rank]}`}>{t.rank}</td>
                <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                  {t.nationality} {t.name}
                </td>
                <td className="px-3 py-2 text-center text-zinc-300">{t.age}</td>
                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{t.club}</td>
                <td className="px-3 py-2 text-center text-zinc-300">{t.apps}</td>
                <td className={`px-3 py-2 text-center font-mono ${t.dmMetrics.interceptionsP90 >= 5.5 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                  {t.dmMetrics.interceptionsP90.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.dmMetrics.defDuelsP90 >= 7.0 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                  {t.dmMetrics.defDuelsP90.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.dmMetrics.defDuelsWonPct >= 65 ? 'text-green-400' : 'text-zinc-300'}`}>
                  {t.dmMetrics.defDuelsWonPct.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-center font-mono text-zinc-300">{t.dmMetrics.passesP90.toFixed(1)}</td>
                <td className={`px-3 py-2 text-center font-mono ${t.dmMetrics.passAccPct >= 82 ? 'text-green-400' : 'text-zinc-300'}`}>
                  {t.dmMetrics.passAccPct.toFixed(1)}%
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.dmMetrics.foulsP90 <= 1.0 ? 'text-green-400' : t.dmMetrics.foulsP90 >= 2.0 ? 'text-red-400' : 'text-zinc-300'}`}>
                  {t.dmMetrics.foulsP90.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">{t.euPassport ? '✅' : '❌'}</td>
                <td className="px-3 py-2 text-right text-zinc-300 whitespace-nowrap">{t.estFee}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getVerdictStyle(t.verdict)}`}>
                    {t.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── CB Comparison Table ─────────────────────────────────────────────────────

function CBComparisonTable() {
  return (
    <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">📊 CB Quick Comparison</h2>
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
              <th className="px-3 py-2 text-center">Aerial/90</th>
              <th className="px-3 py-2 text-center">Aerial W%</th>
              <th className="px-3 py-2 text-center">Def.D W%</th>
              <th className="px-3 py-2 text-center">Int/90</th>
              <th className="px-3 py-2 text-center">Pass%</th>
              <th className="px-3 py-2 text-center">Fouls/90</th>
              <th className="px-3 py-2 text-center">EU</th>
              <th className="px-3 py-2 text-right">Est. Fee</th>
              <th className="px-3 py-2 text-center">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-700/50">
            {CB_TARGETS_DATA.map((t) => (
              <tr key={t.rank} className="hover:bg-zinc-700/20">
                <td className={`px-3 py-2 font-bold ${RANK_NUM[t.rank]}`}>{t.rank}</td>
                <td className="px-3 py-2 font-medium text-white whitespace-nowrap">
                  {t.nationality} {t.name}
                </td>
                <td className="px-3 py-2 text-center text-zinc-300">{t.age}</td>
                <td className="px-3 py-2 text-zinc-400 whitespace-nowrap">{t.club}</td>
                <td className="px-3 py-2 text-center text-zinc-300">{t.apps}</td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.aerialDuelsP90 >= 3.5 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                  {t.cbMetrics.aerialDuelsP90.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.aerialWonPct >= 55 ? 'text-green-400' : 'text-zinc-300'}`}>
                  {t.cbMetrics.aerialWonPct.toFixed(1)}%
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.defDuelsWonPct >= 70 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                  {t.cbMetrics.defDuelsWonPct.toFixed(1)}%
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.interceptionsP90 >= 5.5 ? 'text-green-400 font-bold' : 'text-zinc-300'}`}>
                  {t.cbMetrics.interceptionsP90.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.passAccPct >= 85 ? 'text-green-400' : 'text-zinc-300'}`}>
                  {t.cbMetrics.passAccPct.toFixed(1)}%
                </td>
                <td className={`px-3 py-2 text-center font-mono ${t.cbMetrics.foulsP90 <= 0.6 ? 'text-green-400' : 'text-zinc-300'}`}>
                  {t.cbMetrics.foulsP90.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-center">{t.euPassport ? '✅' : '❌'}</td>
                <td className="px-3 py-2 text-right text-zinc-300 whitespace-nowrap">{t.estFee}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${getVerdictStyle(t.verdict)}`}>
                    {t.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DM Player Card (position-specific header stats) ─────────────────────────

function DMPlayerCard({ target }: { target: TargetPlayer & { dmMetrics: DMMetrics } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border-l-4 ${RANK_BORDER[target.rank]} ${RANK_BG[target.rank]} bg-zinc-800/80 overflow-hidden transition-all`}
    >
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
              <h3 className="text-lg font-bold text-white truncate">
                {target.nationality} {target.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {target.age}y · {target.position} · {target.club} · {target.height}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <StatCell label="Int/90" value={target.dmMetrics.interceptionsP90.toFixed(2)} highlight={target.dmMetrics.interceptionsP90 >= 5.5} />
            <StatCell label="Def.D/90" value={target.dmMetrics.defDuelsP90.toFixed(2)} highlight={target.dmMetrics.defDuelsP90 >= 7.0} />
            <StatCell label="Def W%" value={`${target.dmMetrics.defDuelsWonPct.toFixed(0)}%`} highlight={target.dmMetrics.defDuelsWonPct >= 65} />
            <StatCell label="Pass%" value={`${target.dmMetrics.passAccPct.toFixed(0)}%`} />

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

      {expanded && (
        <div className="border-t border-zinc-700/50 px-4 py-4 sm:px-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Defensive Metrics (Wyscout)</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Appearances</span><span className="text-white">{target.apps}</span>
                <span className="text-zinc-500">Minutes</span><span className="text-white">{target.minutes}</span>
                <span className="text-zinc-500">Interceptions/90</span>
                <span className={`font-bold ${target.dmMetrics.interceptionsP90 >= 5.5 ? 'text-green-400' : 'text-white'}`}>{target.dmMetrics.interceptionsP90.toFixed(2)}</span>
                <span className="text-zinc-500">Def. Duels/90</span>
                <span className={`font-bold ${target.dmMetrics.defDuelsP90 >= 7.0 ? 'text-green-400' : 'text-white'}`}>{target.dmMetrics.defDuelsP90.toFixed(2)}</span>
                <span className="text-zinc-500">Def. Duels Won%</span>
                <span className={`${target.dmMetrics.defDuelsWonPct >= 65 ? 'text-green-400' : 'text-white'}`}>{target.dmMetrics.defDuelsWonPct.toFixed(1)}%</span>
                <span className="text-zinc-500">Passes/90</span><span className="text-white">{target.dmMetrics.passesP90.toFixed(1)}</span>
                <span className="text-zinc-500">Pass Accuracy%</span>
                <span className={`${target.dmMetrics.passAccPct >= 82 ? 'text-green-400' : 'text-white'}`}>{target.dmMetrics.passAccPct.toFixed(1)}%</span>
                <span className="text-zinc-500">Fouls/90</span>
                <span className={`${target.dmMetrics.foulsP90 >= 2.0 ? 'text-red-400' : target.dmMetrics.foulsP90 <= 1.0 ? 'text-green-400' : 'text-white'}`}>{target.dmMetrics.foulsP90.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Financial Estimate</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Transfer Fee</span><span className="text-white font-bold">{target.estFee}</span>
                <span className="text-zinc-500">Salary</span><span className="text-white">{target.estSalary}</span>
              </div>
              {target.tmUrl && (
                <a href={target.tmUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  Transfermarkt ↗
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">⚽ Scout Evaluation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.physical.title} attrs={ATTRIBUTE_CATEGORIES.physical.attrs} target={target} />
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.technique.title} attrs={ATTRIBUTE_CATEGORIES.technique.attrs} target={target} />
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.tactic.title} attrs={ATTRIBUTE_CATEGORIES.tactic.attrs} target={target} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Ability</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.ability)}`}>{target.ability}</span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.ability] || '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Potential</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.potential)}`}>{target.potential}</span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.potential] || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Scouting Tags</h4>
            <div className="flex flex-wrap gap-2">
              {target.scoutingTags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-zinc-700 text-zinc-200 rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Verdict</h4>
            <span className={`inline-block px-5 py-2 rounded-lg text-sm font-bold ${getVerdictStyle(target.verdict)}`}>{target.verdict}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Role</h4>
            <p className="text-sm text-white font-medium">{target.role}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Conclusion</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{target.conclusion}</p>
          </div>

          {target.notes && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Notes</h4>
              <p className="text-sm text-zinc-500 leading-relaxed italic">{target.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CB Player Card (position-specific header stats) ─────────────────────────

function CBPlayerCard({ target }: { target: TargetPlayer & { cbMetrics: CBMetrics } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border-l-4 ${RANK_BORDER[target.rank]} ${RANK_BG[target.rank]} bg-zinc-800/80 overflow-hidden transition-all`}
    >
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
              <h3 className="text-lg font-bold text-white truncate">
                {target.nationality} {target.name}
              </h3>
              <p className="text-xs text-zinc-400 truncate">
                {target.age}y · {target.position} · {target.club} · {target.height} · {target.foot} foot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            <StatCell label="Aerial/90" value={target.cbMetrics.aerialDuelsP90.toFixed(2)} highlight={target.cbMetrics.aerialDuelsP90 >= 3.5} />
            <StatCell label="Aerial W%" value={`${target.cbMetrics.aerialWonPct.toFixed(0)}%`} highlight={target.cbMetrics.aerialWonPct >= 55} />
            <StatCell label="Def W%" value={`${target.cbMetrics.defDuelsWonPct.toFixed(0)}%`} highlight={target.cbMetrics.defDuelsWonPct >= 70} />
            <StatCell label="Int/90" value={target.cbMetrics.interceptionsP90.toFixed(2)} highlight={target.cbMetrics.interceptionsP90 >= 5.5} />

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

      {expanded && (
        <div className="border-t border-zinc-700/50 px-4 py-4 sm:px-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Defensive Metrics (Wyscout)</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Appearances</span><span className="text-white">{target.apps}</span>
                <span className="text-zinc-500">Minutes</span><span className="text-white">{target.minutes}</span>
                <span className="text-zinc-500">Aerial Duels/90</span>
                <span className={`font-bold ${target.cbMetrics.aerialDuelsP90 >= 3.5 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.aerialDuelsP90.toFixed(2)}</span>
                <span className="text-zinc-500">Aerial Won%</span>
                <span className={`${target.cbMetrics.aerialWonPct >= 55 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.aerialWonPct.toFixed(1)}%</span>
                <span className="text-zinc-500">Def. Duels Won%</span>
                <span className={`font-bold ${target.cbMetrics.defDuelsWonPct >= 70 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.defDuelsWonPct.toFixed(1)}%</span>
                <span className="text-zinc-500">Interceptions/90</span>
                <span className={`${target.cbMetrics.interceptionsP90 >= 5.5 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.interceptionsP90.toFixed(2)}</span>
                <span className="text-zinc-500">Pass Accuracy%</span>
                <span className={`${target.cbMetrics.passAccPct >= 85 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.passAccPct.toFixed(1)}%</span>
                <span className="text-zinc-500">Fouls/90</span>
                <span className={`${target.cbMetrics.foulsP90 <= 0.6 ? 'text-green-400' : 'text-white'}`}>{target.cbMetrics.foulsP90.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-zinc-900/50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Financial Estimate</h4>
              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <span className="text-zinc-500">Transfer Fee</span><span className="text-white font-bold">{target.estFee}</span>
                <span className="text-zinc-500">Salary</span><span className="text-white">{target.estSalary}</span>
              </div>
              {target.tmUrl && (
                <a href={target.tmUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                  Transfermarkt ↗
                </a>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3">⚽ Scout Evaluation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.physical.title} attrs={ATTRIBUTE_CATEGORIES.physical.attrs} target={target} />
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.technique.title} attrs={ATTRIBUTE_CATEGORIES.technique.attrs} target={target} />
              <AttributeGrid title={ATTRIBUTE_CATEGORIES.tactic.title} attrs={ATTRIBUTE_CATEGORIES.tactic.attrs} target={target} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Ability</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.ability)}`}>{target.ability}</span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.ability] || '—'}</span>
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4 flex items-center gap-4">
              <div>
                <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Potential</h4>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-xl font-black ${getPotentialColor(target.potential)}`}>{target.potential}</span>
                  <span className="text-sm text-zinc-300">{POTENTIAL_LABELS[target.potential] || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Scouting Tags</h4>
            <div className="flex flex-wrap gap-2">
              {target.scoutingTags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-zinc-700 text-zinc-200 rounded-full text-xs font-medium">{tag}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Verdict</h4>
            <span className={`inline-block px-5 py-2 rounded-lg text-sm font-bold ${getVerdictStyle(target.verdict)}`}>{target.verdict}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Role</h4>
            <p className="text-sm text-white font-medium">{target.role}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Conclusion</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{target.conclusion}</p>
          </div>

          {target.notes && (
            <div>
              <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-1">Notes</h4>
              <p className="text-sm text-zinc-500 leading-relaxed italic">{target.notes}</p>
            </div>
          )}

          {/* ── Screenshots gallery ── */}
          {target.screenshots.length > 0 && (
            <ScreenshotGallery screenshots={target.screenshots} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const TAB_CONFIG: Record<PositionTab, { label: string; emoji: string; title: string }> = {
  strikers: { label: 'Strikers', emoji: '⚽', title: '🎯 Transfer Targets — Striker Shortlist' },
  dms: { label: 'DMs', emoji: '🛡️', title: '🎯 Transfer Targets — Defensive Midfield Shortlist' },
  cbs: { label: 'CBs', emoji: '🧱', title: '🎯 Transfer Targets — Centre-Back Shortlist' },
};

export default function TargetsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<PositionTab>('strikers');

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') redirect('/');
  }, [status, session]);

  if (status === 'loading') {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><div className="text-zinc-400">Loading...</div></div>;
  }
  if (session?.user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 py-5 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{TAB_CONFIG[activeTab].title}</h1>
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
        {/* ─── Position Tab Navigation ─── */}
        <div className="flex gap-1 bg-zinc-900 rounded-xl p-1 border border-zinc-800 w-fit">
          {(Object.keys(TAB_CONFIG) as PositionTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {TAB_CONFIG[tab].emoji} {TAB_CONFIG[tab].label}
            </button>
          ))}
        </div>

        {/* ─── Striker Tab (existing, untouched) ─── */}
        {activeTab === 'strikers' && (
          <>
            <ComparisonTable />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                Detailed Scout Reports — Click to Expand
              </h2>
              {TARGETS_DATA.map((target) => (
                <PlayerCard key={target.rank} target={target} />
              ))}
            </div>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500 space-y-1">
              <p><strong className="text-zinc-400">Methodology:</strong> All per-90 stats calculated from Wyscout data. xG from Wyscout model. Market values from Transfermarkt. Scout evaluations use FCB standard grading template.</p>
              <p><strong className="text-zinc-400">Recommendation:</strong> Pursue Bajraj immediately (€0-25k, EU passport, 1.04 G/90). Monitor Van der Leij as aspirational target. Ndiaye as Plan B if non-EU slot available.</p>
              <p><strong className="text-zinc-400">Budget context:</strong> FC Bacău estimated transfer budget: €50-150k total. Salary budget for new striker: €3,000-5,000/mo.</p>
            </div>
          </>
        )}

        {/* ─── DM Tab ─── */}
        {activeTab === 'dms' && (
          <>
            <DMComparisonTable />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                DM Scout Reports — Click to Expand
              </h2>
              {DM_TARGETS_DATA.map((target) => (
                <DMPlayerCard key={target.rank} target={target} />
              ))}
            </div>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500 space-y-1">
              <p><strong className="text-zinc-400">Methodology:</strong> All per-90 stats from Wyscout V2 (Romania SuperLiga 2025/26). Defensive metrics prioritised for DM evaluation. Scout evaluations from film-based scouting reports.</p>
              <p><strong className="text-zinc-400">Recommendation:</strong> Priority signing: Dican (Romanian, physical monster) or Sierra (potentially FREE, elite positioning). Petro as non-EU alternative if slot available. Observe Végh as budget fallback.</p>
              <p><strong className="text-zinc-400">Budget context:</strong> Sierra may be FREE (expired contract). Dican ~€100-200K. Petro ~€200-350K. Végh free in summer 2026.</p>
            </div>
          </>
        )}

        {/* ─── CB Tab ─── */}
        {activeTab === 'cbs' && (
          <>
            <CBComparisonTable />
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">
                CB Scout Reports — Click to Expand
              </h2>
              {CB_TARGETS_DATA.map((target) => (
                <CBPlayerCard key={target.rank} target={target} />
              ))}
            </div>
            <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 text-xs text-zinc-500 space-y-1">
              <p><strong className="text-zinc-400">Methodology:</strong> All per-90 stats from Wyscout V2 (Romania SuperLiga 2025/26). Aerial and defensive duel metrics prioritised for CB evaluation. Scout evaluations from film-based scouting reports.</p>
              <p><strong className="text-zinc-400">Recommendation:</strong> Priority signing: Dinu (Romanian, elite duels, expiring). Camara as elite interceptor. Pašagić as FREE left-footed CB. Metaloglobus pair (Camara + Pašagić) could be a ~€150K package deal.</p>
              <p><strong className="text-zinc-400">Budget context:</strong> Dinu: FREE or €50-100K. Camara: €100-150K. Pašagić: FREE. Hegedűs: FREE (summer). Né Lopes: €150-250K (most expensive).</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
