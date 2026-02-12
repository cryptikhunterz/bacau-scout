'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GradingForm } from './GradingForm';
import { getGradeAsync, deleteGrade, PlayerGrade, getAbilityColor, getPotentialColor, POTENTIAL_LABELS } from '@/lib/grades';

interface PlayerGradingProps {
  player: {
    id: string;
    name: string;
    position: string;
    club: string;
  };
}

// ─── Read-Only Attribute Row ────────────────────────────────────────
function AttributeRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold text-sm ${getAbilityColor(value)}`}>
        {value || '-'}
      </span>
    </div>
  );
}

// ─── Verdict Colors ─────────────────────────────────────────────────
const verdictColors: Record<string, string> = {
  'Sign': 'bg-green-600 text-white',
  'Observe': 'bg-yellow-600 text-white',
  'Monitor': 'bg-blue-600 text-white',
  'Not a priority': 'bg-zinc-600 text-white',
  'Out of reach': 'bg-red-600 text-white',
  'Discard': 'bg-red-900 text-white',
};

export function PlayerGrading({ player }: PlayerGradingProps) {
  const { data: session } = useSession();
  const [existingGrade, setExistingGrade] = useState<PlayerGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'admin';
  const currentScoutName = session?.user?.name || '';

  useEffect(() => {
    setLoading(true);
    getGradeAsync(player.id).then(g => {
      setExistingGrade(g);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [player.id]);

  const handleSave = () => {
    getGradeAsync(player.id).then(g => {
      setExistingGrade(g);
      setEditing(false);
    });
  };

  const handleDelete = () => {
    deleteGrade(player.id);
    setExistingGrade(null);
    setShowDeleteConfirm(false);
    setEditing(false);
  };

  // Can edit if admin OR if this scout created the report
  const canEdit = isAdmin || (existingGrade?.scoutName === currentScoutName);

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <p className="text-sm text-zinc-400">Loading grade data...</p>
      </div>
    );
  }

  // ─── No Existing Grade → Show Form ────────────────────────────────
  if (!existingGrade || editing) {
    return (
      <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {editing ? 'Edit Scout Evaluation' : 'Scout Evaluation'}
          </h2>
          {editing && (
            <button onClick={() => setEditing(false)}
              className="text-sm text-zinc-400 hover:text-white transition-colors">
              ← Back to Report
            </button>
          )}
        </div>
        <GradingForm
          key={existingGrade?.gradedAt || 'new'}
          player={player}
          existingGrade={existingGrade || undefined}
          onSave={handleSave}
        />
      </div>
    );
  }

  // ─── Read-Only Report View ────────────────────────────────────────
  const g = existingGrade;

  return (
    <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Scout Evaluation</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Scouted by <span className="text-zinc-300">{g.scoutName || 'Unknown'}</span> • {new Date(g.gradedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors">
              ✏️ Edit
            </button>
          )}
          <span className={`px-3 py-1.5 text-sm font-bold rounded ${verdictColors[g.verdict] || 'bg-zinc-600 text-white'}`}>
            {g.verdict}
          </span>
        </div>
      </div>

      {/* Overall Scores */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-zinc-700">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Ability</p>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${getPotentialColor(g.ability || 0)}`}>
            {POTENTIAL_LABELS[g.ability || 0] || '-'}
          </span>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Potential</p>
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${getPotentialColor(g.potential || 0)}`}>
            {POTENTIAL_LABELS[g.potential || 0] || '-'}
          </span>
        </div>
        {g.salary && (
          <div className="ml-auto text-center">
            <p className="text-xs text-zinc-500 mb-1">Est. Salary</p>
            <p className="text-sm font-semibold text-green-400">{g.salary}</p>
          </div>
        )}
        {g.transferFee && (
          <div className="text-center">
            <p className="text-xs text-zinc-500 mb-1">Transfer Fee</p>
            <p className="text-sm font-semibold text-green-400">{g.transferFee}</p>
          </div>
        )}
      </div>

      {/* Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Physical */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">I. Physical</h3>
          <AttributeRow label="Strength" value={g.physStrength} />
          <AttributeRow label="Speed" value={g.physSpeed} />
          <AttributeRow label="Agility" value={g.physAgility} />
          <AttributeRow label="Coordination" value={g.physCoordination} />
        </div>

        {/* Technique */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">II. Technique</h3>
          <AttributeRow label="Control" value={g.techControl} />
          <AttributeRow label="Short passes" value={g.techShortPasses} />
          <AttributeRow label="Long passes" value={g.techLongPasses} />
          <AttributeRow label="Aerial" value={g.techAerial} />
          <AttributeRow label="Crossing" value={g.techCrossing} />
          <AttributeRow label="Finishing" value={g.techFinishing} />
          <AttributeRow label="Dribbling" value={g.techDribbling} />
          <AttributeRow label="1v1 Offense" value={g.techOneVsOneOffense} />
          <AttributeRow label="1v1 Defense" value={g.techOneVsOneDefense} />
        </div>

        {/* Tactic */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">III. Tactic</h3>
          <AttributeRow label="Positioning" value={g.tacPositioning} />
          <AttributeRow label="Transition" value={g.tacTransition} />
          <AttributeRow label="Decisions" value={g.tacDecisions} />
          <AttributeRow label="Anticipations" value={g.tacAnticipations} />
          <AttributeRow label="Duels" value={g.tacDuels} />
          <AttributeRow label="Set pieces" value={g.tacSetPieces} />
        </div>
      </div>

      {/* Scouting Tags */}
      {g.scoutingTags && g.scoutingTags.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Scouting Tags</h3>
          <div className="flex flex-wrap gap-2">
            {g.scoutingTags.map((tag, i) => (
              <span key={i} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Role, Conclusion, Notes */}
      {(g.role || g.conclusion || g.notes) && (
        <div className="space-y-3 pt-4 border-t border-zinc-700">
          {g.role && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Role</h3>
              <p className="text-sm text-white">{g.role}</p>
            </div>
          )}
          {g.conclusion && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Conclusion</h3>
              <p className="text-sm text-white whitespace-pre-wrap">{g.conclusion}</p>
            </div>
          )}
          {g.notes && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notes</h3>
              <p className="text-sm text-white whitespace-pre-wrap">{g.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Delete (admin or own scout only) */}
      {canEdit && (
        <div className="pt-4 border-t border-zinc-700">
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 text-sm">
              Delete Grade
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">Delete this grade?</span>
              <button onClick={handleDelete} className="text-red-600 text-sm font-medium">Yes, delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-zinc-500 text-sm">Cancel</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
