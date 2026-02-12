'use client';

import { WyscoutStats } from '@/components/WyscoutStats';

interface WyscoutStatsWrapperProps {
  playerId: string;
}

export function WyscoutStatsWrapper({ playerId }: WyscoutStatsWrapperProps) {
  return <WyscoutStats playerId={playerId} />;
}
