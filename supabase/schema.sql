-- Players table for Bacau Scout
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/fuubyhubptalxwondwov/sql/new

-- Drop old table first
DROP TABLE IF EXISTS players CASCADE;

-- Create table matching JSON data
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  tm_url TEXT,
  name TEXT NOT NULL,
  position TEXT,
  age INTEGER,
  date_of_birth TEXT,
  current_club TEXT,
  market_value_raw TEXT,
  market_value_eur BIGINT,
  nationality TEXT[],
  image_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_players_name ON players USING gin (to_tsvector('simple', name));
CREATE INDEX idx_players_current_club ON players (current_club);
CREATE INDEX idx_players_position ON players (position);
CREATE INDEX idx_players_age ON players (age);
CREATE INDEX idx_players_market_value ON players (market_value_eur);

-- Public read access
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON players FOR SELECT USING (true);
