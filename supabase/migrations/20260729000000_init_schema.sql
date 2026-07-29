
-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    skill_offense INTEGER CHECK (skill_offense BETWEEN 1 AND 10) DEFAULT 5,
    skill_defense INTEGER CHECK (skill_defense BETWEEN 1 AND 10) DEFAULT 5,
    skill_goalie INTEGER CHECK (skill_goalie BETWEEN 1 AND 10) DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    opponent TEXT NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game Attendance table
CREATE TABLE game_attendance (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT false,
    arrived_quarter INTEGER CHECK (arrived_quarter BETWEEN 1 AND 4) DEFAULT 1,
    PRIMARY KEY (game_id, player_id)
);

-- Lineups table
CREATE TABLE lineups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4) NOT NULL,
    position TEXT CHECK (position IN ('LF', 'RF', 'CF', 'LD', 'CD', 'RD', 'Goalie', 'Bench')) NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- A player can only be in one position per quarter
    CONSTRAINT lineups_unique_player_per_quarter UNIQUE (game_id, quarter, player_id)
);

-- Ensure only one player per active position per quarter
CREATE UNIQUE INDEX unique_position_per_quarter ON lineups (game_id, quarter, position) WHERE position != 'Bench';

-- Enable Row Level Security (RLS) for the tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (since this is an internal tool, or we can configure auth later)
CREATE POLICY "Allow public read access on players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public all access on players" ON players FOR ALL USING (true);

CREATE POLICY "Allow public read access on games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow public all access on games" ON games FOR ALL USING (true);

CREATE POLICY "Allow public read access on game_attendance" ON game_attendance FOR SELECT USING (true);
CREATE POLICY "Allow public all access on game_attendance" ON game_attendance FOR ALL USING (true);

CREATE POLICY "Allow public read access on lineups" ON lineups FOR SELECT USING (true);
CREATE POLICY "Allow public all access on lineups" ON lineups FOR ALL USING (true);
