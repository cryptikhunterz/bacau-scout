'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function StarRating({ value, onChange, label }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-600 dark:text-zinc-400 w-20">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className="text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 rounded transition-colors"
          >
            <span
              className={
                star <= (hoverValue ?? value)
                  ? 'text-yellow-500'
                  : 'text-zinc-400'
              }
            >
              {star <= (hoverValue ?? value) ? '★' : '☆'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
