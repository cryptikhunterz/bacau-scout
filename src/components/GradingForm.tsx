'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import {
  saveGrade,
  PlayerGrade,
  CATEGORY_LABELS,
  Status,
  Recommendation,
  ScoutingLevel,
  PlayerCategory,
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

export function GradingForm({ player, existingGrade, onSave }: GradingFormProps) {
  // Form state - initialize from existing grade or defaults
  const [status, setStatus] = useState<Status>(existingGrade?.status || 'FM');
  const [recommendation, setRecommendation] = useState<Recommendation>(
    existingGrade?.recommendation || 'Monitor'
  );
  const [scoutingLevel, setScoutingLevel] = useState<ScoutingLevel>(
    existingGrade?.scoutingLevel || 'Basic'
  );
  const [playerCategory, setPlayerCategory] = useState<PlayerCategory>(
    existingGrade?.playerCategory || 5
  );
  const [abilityRating, setAbilityRating] = useState<number>(
    existingGrade?.abilityRating || 3
  );
  const [potentialRating, setPotentialRating] = useState<number>(
    existingGrade?.potentialRating || 3
  );
  const [technicalRating, setTechnicalRating] = useState<number>(
    existingGrade?.technicalRating || 3
  );
  const [tacticalRating, setTacticalRating] = useState<number>(
    existingGrade?.tacticalRating || 3
  );
  const [physicalRating, setPhysicalRating] = useState<number>(
    existingGrade?.physicalRating || 3
  );
  const [mentalRating, setMentalRating] = useState<number>(
    existingGrade?.mentalRating || 3
  );
  const [notes, setNotes] = useState<string>(existingGrade?.notes || '');
  const [transferFee, setTransferFee] = useState<string>(
    existingGrade?.transferFee || ''
  );
  const [salary, setSalary] = useState<string>(existingGrade?.salary || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    const grade: PlayerGrade = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      club: player.club,
      gradedAt: new Date().toISOString(),
      status,
      recommendation,
      scoutingLevel,
      playerCategory,
      abilityRating,
      potentialRating,
      technicalRating,
      tacticalRating,
      physicalRating,
      mentalRating,
      notes,
      transferFee: transferFee || undefined,
      salary: salary || undefined,
    };

    saveGrade(grade);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onSave();
  };

  // Recommendation button colors
  const recButtonClass = (rec: Recommendation) => {
    const base = 'px-4 py-2 rounded text-sm font-medium transition-colors';
    if (recommendation === rec) {
      switch (rec) {
        case 'Sign':
          return `${base} bg-green-600 text-white`;
        case 'Monitor':
          return `${base} bg-yellow-500 text-white`;
        case 'Discard':
          return `${base} bg-red-600 text-white`;
      }
    }
    return `${base} bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600`;
  };

  // Generate ability rating options (1.0 to 5.0 in 0.5 increments)
  const abilityOptions = [];
  for (let i = 1; i <= 5; i += 0.5) {
    abilityOptions.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Status & Recommendation */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Status & Recommendation
        </h3>

        <div className="flex flex-wrap gap-4">
          {/* Status dropdown */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              <option value="FM">FM (First Team)</option>
              <option value="U23">U23</option>
              <option value="LOAN">LOAN</option>
              <option value="WATCH">WATCH</option>
            </select>
          </div>

          {/* Scouting Level dropdown */}
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Scouting Level
            </label>
            <select
              value={scoutingLevel}
              onChange={(e) => setScoutingLevel(e.target.value as ScoutingLevel)}
              className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              <option value="Basic">Basic</option>
              <option value="Impressive">Impressive</option>
              <option value="Data only">Data only</option>
            </select>
          </div>
        </div>

        {/* Recommendation buttons */}
        <div>
          <label className="block text-xs text-zinc-500 mb-2">
            Recommendation
          </label>
          <div className="flex gap-2">
            {(['Sign', 'Monitor', 'Discard'] as Recommendation[]).map((rec) => (
              <button
                key={rec}
                type="button"
                onClick={() => setRecommendation(rec)}
                className={recButtonClass(rec)}
              >
                {rec}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Player Category */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">
          Player Category
        </label>
        <select
          value={playerCategory}
          onChange={(e) => setPlayerCategory(Number(e.target.value) as PlayerCategory)}
          className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm w-full max-w-xs"
        >
          {([1, 2, 3, 4, 5, 6, 7, 8] as PlayerCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {cat} - {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Section 3: Ability Ratings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ability Ratings
        </h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">
              Current Ability
            </label>
            <select
              value={abilityRating}
              onChange={(e) => setAbilityRating(Number(e.target.value))}
              className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              {abilityOptions.map((val) => (
                <option key={val} value={val}>
                  {val.toFixed(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Potential</label>
            <select
              value={potentialRating}
              onChange={(e) => setPotentialRating(Number(e.target.value))}
              className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
            >
              {abilityOptions.map((val) => (
                <option key={val} value={val}>
                  {val.toFixed(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 4: Star Ratings */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Skill Ratings
        </h3>
        <div className="space-y-2">
          <StarRating
            label="Technical"
            value={technicalRating}
            onChange={setTechnicalRating}
          />
          <StarRating
            label="Tactical"
            value={tacticalRating}
            onChange={setTacticalRating}
          />
          <StarRating
            label="Physical"
            value={physicalRating}
            onChange={setPhysicalRating}
          />
          <StarRating
            label="Mental"
            value={mentalRating}
            onChange={setMentalRating}
          />
        </div>
      </div>

      {/* Section 5: Notes */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scout observations, concerns, strengths..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
        />
      </div>

      {/* Section 6: Optional fields */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">
            Transfer Fee (est.)
          </label>
          <input
            type="text"
            value={transferFee}
            onChange={(e) => setTransferFee(e.target.value)}
            placeholder="€500k - €1M"
            className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Salary (est.)</label>
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="€3k/month"
            className="px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          />
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
        >
          {existingGrade ? 'Update Grade' : 'Save Grade'}
        </button>
        {showSuccess && (
          <span className="text-green-600 dark:text-green-400 text-sm">
            ✓ Grade saved
          </span>
        )}
      </div>
    </div>
  );
}
