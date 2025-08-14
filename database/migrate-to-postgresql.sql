-- Migration Script: SQL Server to PostgreSQL for Supabase
-- Run this in Supabase SQL Editor after creating your database

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (updated for PostgreSQL)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    date_of_birth DATE,
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(100) DEFAULT 'US',
    role VARCHAR(20) DEFAULT 'user',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    tax_verification_status VARCHAR(20) DEFAULT 'not_required',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games/Contests table
CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    commissioner_id UUID REFERENCES users(id),
    max_participants INTEGER DEFAULT 100,
    entry_fee DECIMAL(10,2) DEFAULT 25.00,
    prize_pool DECIMAL(12,2) DEFAULT 0.00,
    start_week INTEGER DEFAULT 1,
    end_week INTEGER DEFAULT 18,
    season INTEGER DEFAULT 2024,
    require_two_picks_from_week INTEGER DEFAULT 12,
    status VARCHAR(20) DEFAULT 'draft',
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contest participants
CREATE TABLE IF NOT EXISTS contest_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    entry_fee_paid BOOLEAN DEFAULT FALSE,
    is_eliminated BOOLEAN DEFAULT FALSE,
    elimination_week INTEGER,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contest_id, user_id)
);

-- NFL Teams
CREATE TABLE IF NOT EXISTS nfl_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_code VARCHAR(5) UNIQUE NOT NULL,
    city VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    conference VARCHAR(3) NOT NULL,
    division VARCHAR(10) NOT NULL,
    logo_url VARCHAR(255),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFL Games/Schedule
CREATE TABLE IF NOT EXISTS nfl_games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week INTEGER NOT NULL,
    season INTEGER NOT NULL,
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    home_team_id UUID REFERENCES nfl_teams(id),
    away_team_id UUID REFERENCES nfl_teams(id),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    winner_team_id UUID REFERENCES nfl_teams(id),
    is_final BOOLEAN DEFAULT FALSE,
    espn_game_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Picks
CREATE TABLE IF NOT EXISTS user_picks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    game_id UUID REFERENCES nfl_games(id),
    selected_team_id UUID REFERENCES nfl_teams(id),
    week INTEGER NOT NULL,
    season INTEGER NOT NULL,
    is_correct BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contest_id, user_id, week, season)
);

-- User Sessions (for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email/Phone Verification Codes
CREATE TABLE IF NOT EXISTS verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'email' or 'phone'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_contests_commissioner ON contests(commissioner_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_user ON contest_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_nfl_games_week_season ON nfl_games(week, season);
CREATE INDEX IF NOT EXISTS idx_nfl_games_date ON nfl_games(game_date);
CREATE INDEX IF NOT EXISTS idx_user_picks_contest_user ON user_picks(contest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_picks_week_season ON user_picks(week, season);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON verification_codes(user_id);

-- Insert NFL Teams data
INSERT INTO nfl_teams (team_code, city, name, conference, division) VALUES
('ARI', 'Arizona', 'Cardinals', 'NFC', 'West'),
('ATL', 'Atlanta', 'Falcons', 'NFC', 'South'),
('BAL', 'Baltimore', 'Ravens', 'AFC', 'North'),
('BUF', 'Buffalo', 'Bills', 'AFC', 'East'),
('CAR', 'Carolina', 'Panthers', 'NFC', 'South'),
('CHI', 'Chicago', 'Bears', 'NFC', 'North'),
('CIN', 'Cincinnati', 'Bengals', 'AFC', 'North'),
('CLE', 'Cleveland', 'Browns', 'AFC', 'North'),
('DAL', 'Dallas', 'Cowboys', 'NFC', 'East'),
('DEN', 'Denver', 'Broncos', 'AFC', 'West'),
('DET', 'Detroit', 'Lions', 'NFC', 'North'),
('GB', 'Green Bay', 'Packers', 'NFC', 'North'),
('HOU', 'Houston', 'Texans', 'AFC', 'South'),
('IND', 'Indianapolis', 'Colts', 'AFC', 'South'),
('JAX', 'Jacksonville', 'Jaguars', 'AFC', 'South'),
('KC', 'Kansas City', 'Chiefs', 'AFC', 'West'),
('LAC', 'Los Angeles', 'Chargers', 'AFC', 'West'),
('LAR', 'Los Angeles', 'Rams', 'NFC', 'West'),
('LV', 'Las Vegas', 'Raiders', 'AFC', 'West'),
('MIA', 'Miami', 'Dolphins', 'AFC', 'East'),
('MIN', 'Minnesota', 'Vikings', 'NFC', 'North'),
('NE', 'New England', 'Patriots', 'AFC', 'East'),
('NO', 'New Orleans', 'Saints', 'NFC', 'South'),
('NYG', 'New York', 'Giants', 'NFC', 'East'),
('NYJ', 'New York', 'Jets', 'AFC', 'East'),
('PHI', 'Philadelphia', 'Eagles', 'NFC', 'East'),
('PIT', 'Pittsburgh', 'Steelers', 'AFC', 'North'),
('SEA', 'Seattle', 'Seahawks', 'NFC', 'West'),
('SF', 'San Francisco', '49ers', 'NFC', 'West'),
('TB', 'Tampa Bay', 'Buccaneers', 'NFC', 'South'),
('TEN', 'Tennessee', 'Titans', 'AFC', 'South'),
('WAS', 'Washington', 'Commanders', 'NFC', 'East')
ON CONFLICT (team_code) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_contests_updated_at BEFORE UPDATE ON contests FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_nfl_games_updated_at BEFORE UPDATE ON nfl_games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant necessary permissions (Supabase handles most of this automatically)
-- But you might need these for RLS (Row Level Security) later
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
-- etc.

SELECT 'Database schema created successfully!' as status;