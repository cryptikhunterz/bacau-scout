-- Players table for Bacau Scout
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fuubyhubptalxwondwov/sql/new

CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  age INTEGER NOT NULL,
  club TEXT NOT NULL,
  market_value_cents BIGINT NOT NULL,  -- Stored in cents for precision
  market_value_display TEXT NOT NULL,   -- Original format "€2.00m" for UI
  nationality TEXT[] NOT NULL,          -- Array for dual nationals
  league_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for search (name, club)
CREATE INDEX IF NOT EXISTS idx_players_name ON players USING gin (to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_players_club ON players (club);
CREATE INDEX IF NOT EXISTS idx_players_position ON players (position);
CREATE INDEX IF NOT EXISTS idx_players_age ON players (age);
CREATE INDEX IF NOT EXISTS idx_players_market_value ON players (market_value_cents);

-- Enable Row Level Security (public read for MVP)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
