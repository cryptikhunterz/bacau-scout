'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import { GradesTable } from '@/components/GradesTable';
import { GradesFilters } from '@/components/GradesFilters';
import { getAllGrades, PlayerGrade } from '@/lib/grades';

export default function Home() {
  const [grades, setGrades] = useState<PlayerGrade[]>([]);
  const [filters, setFilters] = useState({
    recommendation: '',
    minAbility: 0,
    position: '',
  });

  useEffect(() => {
    setGrades(getAllGrades());
  }, []);

  // Apply filters
  const filteredGrades = grades.filter((g) => {
    if (filters.recommendation && g.recommendation !== filters.recommendation) return false;
    if (filters.minAbility && g.abilityRating < filters.minAbility) return false;
    if (filters.position && !g.position.toLowerCase().includes(filters.position.toLowerCase())) return false;
    return true;
  });

  // Summary stats
  const signCount = grades.filter((g) => g.recommendation === 'Sign').length;
  const monitorCount = grades.filter((g) => g.recommendation === 'Monitor').length;
  const discardCount = grades.filter((g) => g.recommendation === 'Discard').length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
            FC Bacau Scout Database
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {grades.length} players graded | {signCount} Sign | {monitorCount} Monitor | {discardCount} Discard
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar />
        </div>

        {/* Grades Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            Graded Players
          </h2>

          {/* Filters */}
          <div className="mb-4">
            <GradesFilters filters={filters} onChange={setFilters} />
          </div>

          {/* Grades Table */}
          {filteredGrades.length > 0 ? (
            <GradesTable grades={filteredGrades} />
          ) : grades.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">
              No players graded yet. Search for a player to start scouting.
            </p>
          ) : (
            <p className="text-center text-zinc-500 py-8">
              No players match current filters.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
