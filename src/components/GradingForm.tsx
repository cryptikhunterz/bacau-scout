'use client';

import { useState } from 'react';
import {
  saveGrade,
  PlayerGrade,
  RATING_LABELS,
  METRIC_CATEGORIES,
  getRatingColor,
  AVAILABLE_TAGS,
  Status,
  Recommendation,
  ScoutingLevel,
  MetricRating,
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

// FM-style rating badge colors
function getFMColor(value: number): string {
  if (value >= 7) return 'bg-green-500 text-white';
  if (value >= 5) return 'bg-yellow-500 text-black';
  if (value >= 3) return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
}

// Rating selector component with FM-style badge
function RatingSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MetricRating;
  onChange: (val: MetricRating) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-700/50 last:border-0">
      <span className="text-sm text-zinc-300">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {/* FM-style colored badge */}
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getFMColor(value)}`}>
          {value}
        </span>
        {/* Increment/decrement buttons */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => value < 8 && onChange((value + 1) as MetricRating)}
            className="px-1.5 py-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => value > 1 && onChange((value - 1) as MetricRating)}
            className="px-1.5 py-0 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

export function GradingForm({ player, existingGrade, onSave }: GradingFormProps) {
  // Status & Recommendation
  const [status, setStatus] = useState<Status>(existingGrade?.status || 'FM');
  const [recommendation, setRecommendation] = useState<Recommendation>(
    existingGrade?.recommendation || 'Monitor'
  );
  const [scoutingLevel, setScoutingLevel] = useState<ScoutingLevel>(
    existingGrade?.scoutingLevel || 'Basic'
  );

  // I. Technical Proficiency
  const [dribblingBallControl, setDribblingBallControl] = useState<MetricRating>(
    existingGrade?.dribblingBallControl || 4
  );
  const [oneVsOneDribbling, setOneVsOneDribbling] = useState<MetricRating>(
    existingGrade?.oneVsOneDribbling || 4
  );
  const [passingRangeCreation, setPassingRangeCreation] = useState<MetricRating>(
    existingGrade?.passingRangeCreation || 4
  );
  const [crossingDelivery, setCrossingDelivery] = useState<MetricRating>(
    existingGrade?.crossingDelivery || 4
  );

  // II. Athletic & Physical Profile
  const [accelerationPace, setAccelerationPace] = useState<MetricRating>(
    existingGrade?.accelerationPace || 4
  );
  const [workRateStamina, setWorkRateStamina] = useState<MetricRating>(
    existingGrade?.workRateStamina || 4
  );
  const [physicalDuelingAerial, setPhysicalDuelingAerial] = useState<MetricRating>(
    existingGrade?.physicalDuelingAerial || 4
  );

  // III. Attacking Output & Efficiency
  const [goalContribution, setGoalContribution] = useState<MetricRating>(
    existingGrade?.goalContribution || 4
  );
  const [carryingProgression, setCarryingProgression] = useState<MetricRating>(
    existingGrade?.carryingProgression || 4
  );
  const [finishingShotPlacement, setFinishingShotPlacement] = useState<MetricRating>(
    existingGrade?.finishingShotPlacement || 4
  );

  // IV. Tactical IQ & Character
  const [positionalIntelligence, setPositionalIntelligence] = useState<MetricRating>(
    existingGrade?.positionalIntelligence || 4
  );
  const [defensivePressingIntensity, setDefensivePressingIntensity] = useState<MetricRating>(
    existingGrade?.defensivePressingIntensity || 4
  );
  const [oneVsOneDuels, setOneVsOneDuels] = useState<MetricRating>(
    existingGrade?.oneVsOneDuels || 4
  );

  // Tags
  const [strengths, setStrengths] = useState<string[]>(existingGrade?.strengths || []);
  const [weaknesses, setWeaknesses] = useState<string[]>(existingGrade?.weaknesses || []);

  // Notes & Optional
  const [notes, setNotes] = useState<string>(existingGrade?.notes || '');
  const [transferFee, setTransferFee] = useState<string>(existingGrade?.transferFee || '');
  const [salary, setSalary] = useState<string>(existingGrade?.salary || '');
  const [showSuccess, setShowSuccess] = useState(false);

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
      recommendation,
      scoutingLevel,
      dribblingBallControl,
      oneVsOneDribbling,
      passingRangeCreation,
      crossingDelivery,
      accelerationPace,
      workRateStamina,
      physicalDuelingAerial,
      goalContribution,
      carryingProgression,
      finishingShotPlacement,
      positionalIntelligence,
      defensivePressingIntensity,
      oneVsOneDuels,
      strengths,
      weaknesses,
      notes,
      transferFee: transferFee || undefined,
      salary: salary || undefined,
    };

    saveGrade(grade);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    onSave();
  };

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
    return `${base} bg-zinc-700 text-zinc-300 hover:bg-zinc-600`;
  };

  return (
    <div className="space-y-6">
      {/* Rating Scale Reference */}
      <div className="p-3 bg-zinc-900 rounded-lg">
        <p className="text-xs font-medium text-zinc-500 mb-2">Rating Scale (1-8)</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-xs">
          {Object.entries(RATING_LABELS).map(([num, label]) => (
            <div key={num} className="text-zinc-400">
              <span className="font-medium">{num}</span> = {label}
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm"
          >
            <option value="FM">FM (First Team)</option>
            <option value="U23">U23</option>
            <option value="LOAN">LOAN</option>
            <option value="WATCH">WATCH</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-500 mb-1">Scouting Level</label>
          <select
            value={scoutingLevel}
            onChange={(e) => setScoutingLevel(e.target.value as ScoutingLevel)}
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm"
          >
            <option value="Basic">Basic</option>
            <option value="Impressive">Impressive</option>
            <option value="Data only">Data only</option>
          </select>
        </div>
      </div>

      {/* I. Technical Proficiency */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          {METRIC_CATEGORIES.technical.title}
        </h3>
        <RatingSelect label="Dribbling & Ball Control" value={dribblingBallControl} onChange={setDribblingBallControl} />
        <RatingSelect label="1v1 Dribbling" value={oneVsOneDribbling} onChange={setOneVsOneDribbling} />
        <RatingSelect label="Passing Range (Creation)" value={passingRangeCreation} onChange={setPassingRangeCreation} />
        <RatingSelect label="Crossing & Delivery" value={crossingDelivery} onChange={setCrossingDelivery} />
      </div>

      {/* II. Athletic & Physical Profile */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          {METRIC_CATEGORIES.athletic.title}
        </h3>
        <RatingSelect label="Acceleration & Pace" value={accelerationPace} onChange={setAccelerationPace} />
        <RatingSelect label="Work Rate & Stamina" value={workRateStamina} onChange={setWorkRateStamina} />
        <RatingSelect label="Physical Dueling & Aerial" value={physicalDuelingAerial} onChange={setPhysicalDuelingAerial} />
      </div>

      {/* III. Attacking Output & Efficiency */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          {METRIC_CATEGORIES.attacking.title}
        </h3>
        <RatingSelect label="Goal Contribution (xG + xA)" value={goalContribution} onChange={setGoalContribution} />
        <RatingSelect label="Carrying & Progression" value={carryingProgression} onChange={setCarryingProgression} />
        <RatingSelect label="Finishing & Shot Placement" value={finishingShotPlacement} onChange={setFinishingShotPlacement} />
      </div>

      {/* IV. Tactical IQ & Character */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          {METRIC_CATEGORIES.tactical.title}
        </h3>
        <RatingSelect label="Positional Intelligence (Off-Ball)" value={positionalIntelligence} onChange={setPositionalIntelligence} />
        <RatingSelect label="Defensive Pressing Intensity" value={defensivePressingIntensity} onChange={setDefensivePressingIntensity} />
        <RatingSelect label="1v1 Duels" value={oneVsOneDuels} onChange={setOneVsOneDuels} />
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          Tags
        </h3>
        
        {/* Strengths */}
        <div>
          <label className="block text-xs text-zinc-500 mb-2">Strengths</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={`str-${tag}`}
                type="button"
                onClick={() => toggleTag(tag, strengths, setStrengths)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  strengths.includes(tag)
                    ? 'bg-green-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {strengths.length > 0 && (
            <p className="text-xs text-green-600 mt-2">Selected: {strengths.join(', ')}</p>
          )}
        </div>

        {/* Weaknesses */}
        <div>
          <label className="block text-xs text-zinc-500 mb-2">Weaknesses</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={`wk-${tag}`}
                type="button"
                onClick={() => toggleTag(tag, weaknesses, setWeaknesses)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  weaknesses.includes(tag)
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {weaknesses.length > 0 && (
            <p className="text-xs text-red-600 mt-2">Selected: {weaknesses.join(', ')}</p>
          )}
        </div>
      </div>

      {/* Verdict */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-zinc-300 border-b border-zinc-700 pb-2">
          Verdict
        </h3>
        <div className="flex gap-3">
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

      {/* Notes */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Scout observations, concerns, strengths..."
          rows={3}
          className="w-full px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm resize-none"
        />
      </div>

      {/* Optional fields */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Transfer Fee (est.)</label>
          <input
            type="text"
            value={transferFee}
            onChange={(e) => setTransferFee(e.target.value)}
            placeholder="€500k - €1M"
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Salary (est.)</label>
          <input
            type="text"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="€3k/month"
            className="px-3 py-2 rounded border border-zinc-700 bg-zinc-800 text-sm"
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
