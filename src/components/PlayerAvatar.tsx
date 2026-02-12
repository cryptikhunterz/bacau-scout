'use client';

import { useState } from 'react';

interface PlayerAvatarProps {
  photoUrl: string | null | undefined;
  name: string;
  /** Fallback text (e.g. shirt number) — defaults to first letter of name */
  fallbackText?: string;
  /** Tailwind size classes for width/height, e.g. 'w-20 h-20' */
  size?: string;
  /** Border radius class, e.g. 'rounded-xl' or 'rounded-full' */
  rounded?: string;
  /** Optional gradient class for border, e.g. 'bg-gradient-to-br from-blue-500 to-blue-600' */
  gradient?: string;
  /** CSS classes for the fallback div background */
  fallbackBg?: string;
  /** Text size class for fallback letter */
  fallbackTextSize?: string;
}

/**
 * Player photo avatar with graceful fallback to initials.
 * Works as a client component for onError handling.
 */
export function PlayerAvatar({
  photoUrl,
  name,
  fallbackText,
  size = 'w-12 h-12',
  rounded = 'rounded-full',
  gradient,
  fallbackBg = 'bg-zinc-700',
  fallbackTextSize = 'text-sm',
}: PlayerAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = fallbackText || name?.charAt(0)?.toUpperCase() || '?';
  const hasPhoto = photoUrl && !imgError;

  // If gradient border is requested, wrap in a gradient container
  if (gradient) {
    return (
      <div className={`${size} ${rounded} ${gradient} p-[2px] shrink-0`}>
        {hasPhoto ? (
          <img
            src={photoUrl}
            alt={name}
            className={`w-full h-full ${rounded === 'rounded-xl' ? 'rounded-[10px]' : rounded} object-cover bg-zinc-800`}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={`w-full h-full ${rounded === 'rounded-xl' ? 'rounded-[10px]' : rounded} ${fallbackBg} flex items-center justify-center text-white font-bold ${fallbackTextSize}`}>
            {initial}
          </div>
        )}
      </div>
    );
  }

  // Simple avatar without gradient border
  if (hasPhoto) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${size} ${rounded} object-cover bg-zinc-800 shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${size} ${rounded} ${fallbackBg} flex items-center justify-center text-white font-bold ${fallbackTextSize} shrink-0`}>
      {initial}
    </div>
  );
}
