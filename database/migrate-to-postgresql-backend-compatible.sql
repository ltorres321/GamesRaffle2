-- Backend-Compatible Migration Script: SQL Server to PostgreSQL for Supabase
-- This creates tables with the exact names expected by the backend code

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (matches backend expectations)
CREATE TABLE IF NOT EXISTS Users (
    UserId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Username VARCHAR(50) UNIQUE NOT NULL,
    Email VARCHAR(255) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(100),
    LastName VARCHAR(100),
    PhoneNumber VARCHAR(20),
    DateOfBirth DATE,
    StreetAddress VARCHAR(255),
    City VARCHAR(100),
    State VARCHAR(50),
    ZipCode VARCHAR(10),
    Country VARCHAR(100) DEFAULT 'US',
    Role VARCHAR(20) DEFAULT 'user',
    EmailVerified BOOLEAN DEFAULT FALSE,
    PhoneVerified BOOLEAN DEFAULT FALSE,
    IsVerified BOOLEAN DEFAULT FALSE,
    IsActive BOOLEAN DEFAULT TRUE,
    TaxVerificationStatus VARCHAR(20) DEFAULT 'not_required',
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (matches backend expectations)
CREATE TABLE IF NOT EXISTS Teams (
    TeamId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    SportRadarId VARCHAR(255) UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Alias VARCHAR(5) UNIQUE NOT NULL,
    Market VARCHAR(100),
    FullName VARCHAR(200),
    Conference VARCHAR(3) NOT NULL,
    Division VARCHAR(10) NOT NULL,
    LogoUrl VARCHAR(255),
    PrimaryColor VARCHAR(7),
    SecondaryColor VARCHAR(7),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Games table (matches backend expectations)  
CREATE TABLE IF NOT EXISTS Games (
    GameId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    SportRadarId VARCHAR(255) UNIQUE,
    Week INTEGER NOT NULL,
    Season INTEGER NOT NULL,
    GameDate TIMESTAMP WITH TIME ZONE NOT NULL,
    HomeTeamId UUID REFERENCES Teams(TeamId),
    AwayTeamId UUID REFERENCES Teams(TeamId),
    HomeTeamScore INTEGER DEFAULT 0,
    AwayTeamScore INTEGER DEFAULT 0,
    Status VARCHAR(50) DEFAULT 'scheduled',
    IsComplete BOOLEAN DEFAULT FALSE,
    CurrentSurvivorGameId UUID,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SurvivorGames table (matches backend expectations)
CREATE TABLE IF NOT EXISTS SurvivorGames (
    GameId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    Name VARCHAR(255) NOT NULL,
    Description TEXT,
    CommissionerId UUID REFERENCES Users(UserId),
    MaxParticipants INTEGER DEFAULT 100,
    EntryFee DECIMAL(10,2) DEFAULT 25.00,
    PrizePool DECIMAL(12,2) DEFAULT 0.00,
    StartWeek INTEGER DEFAULT 1,
    EndWeek INTEGER DEFAULT 18,
    Season INTEGER DEFAULT 2024,
    RequireTwoPicksFromWeek INTEGER DEFAULT 12,
    Status VARCHAR(20) DEFAULT 'draft',
    IsPublic BOOLEAN DEFAULT TRUE,
    WinnerId UUID REFERENCES Users(UserId),
    CompletedAt TIMESTAMP WITH TIME ZONE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SurvivorGamePlayers table (matches backend expectations)
CREATE TABLE IF NOT EXISTS SurvivorGamePlayers (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    SurvivorGameId UUID REFERENCES SurvivorGames(GameId) ON DELETE CASCADE,
    PlayerId UUID REFERENCES Users(UserId) ON DELETE CASCADE,
    EntryFeePaid BOOLEAN DEFAULT FALSE,
    Status VARCHAR(20) DEFAULT 'active',
    EliminatedWeek INTEGER,
    EliminatedReason TEXT,
    EliminatedAt TIMESTAMP WITH TIME ZONE,
    JoinedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(SurvivorGameId, PlayerId)
);

-- PlayerPicks table (matches backend expectations)
CREATE TABLE IF NOT EXISTS PlayerPicks (
    PickId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    SurvivorGameId UUID REFERENCES SurvivorGames(GameId) ON DELETE CASCADE,
    PlayerId UUID REFERENCES Users(UserId) ON DELETE CASCADE,
    GameId UUID REFERENCES Games(GameId),
    TeamId UUID REFERENCES Teams(TeamId),
    Week INTEGER NOT NULL,
    Season INTEGER NOT NULL,
    IsCorrect BOOLEAN,
    ProcessedAt TIMESTAMP WITH TIME ZONE,
    SubmittedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(SurvivorGameId, PlayerId, Week, Season)
);

-- UserSessions table (for authentication)
CREATE TABLE IF NOT EXISTS UserSessions (
    SessionId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    UserId UUID REFERENCES Users(UserId) ON DELETE CASCADE,
    SessionToken VARCHAR(255) UNIQUE NOT NULL,
    RefreshToken VARCHAR(255) UNIQUE NOT NULL,
    ExpiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VerificationCodes table (for email/phone verification)
CREATE TABLE IF NOT EXISTS VerificationCodes (
    Id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    UserId UUID REFERENCES Users(UserId) ON DELETE CASCADE,
    Code VARCHAR(10) NOT NULL,
    Type VARCHAR(20) NOT NULL, -- 'email' or 'phone'
    ExpiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
    IsUsed BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_users_username ON Users(Username);
CREATE INDEX IF NOT EXISTS idx_teams_alias ON Teams(Alias);
CREATE INDEX IF NOT EXISTS idx_teams_sportradar ON Teams(SportRadarId);
CREATE INDEX IF NOT EXISTS idx_games_week_season ON Games(Week, Season);
CREATE INDEX IF NOT EXISTS idx_games_date ON Games(GameDate);
CREATE INDEX IF NOT EXISTS idx_games_sportradar ON Games(SportRadarId);
CREATE INDEX IF NOT EXISTS idx_survivor_games_commissioner ON SurvivorGames(CommissionerId);
CREATE INDEX IF NOT EXISTS idx_survivor_game_players_game ON SurvivorGamePlayers(SurvivorGameId);
CREATE INDEX IF NOT EXISTS idx_survivor_game_players_player ON SurvivorGamePlayers(PlayerId);
CREATE INDEX IF NOT EXISTS idx_player_picks_game_player ON PlayerPicks(SurvivorGameId, PlayerId);
CREATE INDEX IF NOT EXISTS idx_player_picks_week_season ON PlayerPicks(Week, Season);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON UserSessions(UserId);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON UserSessions(SessionToken);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON VerificationCodes(UserId);

-- Insert NFL Teams data with backend-compatible structure
INSERT INTO Teams (Alias, Market, Name, Conference, Division, FullName) VALUES
('ARI', 'Arizona', 'Cardinals', 'NFC', 'West', 'Arizona Cardinals'),
('ATL', 'Atlanta', 'Falcons', 'NFC', 'South', 'Atlanta Falcons'),
('BAL', 'Baltimore', 'Ravens', 'AFC', 'North', 'Baltimore Ravens'),
('BUF', 'Buffalo', 'Bills', 'AFC', 'East', 'Buffalo Bills'),
('CAR', 'Carolina', 'Panthers', 'NFC', 'South', 'Carolina Panthers'),
('CHI', 'Chicago', 'Bears', 'NFC', 'North', 'Chicago Bears'),
('CIN', 'Cincinnati', 'Bengals', 'AFC', 'North', 'Cincinnati Bengals'),
('CLE', 'Cleveland', 'Browns', 'AFC', 'North', 'Cleveland Browns'),
('DAL', 'Dallas', 'Cowboys', 'NFC', 'East', 'Dallas Cowboys'),
('DEN', 'Denver', 'Broncos', 'AFC', 'West', 'Denver Broncos'),
('DET', 'Detroit', 'Lions', 'NFC', 'North', 'Detroit Lions'),
('GB', 'Green Bay', 'Packers', 'NFC', 'North', 'Green Bay Packers'),
('HOU', 'Houston', 'Texans', 'AFC', 'South', 'Houston Texans'),
('IND', 'Indianapolis', 'Colts', 'AFC', 'South', 'Indianapolis Colts'),
('JAX', 'Jacksonville', 'Jaguars', 'AFC', 'South', 'Jacksonville Jaguars'),
('KC', 'Kansas City', 'Chiefs', 'AFC', 'West', 'Kansas City Chiefs'),
('LAC', 'Los Angeles', 'Chargers', 'AFC', 'West', 'Los Angeles Chargers'),
('LAR', 'Los Angeles', 'Rams', 'NFC', 'West', 'Los Angeles Rams'),
('LV', 'Las Vegas', 'Raiders', 'AFC', 'West', 'Las Vegas Raiders'),
('MIA', 'Miami', 'Dolphins', 'AFC', 'East', 'Miami Dolphins'),
('MIN', 'Minnesota', 'Vikings', 'NFC', 'North', 'Minnesota Vikings'),
('NE', 'New England', 'Patriots', 'AFC', 'East', 'New England Patriots'),
('NO', 'New Orleans', 'Saints', 'NFC', 'South', 'New Orleans Saints'),
('NYG', 'New York', 'Giants', 'NFC', 'East', 'New York Giants'),
('NYJ', 'New York', 'Jets', 'AFC', 'East', 'New York Jets'),
('PHI', 'Philadelphia', 'Eagles', 'NFC', 'East', 'Philadelphia Eagles'),
('PIT', 'Pittsburgh', 'Steelers', 'AFC', 'North', 'Pittsburgh Steelers'),
('SEA', 'Seattle', 'Seahawks', 'NFC', 'West', 'Seattle Seahawks'),
('SF', 'San Francisco', '49ers', 'NFC', 'West', 'San Francisco 49ers'),
('TB', 'Tampa Bay', 'Buccaneers', 'NFC', 'South', 'Tampa Bay Buccaneers'),
('TEN', 'Tennessee', 'Titans', 'AFC', 'South', 'Tennessee Titans'),
('WAS', 'Washington', 'Commanders', 'NFC', 'East', 'Washington Commanders')
ON CONFLICT (Alias) DO NOTHING;

-- Create updated_at trigger function (PostgreSQL compatible)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.UpdatedAt = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (PostgreSQL compatible names)
DROP TRIGGER IF EXISTS update_users_updated_at ON Users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON Users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON Teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON Teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON Games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON Games FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_survivor_games_updated_at ON SurvivorGames;
CREATE TRIGGER update_survivor_games_updated_at BEFORE UPDATE ON SurvivorGames FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_survivor_game_players_updated_at ON SurvivorGamePlayers;
CREATE TRIGGER update_survivor_game_players_updated_at BEFORE UPDATE ON SurvivorGamePlayers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_picks_updated_at ON PlayerPicks;
CREATE TRIGGER update_player_picks_updated_at BEFORE UPDATE ON PlayerPicks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_sessions_updated_at ON UserSessions;
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON UserSessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

SELECT 'Backend-compatible database schema created successfully!' as status;