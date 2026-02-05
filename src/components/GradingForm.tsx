'use client';

import { useState } from 'react';
import {
  saveGrade,
  PlayerGrade,
  POTENTIAL_LABELS,
  REPORT_LABELS,
  ABILITY_LABELS,
  ATTRIBUTE_CATEGORIES,
  SCOUTING_TAG_CATEGORIES,
  VERDICT_OPTIONS,
  AVAILABLE_TAGS,
  getAttributeColor,
  getPotentialColor,
  Status,
  Verdict,
  ScoutingLevel,
  AttributeRating,
  PotentialRating,
} from '@/lib/grades';

interface GradingFormProps {
  player: {
    id: string;
    name: string;
    position: string;
    club: string;
  };
  existingGrade?: PlayerGrade;
  onSave: () => void;
}

// ─── Rating Badge (1-5 scale) ───────────────────────────────────────

function AttributeBadge({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getAttributeColor(value)}`}>
      {value}
    </span>
  );
}

// ─── Rating Selector (1-5) ──────────────────────────────────────────

function RatingSelect5({
  label,
  value,
  onChange,
}: {
  label: string;
  value: AttributeRating;
  onChange: (val: AttributeRating) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-700/50 last:border-0">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4, 5] as AttributeRating[]).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
              value === n
                ? getAttributeColor(n)
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Rating Selector (1-8 for Potential) ────────────────────────────

function RatingSelect8({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PotentialRating;
  onChange: (val: PotentialRating) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-700/50 last:border-0">
      <span className="text-sm text-zinc-300">{label}</span>
      <div className="flex items-center gap-1">
        {([1, 2, 3, 4, 5, 6, 7, 8] as PotentialRating[]).map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-7 h-8 rounded text-xs font-bold transition-colors ${
              value === n
                ? getPotentialColor(n)
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-zinc-600 pb-2 mb-2">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────

export function GradingForm({ player, existingGrade, onSave }: GradingFormProps) {
  // Status
  const [status, setStatus] = useState<Status>(existingGrade?.status || 'WATCH');
  const [scoutingLevel, setScoutingLevel] = useState<ScoutingLevel>(existingGrade?.scoutingLevel || 'Basic');

  // Ability & Potential
  const [ability, setAbility] = useState<AttributeRating>(existingGrade?.ability || 3);
  const [potential, setPotential] = useState<PotentialRating>(existingGrade?.potential || 4);

  // Report (FCB Scale)
  const [report, setReport] = useState<AttributeRating>(existingGrade?.report || 3);

  // Physical (1-5)
  const [physStrength, setPhysStrength] = useState<AttributeRating>(existingGrade?.physStrength || 3);
  const [physSpeed, setPhysSpeed] = useState<AttributeRating>(existingGrade?.physSpeed || 3);
  const [physAgility, setPhysAgility] = useState<AttributeRating>(existingGrade?.physAgility || 3);
  const [physCoordination, setPhysCoordination] = useState<AttributeRating>(existingGrade?.physCoordination || 3);

  // Technique (1-5)
  const [techControl, setTechControl] = useState<AttributeRating>(existingGrade?.techControl || 3);
  const [techShortPasses, setTechShortPasses] = useState<AttributeRating>(existingGrade?.techShortPasses || 3);
  const [techLongPasses, setTechLongPasses] = useState<AttributeRating>(existingGrade?.techLongPasses || 3);
  const [techAerial, setTechAerial] = useState<AttributeRating>(existingGrade?.techAerial || 3);
  const [techCrossing, setTechCrossing] = useState<AttributeRating>(existingGrade?.techCrossing || 3);
  const [techFinishing, setTechFinishing] = useState<AttributeRating>(existingGrade?.techFinishing || 3);
  const [techDribbling, setTechDribbling] = useState<AttributeRating>(existingGrade?.techDribbling || 3);
  const [techOneVsOneOffense, setTechOneVsOneOffense] = useState<AttributeRating>(existingGrade?.techOneVsOneOffense || 3);
  const [techOneVsOneDefense, setTechOneVsOneDefense] = useState<AttributeRating>(existingGrade?.techOneVsOneDefense || 3);

  // Tactic (1-5)
  const [tacPositioning, setTacPositioning] = useState<AttributeRating>(existingGrade?.tacPositioning || 3);
  const [tacTransition, setTacTransition] = useState<AttributeRating>(existingGrade?.tacTransition || 3);
  const [tacDecisions, setTacDecisions] = useState<AttributeRating>(existingGrade?.tacDecisions || 3);
  const [tacAnticipations, setTacAnticipations] = useState<AttributeRating>(existingGrade?.tacAnticipations || 3);
  const [tacDuels, setTacDuels] = useState<AttributeRating>(existingGrade?.tacDuels || 3);
  const [tacSetPieces, setTacSetPieces] = useState<AttributeRating>(existingGrade?.tacSetPieces || 3);

  // Scouting Tags (3 max)
  const [scoutingTags, setScoutingTags] = useState<string[]>(existingGrade?.scoutingTags || []);

  // Strengths & Weaknesses
  const [strengths, setStrengths] = useState<string[]>(existingGrade?.strengths || []);
  const [weaknesses, setWeaknesses] = useState<string[]>(existingGrade?.weaknesses || []);

  // Verdict
  const [verdict, setVerdict] = useState<Verdict>(existingGrade?.verdict || 'Monitor');

  // Role, Conclusion, Notes
  const [role, setRole] = useState<string>(existingGrade?.role || '');
  const [conclusion, setConclusion] = useState<string>(existingGrade?.conclusion || '');
  const [notes, setNotes] = useState<string>(existingGrade?.notes || '');
  const [transferFee, setTransferFee] = useState<string>(existingGrade?.transferFee || '');
  const [salary, setSalary] = useState<string>(existingGrade?.salary || '');

  const [showSuccess, setShowSuccess] = useState(false);

  // Toggle scouting tag (max 3)
  const toggleScoutingTag = (tag: string) => {
    if (scoutingTags.includes(tag)) {
      setScoutingTags(scoutingTags.filter(t => t !== tag));
    } else if (scoutingTags.length < 3) {
      setScoutingTags([...scoutingTags, tag]);
    }
  };

  const toggleTag = (tag: string, list: string[], setList: (tags: string[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  const handleSave = () => {
    const grade: PlayerGrade = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      club: player.club,
      gradedAt: new Date().toISOString(),
      status,
      scoutingLevel,
      ability,
      potential,
      report,
      physStrength, physSpeed, physAgility, physCoordination,
      techControl, techShortPasses, techLongPasses, techAerial,
      techCrossing, techFinishing, techDribbling, techOneVsOneOffense, techOneVsOneDefense,
      tacPositioning, tacTransition, tacDecisions, tacAnticipations, tacDuels, tacSetPieces,
      scoutingTags,
      strengths,
      weaknesses,
      verdict,
      role,
      conclusion,
      notes,
      transferFee: transferFee || undefined,
      salary: salary || undefined,
    };

    saveGrade(grade);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onSave();
  };

  return (
    <div className="space-y-6">

      {/* ─── Status & Level ─── */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white">
            <option value="FM">FM (First Team)</option>
            <option value="U23">U23</option>
            <option value="LOAN">LOAN</option>
            <option value="WATCH">WATCH</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Scouting Level</label>
          <select value={scoutingLevel} onChange={(e) => setScoutingLevel(e.target.value as ScoutingLevel)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white">
            <option value="Basic">Basic</option>
            <option value="Impressive">Impressive</option>
            <option value="Data only">Data only</option>
          </select>
        </div>
      </div>

      {/* ─── Ability (1-5) & Potential (1-8) ─── */}
      <div className="space-y-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <SectionHeader title="Ability & Potential" />
        <RatingSelect5 label="Ability (1-5)" value={ability} onChange={setAbility} />
        <RatingSelect8 label="Potential (1-8)" value={potential} onChange={setPotential} />

        {/* Potential scale reference */}
        <div className="mt-3 pt-3 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-1">Potential Scale</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(POTENTIAL_LABELS).map(([num, label]) => (
              <div key={num} className="text-zinc-400">
                <span className="font-medium text-zinc-300">{num}</span> = {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Report (FCB Scale 1-5) ─── */}
      <div className="space-y-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <SectionHeader title="Report" subtitle="FCB Standard (1-5)" />
        <RatingSelect5 label="Report Rating" value={report} onChange={setReport} />
        <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
          {Object.entries(REPORT_LABELS).map(([num, label]) => (
            <div key={num} className="text-zinc-400">
              <span className="font-medium text-zinc-300">{num}</span> = {label}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Physical Attributes (1-5) ─── */}
      <div className="space-y-2">
        <SectionHeader title="Physical" subtitle="Attributes (1-5)" />
        <RatingSelect5 label="Strength" value={physStrength} onChange={setPhysStrength} />
        <RatingSelect5 label="Speed" value={physSpeed} onChange={setPhysSpeed} />
        <RatingSelect5 label="Agility" value={physAgility} onChange={setPhysAgility} />
        <RatingSelect5 label="Coordination" value={physCoordination} onChange={setPhysCoordination} />
      </div>

      {/* ─── Technique Attributes (1-5) ─── */}
      <div className="space-y-2">
        <SectionHeader title="Technique" subtitle="Attributes (1-5)" />
        <RatingSelect5 label="Control" value={techControl} onChange={setTechControl} />
        <RatingSelect5 label="Short passes" value={techShortPasses} onChange={setTechShortPasses} />
        <RatingSelect5 label="Long passes" value={techLongPasses} onChange={setTechLongPasses} />
        <RatingSelect5 label="Aerial" value={techAerial} onChange={setTechAerial} />
        <RatingSelect5 label="Crossing" value={techCrossing} onChange={setTechCrossing} />
        <RatingSelect5 label="Finishing" value={techFinishing} onChange={setTechFinishing} />
        <RatingSelect5 label="Dribbling" value={techDribbling} onChange={setTechDribbling} />
        <RatingSelect5 label="1v1 Offensive" value={techOneVsOneOffense} onChange={setTechOneVsOneOffense} />
        <RatingSelect5 label="1v1 Defensive" value={techOneVsOneDefense} onChange={setTechOneVsOneDefense} />
      </div>

      {/* ─── Tactic Attributes (1-5) ─── */}
      <div className="space-y-2">
        <SectionHeader title="Tactic" subtitle="Attributes (1-5)" />
        <RatingSelect5 label="Positioning" value={tacPositioning} onChange={setTacPositioning} />
        <RatingSelect5 label="Transition" value={tacTransition} onChange={setTacTransition} />
        <RatingSelect5 label="Decisions" value={tacDecisions} onChange={setTacDecisions} />
        <RatingSelect5 label="Anticipations" value={tacAnticipations} onChange={setTacAnticipations} />
        <RatingSelect5 label="Duels" value={tacDuels} onChange={setTacDuels} />
        <RatingSelect5 label="Set pieces" value={tacSetPieces} onChange={setTacSetPieces} />
      </div>

      {/* ─── Scouting Tags (3 max) ─── */}
      <div className="space-y-4">
        <SectionHeader
          title="Scouting Tags"
          subtitle={`Select up to 3 key traits (${scoutingTags.length}/3)`}
        />
        {Object.entries(SCOUTING_TAG_CATEGORIES).map(([catKey, category]) => (
          <div key={catKey}>
            <p className="text-xs font-medium text-zinc-400 mb-2">{category.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleScoutingTag(tag)}
                  disabled={!scoutingTags.includes(tag) && scoutingTags.length >= 3}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    scoutingTags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : scoutingTags.length >= 3
                        ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                        : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
        {scoutingTags.length > 0 && (
          <p className="text-xs text-blue-400">Selected: {scoutingTags.join(', ')}</p>
        )}
      </div>

      {/* ─── Strengths & Weaknesses ─── */}
      <div className="space-y-4">
        <SectionHeader title="Strengths & Weaknesses" />
        <div>
          <label className="block text-xs text-zinc-500 mb-2">Strengths</label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS.map(tag => (
              <button key={`str-${tag}`} type="button"
                onClick={() => toggleTag(tag, strengths, setStrengths)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  strengths.includes(tag) ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-2">Weaknesses</label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS.map(tag => (
              <button key={`wk-${tag}`} type="button"
                onClick={() => toggleTag(tag, weaknesses, setWeaknesses)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  weaknesses.includes(tag) ? 'bg-red-600 text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Verdict ─── */}
      <div className="space-y-2">
        <SectionHeader title="Verdict" />
        <div className="flex flex-wrap gap-2">
          {VERDICT_OPTIONS.map(opt => (
            <button key={opt.value} type="button"
              onClick={() => setVerdict(opt.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                verdict === opt.value
                  ? `${opt.color} text-white`
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {opt.value}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Role ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Role</label>
        <input type="text" value={role} onChange={(e) => setRole(e.target.value)}
          placeholder="e.g. Box-to-box midfielder, False 9, Inverted fullback..."
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
      </div>

      {/* ─── Conclusion ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Conclusion</label>
        <textarea value={conclusion} onChange={(e) => setConclusion(e.target.value)}
          placeholder="Overall assessment, fit for the team, recommendation details..."
          rows={4}
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white resize-none" />
      </div>

      {/* ─── Notes ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional observations, match context..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white resize-none" />
      </div>

      {/* ─── Transfer Info ─── */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Transfer Fee (est.)</label>
          <input type="text" value={transferFee} onChange={(e) => setTransferFee(e.target.value)}
            placeholder="€500k - €1M"
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Salary (est.)</label>
          <input type="text" value={salary} onChange={(e) => setSalary(e.target.value)}
            placeholder="€3k/month"
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
        </div>
      </div>

      {/* ─── Save ─── */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-700">
        <button type="button" onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
          {existingGrade ? 'Update Grade' : 'Save Grade'}
        </button>
        {showSuccess && (
          <span className="text-green-400 text-sm">✓ Grade saved</span>
        )}
      </div>
    </div>
  );
}
