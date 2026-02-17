'use client';

import { WyscoutRadars } from '@/components/WyscoutRadars';
import { WyscoutStats } from '@/components/WyscoutStats';

interface WyscoutStatsWrapperProps {
  playerId: string;
  tmPosition?: string;
}

export function WyscoutStatsWrapper({ playerId, tmPosition }: WyscoutStatsWrapperProps) {
  return (
    <>
      <WyscoutRadars playerId={playerId} tmPosition={tmPosition} />
      <WyscoutStats playerId={playerId} />
    </>
  );
}
