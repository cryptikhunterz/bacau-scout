'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { GradingForm } from './GradingForm';
import { getGradeAsync, deleteGradeAsync, PlayerGrade } from '@/lib/grades';

interface PlayerGradingProps {
  player: {
    id: string;
    name: string;
    position: string;
    club: string;
  };
}

export function PlayerGrading({ player }: PlayerGradingProps) {
  const { data: session } = useSession();
  const [existingGrade, setExistingGrade] = useState<PlayerGrade | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const scoutId = (session?.user as any)?.id || '';

  useEffect(() => {
    if (!scoutId) {
      setLoading(false);
      return;
    }
    // Load THIS scout's grade for this player
    getGradeAsync(player.id, scoutId).then(grade => {
      setExistingGrade(grade);
      setLoading(false);
    });
  }, [player.id, scoutId]);

  const handleSave = () => {
    if (scoutId) {
      getGradeAsync(player.id, scoutId).then(setExistingGrade);
    }
  };

  const handleDelete = () => {
    deleteGradeAsync(player.id, scoutId);
    setExistingGrade(null);
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
        <p className="text-zinc-400 text-sm">Loading your grade...</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Scout Evaluation
      </h2>

      {existingGrade && (
        <p className="text-sm text-zinc-500 mb-4">
          Your last grade: {new Date(existingGrade.gradedAt).toLocaleDateString()}
        </p>
      )}

      <GradingForm
        player={player}
        existingGrade={existingGrade || undefined}
        onSave={handleSave}
      />

      {existingGrade && (
        <div className="mt-6 pt-4 border-t border-zinc-700">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Delete Your Grade
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Delete your grade?
              </span>
              <button
                onClick={handleDelete}
                className="text-red-600 text-sm font-medium"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-zinc-500 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
