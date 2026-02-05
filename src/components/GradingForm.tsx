'use client';

import { useState } from 'react';
import {
  saveGrade,
  PlayerGrade,
  POTENTIAL_LABELS,
  REPORT_LABELS,
  ATTRIBUTE_CATEGORIES,
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

// ─── Attribute Row: Label | Ability (1-5) | Potential (1-8) ─────────

function AttributeRow({
  label,
  ability,
  potential,
  onAbilityChange,
  onPotentialChange,
}: {
  label: string;
  ability: AbilityRating;
  potential: PotentialRating;
  onAbilityChange: (val: AbilityRating) => void;
  onPotentialChange: (val: PotentialRating) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-1.5 border-b border-zinc-700/50 last:border-0">
      <span className="text-sm text-zinc-300">{label}</span>

      {/* Ability 1-5 */}
      <div className="flex gap-0.5">
        {([1, 2, 3, 4, 5] as AbilityRating[]).map(n => (
          <button key={n} type="button" onClick={() => onAbilityChange(n)}
            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
              ability === n ? getAbilityColor(n) : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}>
            {n}
          </button>
        ))}
      </div>

      {/* Potential 1-8 */}
      <div className="flex gap-0.5">
        {([1, 2, 3, 4, 5, 6, 7, 8] as PotentialRating[]).map(n => (
          <button key={n} type="button" onClick={() => onPotentialChange(n)}
            className={`w-7 h-7 rounded text-xs font-bold transition-colors ${
              potential === n ? getPotentialColor(n) : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Form ──────────────────────────────────────────────────────

export function GradingForm({ player, existingGrade, onSave }: GradingFormProps) {
  const e = existingGrade; // shorthand

  // Status
  const [status, setStatus] = useState<Status>(e?.status || 'WATCH');
  const [scoutingLevel, setScoutingLevel] = useState<ScoutingLevel>(e?.scoutingLevel || 'Basic');

  // Report (FCB Scale)
  const [report, setReport] = useState<AbilityRating>(e?.report || 3);

  // Physical — ability + potential
  const [physStrength, setPhysStrength] = useState<AbilityRating>(e?.physStrength || 3);
  const [physStrengthPot, setPhysStrengthPot] = useState<PotentialRating>(e?.physStrengthPot || 4);
  const [physSpeed, setPhysSpeed] = useState<AbilityRating>(e?.physSpeed || 3);
  const [physSpeedPot, setPhysSpeedPot] = useState<PotentialRating>(e?.physSpeedPot || 4);
  const [physAgility, setPhysAgility] = useState<AbilityRating>(e?.physAgility || 3);
  const [physAgilityPot, setPhysAgilityPot] = useState<PotentialRating>(e?.physAgilityPot || 4);
  const [physCoordination, setPhysCoordination] = useState<AbilityRating>(e?.physCoordination || 3);
  const [physCoordinationPot, setPhysCoordinationPot] = useState<PotentialRating>(e?.physCoordinationPot || 4);

  // Technique — ability + potential
  const [techControl, setTechControl] = useState<AbilityRating>(e?.techControl || 3);
  const [techControlPot, setTechControlPot] = useState<PotentialRating>(e?.techControlPot || 4);
  const [techShortPasses, setTechShortPasses] = useState<AbilityRating>(e?.techShortPasses || 3);
  const [techShortPassesPot, setTechShortPassesPot] = useState<PotentialRating>(e?.techShortPassesPot || 4);
  const [techLongPasses, setTechLongPasses] = useState<AbilityRating>(e?.techLongPasses || 3);
  const [techLongPassesPot, setTechLongPassesPot] = useState<PotentialRating>(e?.techLongPassesPot || 4);
  const [techAerial, setTechAerial] = useState<AbilityRating>(e?.techAerial || 3);
  const [techAerialPot, setTechAerialPot] = useState<PotentialRating>(e?.techAerialPot || 4);
  const [techCrossing, setTechCrossing] = useState<AbilityRating>(e?.techCrossing || 3);
  const [techCrossingPot, setTechCrossingPot] = useState<PotentialRating>(e?.techCrossingPot || 4);
  const [techFinishing, setTechFinishing] = useState<AbilityRating>(e?.techFinishing || 3);
  const [techFinishingPot, setTechFinishingPot] = useState<PotentialRating>(e?.techFinishingPot || 4);
  const [techDribbling, setTechDribbling] = useState<AbilityRating>(e?.techDribbling || 3);
  const [techDribblingPot, setTechDribblingPot] = useState<PotentialRating>(e?.techDribblingPot || 4);
  const [techOneVsOneOffense, setTechOneVsOneOffense] = useState<AbilityRating>(e?.techOneVsOneOffense || 3);
  const [techOneVsOneOffensePot, setTechOneVsOneOffensePot] = useState<PotentialRating>(e?.techOneVsOneOffensePot || 4);
  const [techOneVsOneDefense, setTechOneVsOneDefense] = useState<AbilityRating>(e?.techOneVsOneDefense || 3);
  const [techOneVsOneDefensePot, setTechOneVsOneDefensePot] = useState<PotentialRating>(e?.techOneVsOneDefensePot || 4);

  // Tactic — ability + potential
  const [tacPositioning, setTacPositioning] = useState<AbilityRating>(e?.tacPositioning || 3);
  const [tacPositioningPot, setTacPositioningPot] = useState<PotentialRating>(e?.tacPositioningPot || 4);
  const [tacTransition, setTacTransition] = useState<AbilityRating>(e?.tacTransition || 3);
  const [tacTransitionPot, setTacTransitionPot] = useState<PotentialRating>(e?.tacTransitionPot || 4);
  const [tacDecisions, setTacDecisions] = useState<AbilityRating>(e?.tacDecisions || 3);
  const [tacDecisionsPot, setTacDecisionsPot] = useState<PotentialRating>(e?.tacDecisionsPot || 4);
  const [tacAnticipations, setTacAnticipations] = useState<AbilityRating>(e?.tacAnticipations || 3);
  const [tacAnticipationsPot, setTacAnticipationsPot] = useState<PotentialRating>(e?.tacAnticipationsPot || 4);
  const [tacDuels, setTacDuels] = useState<AbilityRating>(e?.tacDuels || 3);
  const [tacDuelsPot, setTacDuelsPot] = useState<PotentialRating>(e?.tacDuelsPot || 4);
  const [tacSetPieces, setTacSetPieces] = useState<AbilityRating>(e?.tacSetPieces || 3);
  const [tacSetPiecesPot, setTacSetPiecesPot] = useState<PotentialRating>(e?.tacSetPiecesPot || 4);

  // Scouting Tags (3 max)
  const [scoutingTags, setScoutingTags] = useState<string[]>(e?.scoutingTags || []);

  // Verdict
  const [verdict, setVerdict] = useState<Verdict>(e?.verdict || 'Monitor');

  // Role, Conclusion, Notes
  const [role, setRole] = useState<string>(e?.role || '');
  const [conclusion, setConclusion] = useState<string>(e?.conclusion || '');
  const [notes, setNotes] = useState<string>(e?.notes || '');
  const [transferFee, setTransferFee] = useState<string>(e?.transferFee || '');
  const [salary, setSalary] = useState<string>(e?.salary || '');

  const [showSuccess, setShowSuccess] = useState(false);

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
      physStrength, physStrengthPot, physSpeed, physSpeedPot,
      physAgility, physAgilityPot, physCoordination, physCoordinationPot,
      techControl, techControlPot, techShortPasses, techShortPassesPot,
      techLongPasses, techLongPassesPot, techAerial, techAerialPot,
      techCrossing, techCrossingPot, techFinishing, techFinishingPot,
      techDribbling, techDribblingPot, techOneVsOneOffense, techOneVsOneOffensePot,
      techOneVsOneDefense, techOneVsOneDefensePot,
      tacPositioning, tacPositioningPot, tacTransition, tacTransitionPot,
      tacDecisions, tacDecisionsPot, tacAnticipations, tacAnticipationsPot,
      tacDuels, tacDuelsPot, tacSetPieces, tacSetPiecesPot,
      scoutingTags, verdict, role, conclusion, notes,
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

      {/* ─── RUBRIC: Rating Scales Reference ─── */}
      <div className="p-4 bg-zinc-800/60 rounded-lg border border-zinc-700 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Rating Scales</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Ability Scale */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1">Ability (1-5)</p>
            <div className="space-y-0.5 text-xs text-zinc-500">
              <div><span className="font-medium text-zinc-300">1</span> = Well below standard</div>
              <div><span className="font-medium text-zinc-300">2</span> = Below standard</div>
              <div><span className="font-medium text-zinc-300">3</span> = At standard</div>
              <div><span className="font-medium text-zinc-300">4</span> = Above standard</div>
              <div><span className="font-medium text-zinc-300">5</span> = Well above standard</div>
            </div>
          </div>

          {/* Potential Scale */}
          <div>
            <p className="text-xs font-medium text-zinc-400 mb-1">Potential (1-8)</p>
            <div className="space-y-0.5 text-xs text-zinc-500">
              {Object.entries(POTENTIAL_LABELS).map(([num, label]) => (
                <div key={num}><span className="font-medium text-zinc-300">{num}</span> = {label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Scale */}
        <div>
          <p className="text-xs font-medium text-zinc-400 mb-1">Report — FCB Standard (1-5)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 text-xs text-zinc-500">
            {Object.entries(REPORT_LABELS).map(([num, label]) => (
              <div key={num}><span className="font-medium text-zinc-300">{num}</span> = {label}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Report Rating ─── */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-600 pb-2">Report (FCB Standard)</h3>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-sm text-zinc-300">Report Rating</span>
          <div className="flex gap-0.5">
            {([1, 2, 3, 4, 5] as AbilityRating[]).map(n => (
              <button key={n} type="button" onClick={() => setReport(n)}
                className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                  report === n ? getAbilityColor(n) : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Column Headers ─── */}
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-0">
        <span></span>
        <span className="text-[10px] font-semibold text-zinc-400 text-center w-[148px]">ABILITY (1-5)</span>
        <span className="text-[10px] font-semibold text-zinc-400 text-center w-[232px]">POTENTIAL (1-8)</span>
      </div>

      {/* ─── Physical ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-600 pb-2">Physical</h3>
        <AttributeRow label="Strength" ability={physStrength} potential={physStrengthPot}
          onAbilityChange={setPhysStrength} onPotentialChange={setPhysStrengthPot} />
        <AttributeRow label="Speed" ability={physSpeed} potential={physSpeedPot}
          onAbilityChange={setPhysSpeed} onPotentialChange={setPhysSpeedPot} />
        <AttributeRow label="Agility" ability={physAgility} potential={physAgilityPot}
          onAbilityChange={setPhysAgility} onPotentialChange={setPhysAgilityPot} />
        <AttributeRow label="Coordination" ability={physCoordination} potential={physCoordinationPot}
          onAbilityChange={setPhysCoordination} onPotentialChange={setPhysCoordinationPot} />
      </div>

      {/* ─── Technique ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-600 pb-2">Technique</h3>
        <AttributeRow label="Control" ability={techControl} potential={techControlPot}
          onAbilityChange={setTechControl} onPotentialChange={setTechControlPot} />
        <AttributeRow label="Short passes" ability={techShortPasses} potential={techShortPassesPot}
          onAbilityChange={setTechShortPasses} onPotentialChange={setTechShortPassesPot} />
        <AttributeRow label="Long passes" ability={techLongPasses} potential={techLongPassesPot}
          onAbilityChange={setTechLongPasses} onPotentialChange={setTechLongPassesPot} />
        <AttributeRow label="Aerial" ability={techAerial} potential={techAerialPot}
          onAbilityChange={setTechAerial} onPotentialChange={setTechAerialPot} />
        <AttributeRow label="Crossing" ability={techCrossing} potential={techCrossingPot}
          onAbilityChange={setTechCrossing} onPotentialChange={setTechCrossingPot} />
        <AttributeRow label="Finishing" ability={techFinishing} potential={techFinishingPot}
          onAbilityChange={setTechFinishing} onPotentialChange={setTechFinishingPot} />
        <AttributeRow label="Dribbling" ability={techDribbling} potential={techDribblingPot}
          onAbilityChange={setTechDribbling} onPotentialChange={setTechDribblingPot} />
        <AttributeRow label="1v1 Offensive" ability={techOneVsOneOffense} potential={techOneVsOneOffensePot}
          onAbilityChange={setTechOneVsOneOffense} onPotentialChange={setTechOneVsOneOffensePot} />
        <AttributeRow label="1v1 Defensive" ability={techOneVsOneDefense} potential={techOneVsOneDefensePot}
          onAbilityChange={setTechOneVsOneDefense} onPotentialChange={setTechOneVsOneDefensePot} />
      </div>

      {/* ─── Tactic ─── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-600 pb-2">Tactic</h3>
        <AttributeRow label="Positioning" ability={tacPositioning} potential={tacPositioningPot}
          onAbilityChange={setTacPositioning} onPotentialChange={setTacPositioningPot} />
        <AttributeRow label="Transition" ability={tacTransition} potential={tacTransitionPot}
          onAbilityChange={setTacTransition} onPotentialChange={setTacTransitionPot} />
        <AttributeRow label="Decisions" ability={tacDecisions} potential={tacDecisionsPot}
          onAbilityChange={setTacDecisions} onPotentialChange={setTacDecisionsPot} />
        <AttributeRow label="Anticipations" ability={tacAnticipations} potential={tacAnticipationsPot}
          onAbilityChange={setTacAnticipations} onPotentialChange={setTacAnticipationsPot} />
        <AttributeRow label="Duels" ability={tacDuels} potential={tacDuelsPot}
          onAbilityChange={setTacDuels} onPotentialChange={setTacDuelsPot} />
        <AttributeRow label="Set pieces" ability={tacSetPieces} potential={tacSetPiecesPot}
          onAbilityChange={setTacSetPieces} onPotentialChange={setTacSetPiecesPot} />
      </div>

      {/* ─── Scouting Tags (3 max) ─── */}
      <div className="space-y-4">
        <div className="border-b border-zinc-600 pb-2">
          <h3 className="text-sm font-semibold text-zinc-200">Scouting Tags</h3>
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
        <h3 className="text-sm font-semibold text-zinc-200 border-b border-zinc-600 pb-2">Verdict</h3>
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
          placeholder="e.g. Box-to-box midfielder, False 9, Inverted fullback..."
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white" />
      </div>

      {/* ─── Conclusion ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Conclusion</label>
        <textarea value={conclusion} onChange={(ev) => setConclusion(ev.target.value)}
          placeholder="Overall assessment, fit for the team, recommendation details..."
          rows={4} className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm text-white resize-none" />
      </div>

      {/* ─── Notes ─── */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <textarea value={notes} onChange={(ev) => setNotes(ev.target.value)}
          placeholder="Additional observations, match context..."
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
