'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  saveGrade,
  saveGradeAsync,
  PlayerGrade,
  POTENTIAL_LABELS,
  REPORT_LABELS,
  SCOUTING_TAG_CATEGORIES,
  VERDICT_OPTIONS,
  getAbilityColor,
  getPotentialColor,
  Status,
  Verdict,
  ScoutingLevel,
  AbilityRating,
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

// ─── Compact Badge with ▲▼ arrows (1-5) ────────────────────────────

function AbilityBadge({ value, onChange }: { value: AbilityRating; onChange: (v: AbilityRating) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getAbilityColor(value)}`}>
        {value}
      </span>
      <div className="flex flex-col">
        <button type="button" onClick={() => value < 5 && onChange((value + 1) as AbilityRating)}
          className="px-1 py-0 text-xs text-zinc-400 hover:text-white leading-none">▲</button>
        <button type="button" onClick={() => value > 1 && onChange((value - 1) as AbilityRating)}
          className="px-1 py-0 text-xs text-zinc-400 hover:text-white leading-none">▼</button>
      </div>
    </div>
  );
}

// ─── Compact Badge with ▲▼ arrows (1-8) ────────────────────────────

function PotentialBadge({ value, onChange }: { value: PotentialRating; onChange: (v: PotentialRating) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getPotentialColor(value)}`}>
        {value}
      </span>
      <div className="flex flex-col">
        <button type="button" onClick={() => value < 8 && onChange((value + 1) as PotentialRating)}
          className="px-1 py-0 text-xs text-zinc-400 hover:text-white leading-none">▲</button>
        <button type="button" onClick={() => value > 1 && onChange((value - 1) as PotentialRating)}
          className="px-1 py-0 text-xs text-zinc-400 hover:text-white leading-none">▼</button>
      </div>
    </div>
  );
}

// ─── Attribute Row: Label + single Ability badge ────────────────────

function AttributeRow({ label, value, onChange }: {
  label: string;
  value: AbilityRating;
  onChange: (val: AbilityRating) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-700/50 last:border-0">
      <span className="text-sm text-zinc-300">{label}</span>
      <AbilityBadge value={value} onChange={onChange} />
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────

export function GradingForm({ player, existingGrade, onSave }: GradingFormProps) {
  const { data: session } = useSession();
  const e = existingGrade;

  // Status
  const [status, setStatus] = useState<Status>(e?.status || 'WATCH');
  const [scoutingLevel, setScoutingLevel] = useState<ScoutingLevel>(e?.scoutingLevel || 'Basic');

  // Report
  const [report, setReport] = useState<AbilityRating>(e?.report ?? 3);

  // Physical (1-5)
  const [physStrength, setPhysStrength] = useState<AbilityRating>(e?.physStrength ?? 3);
  const [physSpeed, setPhysSpeed] = useState<AbilityRating>(e?.physSpeed ?? 3);
  const [physAgility, setPhysAgility] = useState<AbilityRating>(e?.physAgility ?? 3);
  const [physCoordination, setPhysCoordination] = useState<AbilityRating>(e?.physCoordination ?? 3);

  // Technique (1-5)
  const [techControl, setTechControl] = useState<AbilityRating>(e?.techControl ?? 3);
  const [techShortPasses, setTechShortPasses] = useState<AbilityRating>(e?.techShortPasses ?? 3);
  const [techLongPasses, setTechLongPasses] = useState<AbilityRating>(e?.techLongPasses ?? 3);
  const [techAerial, setTechAerial] = useState<AbilityRating>(e?.techAerial ?? 3);
  const [techCrossing, setTechCrossing] = useState<AbilityRating>(e?.techCrossing ?? 3);
  const [techFinishing, setTechFinishing] = useState<AbilityRating>(e?.techFinishing ?? 3);
  const [techDribbling, setTechDribbling] = useState<AbilityRating>(e?.techDribbling ?? 3);
  const [techOneVsOneOffense, setTechOneVsOneOffense] = useState<AbilityRating>(e?.techOneVsOneOffense ?? 3);
  const [techOneVsOneDefense, setTechOneVsOneDefense] = useState<AbilityRating>(e?.techOneVsOneDefense ?? 3);

  // Tactic (1-5)
  const [tacPositioning, setTacPositioning] = useState<AbilityRating>(e?.tacPositioning ?? 3);
  const [tacTransition, setTacTransition] = useState<AbilityRating>(e?.tacTransition ?? 3);
  const [tacDecisions, setTacDecisions] = useState<AbilityRating>(e?.tacDecisions ?? 3);
  const [tacAnticipations, setTacAnticipations] = useState<AbilityRating>(e?.tacAnticipations ?? 3);
  const [tacDuels, setTacDuels] = useState<AbilityRating>(e?.tacDuels ?? 3);
  const [tacSetPieces, setTacSetPieces] = useState<AbilityRating>(e?.tacSetPieces ?? 3);

  // Overall Scores (both 1-8)
  const [ability, setAbility] = useState<PotentialRating>(e?.ability ?? 4);
  const [potential, setPotential] = useState<PotentialRating>(e?.potential ?? 4);

  // Scouting Tags (3 max)
  const [scoutingTags, setScoutingTags] = useState<string[]>(e?.scoutingTags || []);

  // Verdict
  const [verdict, setVerdict] = useState<Verdict>(e?.verdict || 'Monitor');

  // Text fields
  const [role, setRole] = useState<string>(e?.role || '');
  const [conclusion, setConclusion] = useState<string>(e?.conclusion || '');
  const [notes, setNotes] = useState<string>(e?.notes || '');
  const [transferFee, setTransferFee] = useState<string>(e?.transferFee || '');
  const [salary, setSalary] = useState<string>(e?.salary || '');

  const [showSuccess, setShowSuccess] = useState(false);

  // Scout name from session
  const scoutName = session?.user?.name || e?.scoutName || '';

  const toggleScoutingTag = (tag: string) => {
    if (scoutingTags.includes(tag)) {
      setScoutingTags(scoutingTags.filter(t => t !== tag));
    } else if (scoutingTags.length < 3) {
      setScoutingTags([...scoutingTags, tag]);
    }
  };

  const handleSave = () => {
    const grade: PlayerGrade = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      club: player.club,
      gradedAt: new Date().toISOString(),
      status, scoutingLevel, report,
      physStrength, physSpeed, physAgility, physCoordination,
      techControl, techShortPasses, techLongPasses, techAerial,
      techCrossing, techFinishing, techDribbling, techOneVsOneOffense, techOneVsOneDefense,
      tacPositioning, tacTransition, tacDecisions, tacAnticipations, tacDuels, tacSetPieces,
      ability, potential,
      scoutingTags, verdict, role, conclusion, notes, scoutName,
      transferFee: transferFee || undefined,
      salary: salary || undefined,
    };

    // Save to DB (primary) and localStorage (legacy fallback)
    saveGradeAsync(grade).then(ok => {
      if (!ok) console.error('DB save failed, localStorage only');
    });
    saveGrade(grade);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onSave();
  };

  return (
    <div className="space-y-6">

      {/* ─── RUBRIC ─── */}
      <div className="p-3 bg-zinc-900 rounded-lg space-y-3">
        <p className="text-xs font-medium text-zinc-500">Rating Scales</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 mb-1">Attributes / Ability (1-5)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-zinc-500">
              <div><span className="font-bold text-zinc-300">1</span> = Well below standard</div>
              <div><span className="font-bold text-zinc-300">2</span> = Below standard</div>
              <div><span className="font-bold text-zinc-300">3</span> = At standard</div>
              <div><span className="font-bold text-zinc-300">4</span> = Above standard</div>
              <div><span className="font-bold text-zinc-300">5</span> = Well above standard</div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 mb-1">Overall Ability & Potential (1-8)</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-zinc-500">
              {Object.entries(POTENTIAL_LABELS).map(([num, label]) => (
                <div key={num}><span className="font-bold text-zinc-300">{num}</span> = {label}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Status, Level & Scout ─── */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select value={status} onChange={(ev) => setStatus(ev.target.value as Status)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white">
            <option value="FM">FM (First Team)</option>
            <option value="U23">U23</option>
            <option value="LOAN">LOAN</option>
            <option value="WATCH">WATCH</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Scouting Level</label>
          <select value={scoutingLevel} onChange={(ev) => setScoutingLevel(ev.target.value as ScoutingLevel)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white">
            <option value="Basic">Basic</option>
            <option value="Impressive">Impressive</option>
            <option value="Data only">Data only</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Report done by</label>
          <input type="text" value={scoutName} readOnly
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-900 text-sm text-zinc-400 w-48 cursor-not-allowed" />
        </div>
      </div>

      {/* ─── I. Physical ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">I. Physical</h3>
        <AttributeRow label="Strength" value={physStrength} onChange={setPhysStrength} />
        <AttributeRow label="Speed" value={physSpeed} onChange={setPhysSpeed} />
        <AttributeRow label="Agility" value={physAgility} onChange={setPhysAgility} />
        <AttributeRow label="Coordination" value={physCoordination} onChange={setPhysCoordination} />
      </div>

      {/* ─── II. Technique ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">II. Technique</h3>
        <AttributeRow label="Control" value={techControl} onChange={setTechControl} />
        <AttributeRow label="Short passes" value={techShortPasses} onChange={setTechShortPasses} />
        <AttributeRow label="Long passes" value={techLongPasses} onChange={setTechLongPasses} />
        <AttributeRow label="Aerial" value={techAerial} onChange={setTechAerial} />
        <AttributeRow label="Crossing" value={techCrossing} onChange={setTechCrossing} />
        <AttributeRow label="Finishing" value={techFinishing} onChange={setTechFinishing} />
        <AttributeRow label="Dribbling" value={techDribbling} onChange={setTechDribbling} />
        <AttributeRow label="1v1 Offensive" value={techOneVsOneOffense} onChange={setTechOneVsOneOffense} />
        <AttributeRow label="1v1 Defensive" value={techOneVsOneDefense} onChange={setTechOneVsOneDefense} />
      </div>

      {/* ─── III. Tactic ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">III. Tactic</h3>
        <AttributeRow label="Positioning" value={tacPositioning} onChange={setTacPositioning} />
        <AttributeRow label="Transition" value={tacTransition} onChange={setTacTransition} />
        <AttributeRow label="Decisions" value={tacDecisions} onChange={setTacDecisions} />
        <AttributeRow label="Anticipations" value={tacAnticipations} onChange={setTacAnticipations} />
        <AttributeRow label="Duels" value={tacDuels} onChange={setTacDuels} />
        <AttributeRow label="Set pieces" value={tacSetPieces} onChange={setTacSetPieces} />
      </div>

      {/* ─── OVERALL ABILITY & POTENTIAL ─── */}
      <div className="p-4 bg-zinc-800 rounded-lg border-2 border-zinc-600 space-y-3">
        <h3 className="text-base font-bold text-white">Overall Assessment</h3>
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm font-semibold text-zinc-200">ABILITY</span>
            <span className="text-xs text-zinc-500 ml-2">(1-8)</span>
          </div>
          <PotentialBadge value={ability} onChange={setAbility} />
        </div>
        <div className="flex items-center justify-between py-2 border-t border-zinc-700">
          <div>
            <span className="text-sm font-semibold text-zinc-200">POTENTIAL</span>
            <span className="text-xs text-zinc-500 ml-2">(1-8)</span>
          </div>
          <PotentialBadge value={potential} onChange={setPotential} />
        </div>
      </div>

      {/* ─── Scouting Tags (3 max) ─── */}
      <div className="space-y-4">
        <div className="border-b border-zinc-700 pb-2">
          <h3 className="text-sm font-semibold text-zinc-300">Scouting Tags</h3>
          <p className="text-xs text-zinc-500">Select up to 3 key traits ({scoutingTags.length}/3)</p>
        </div>
        {Object.entries(SCOUTING_TAG_CATEGORIES).map(([catKey, category]) => (
          <div key={catKey}>
            <p className="text-xs font-medium text-zinc-400 mb-2">{category.title}</p>
            <div className="flex flex-wrap gap-1.5">
              {category.tags.map(tag => (
                <button key={tag} type="button" onClick={() => toggleScoutingTag(tag)}
                  disabled={!scoutingTags.includes(tag) && scoutingTags.length >= 3}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    scoutingTags.includes(tag) ? 'bg-blue-600 text-white'
                    : scoutingTags.length >= 3 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                  }`}>
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

      {/* ─── Verdict ─── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">Verdict</h3>
        <div className="flex flex-wrap gap-2">
          {VERDICT_OPTIONS.map(opt => (
            <button key={opt.value} type="button" onClick={() => setVerdict(opt.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                verdict === opt.value ? `${opt.color} text-white` : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}>
              {opt.value}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Role ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Role</label>
        <input type="text" value={role} onChange={(ev) => setRole(ev.target.value)}
          placeholder="e.g. Box-to-box midfielder, False 9..."
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
      </div>

      {/* ─── Conclusion ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Conclusion</label>
        <textarea value={conclusion} onChange={(ev) => setConclusion(ev.target.value)}
          placeholder="Overall assessment, fit for the team..."
          rows={4} className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white resize-none" />
      </div>

      {/* ─── Notes ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <textarea value={notes} onChange={(ev) => setNotes(ev.target.value)}
          placeholder="Additional observations..."
          rows={3} className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white resize-none" />
      </div>

      {/* ─── Transfer Info ─── */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Transfer Fee (est.)</label>
          <input type="text" value={transferFee} onChange={(ev) => setTransferFee(ev.target.value)}
            placeholder="€500k - €1M" className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Salary (est.)</label>
          <input type="text" value={salary} onChange={(ev) => setSalary(ev.target.value)}
            placeholder="€3k/month" className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
        </div>
      </div>

      {/* ─── Save ─── */}
      <div className="flex items-center gap-4 pt-4 border-t border-zinc-700">
        <button type="button" onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors">
          {existingGrade ? 'Update Grade' : 'Save Grade'}
        </button>
        {showSuccess && <span className="text-green-400 text-sm">✓ Grade saved</span>}
      </div>
    </div>
  );
}
