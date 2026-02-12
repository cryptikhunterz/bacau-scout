'use client';

import { useState, useEffect } from 'react';
import { GradingForm } from './GradingForm';
import { getGradeAsync, deleteGrade, PlayerGrade } from '@/lib/grades';

interface PlayerGradingProps {
  player: {
    id: string;
    name: string;
    position: string;
    club: string;
  };
}

export function PlayerGrading({ player }: PlayerGradingProps) {
  const [existingGrade, setExistingGrade] = useState<PlayerGrade | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getGradeAsync(player.id).then(g => setExistingGrade(g));
  }, [player.id]);

  const handleSave = () => {
    getGradeAsync(player.id).then(g => setExistingGrade(g));
  };

  const handleDelete = () => {
    deleteGrade(player.id);
    setExistingGrade(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-zinc-800 rounded-lg shadow-sm border border-zinc-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">
        Scout Evaluation
      </h2>

      {existingGrade && (
        <p className="text-sm text-zinc-500 mb-4">
          Last graded: {new Date(existingGrade.gradedAt).toLocaleDateString()}
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
              Delete Grade
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Delete this grade?
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
