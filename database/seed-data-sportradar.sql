-- Survivor Sports Betting App - Seed Data for SportRadar Integration
-- This script populates the database with initial data including all 32 NFL teams
-- Compatible with SportRadar API structure

USE [SurvivorSportsDB];
GO

-- Insert all 32 NFL teams with SportRadar-compatible structure
INSERT INTO dbo.Teams (Name, Alias, Market, FullName, Conference, Division, PrimaryColor, SecondaryColor) VALUES
-- AFC East
('Bills', 'BUF', 'Buffalo', 'Buffalo Bills', 'AFC', 'East', '#00338D', '#C60C30'),
('Dolphins', 'MIA', 'Miami', 'Miami Dolphins', 'AFC', 'East', '#008E97', '#FC4C02'),
('Patriots', 'NE', 'New England', 'New England Patriots', 'AFC', 'East', '#002244', '#C60C30'),
('Jets', 'NYJ', 'New York', 'New York Jets', 'AFC', 'East', '#125740', '#FFFFFF'),

-- AFC North  
('Ravens', 'BAL', 'Baltimore', 'Baltimore Ravens', 'AFC', 'North', '#241773', '#9E7C0C'),
('Bengals', 'CIN', 'Cincinnati', 'Cincinnati Bengals', 'AFC', 'North', '#FB4F14', '#000000'),
('Browns', 'CLE', 'Cleveland', 'Cleveland Browns', 'AFC', 'North', '#311D00', '#FF3C00'),
('Steelers', 'PIT', 'Pittsburgh', 'Pittsburgh Steelers', 'AFC', 'North', '#FFB612', '#101820'),

-- AFC South
('Texans', 'HOU', 'Houston', 'Houston Texans', 'AFC', 'South', '#03202F', '#A71930'),
('Colts', 'IND', 'Indianapolis', 'Indianapolis Colts', 'AFC', 'South', '#002C5F', '#A2AAAD'),
('Jaguars', 'JAX', 'Jacksonville', 'Jacksonville Jaguars', 'AFC', 'South', '#006778', '#9F792C'),
('Titans', 'TEN', 'Tennessee', 'Tennessee Titans', 'AFC', 'South', '#0C2340', '#4B92DB'),

-- AFC West
('Broncos', 'DEN', 'Denver', 'Denver Broncos', 'AFC', 'West', '#FB4F14', '#002244'),
('Chiefs', 'KC', 'Kansas City', 'Kansas City Chiefs', 'AFC', 'West', '#E31837', '#FFB612'),
('Raiders', 'LV', 'Las Vegas', 'Las Vegas Raiders', 'AFC', 'West', '#000000', '#A5ACAF'),
('Chargers', 'LAC', 'Los Angeles', 'Los Angeles Chargers', 'AFC', 'West', '#0080C6', '#FFC20E'),

-- NFC East
('Cowboys', 'DAL', 'Dallas', 'Dallas Cowboys', 'NFC', 'East', '#003594', '#041E42'),
('Giants', 'NYG', 'New York', 'New York Giants', 'NFC', 'East', '#0B2265', '#A71930'),
('Eagles', 'PHI', 'Philadelphia', 'Philadelphia Eagles', 'NFC', 'East', '#004C54', '#A5ACAF'),
('Commanders', 'WAS', 'Washington', 'Washington Commanders', 'NFC', 'East', '#5A1414', '#FFB612'),

-- NFC North
('Bears', 'CHI', 'Chicago', 'Chicago Bears', 'NFC', 'North', '#0B162A', '#C83803'),
('Lions', 'DET', 'Detroit', 'Detroit Lions', 'NFC', 'North', '#0076B6', '#B0B7BC'),
('Packers', 'GB', 'Green Bay', 'Green Bay Packers', 'NFC', 'North', '#203731', '#FFB612'),
('Vikings', 'MIN', 'Minnesota', 'Minnesota Vikings', 'NFC', 'North', '#4F2683', '#FFC62F'),

-- NFC South
('Falcons', 'ATL', 'Atlanta', 'Atlanta Falcons', 'NFC', 'South', '#A71930', '#000000'),
('Panthers', 'CAR', 'Carolina', 'Carolina Panthers', 'NFC', 'South', '#0085CA', '#101820'),
('Saints', 'NO', 'New Orleans', 'New Orleans Saints', 'NFC', 'South', '#101820', '#D3BC8D'),
('Buccaneers', 'TB', 'Tampa Bay', 'Tampa Bay Buccaneers', 'NFC', 'South', '#D50A0A', '#FF7900'),

-- NFC West
('Cardinals', 'ARI', 'Arizona', 'Arizona Cardinals', 'NFC', 'West', '#97233F', '#000000'),
('Rams', 'LAR', 'Los Angeles', 'Los Angeles Rams', 'NFC', 'West', '#003594', '#FFA300'),
('49ers', 'SF', 'San Francisco', 'San Francisco 49ers', 'NFC', 'West', '#AA0000', '#B3995D'),
('Seahawks', 'SEA', 'Seattle', 'Seattle Seahawks', 'NFC', 'West', '#002244', '#69BE28');

GO

-- Create a sample admin user (password: Admin123!)
-- In production, this should be created through the registration process
INSERT INTO dbo.Users (
    Username, 
    Email, 
    PasswordHash, 
    FirstName, 
    LastName, 
    DateOfBirth, 
    Role, 
    IsVerified, 
    IsActive
) VALUES (
    'admin',
    'admin@survivorsports.com',
    '$2b$12$LQv3c1yqBwlVHpPqr5HpOeJHFd5ShQTMREE/gT4XNNhiCzH4CZzAu', -- Admin123!
    'System',
    'Administrator',
    '1990-01-01',
    'SuperAdmin',
    1,
    1
);

GO

-- Create a sample test survivor game for the current season
DECLARE @AdminUserId UNIQUEIDENTIFIER;
SELECT @AdminUserId = UserId FROM dbo.Users WHERE Username = 'admin';

INSERT INTO dbo.SurvivorGames (
    GameName,
    Description,
    CreatedByUserId,
    EntryFee,
    MaxParticipants,
    StartWeek,
    EndWeek,
    RequireTwoPicksFromWeek,
    Season,
    Status
) VALUES (
    'NFL Survivor 2024 - Main Pool',
    'Official NFL Survivor pool for the 2024 season. Pick one team each week to win. If your team loses, you''re eliminated! Starting Week 12, you must pick TWO teams each week.',
    @AdminUserId,
    25.00,
    100,
    1,
    18,
    12,
    2024,
    'open'
);

GO

-- Display summary of inserted data
SELECT 'Teams Created' as DataType, COUNT(*) as Count FROM dbo.Teams
UNION ALL
SELECT 'Users Created' as DataType, COUNT(*) as Count FROM dbo.Users  
UNION ALL
SELECT 'Survivor Games Created' as DataType, COUNT(*) as Count FROM dbo.SurvivorGames;

GO

PRINT 'SportRadar-compatible seed data inserted successfully!';
PRINT '';
PRINT 'Summary:';
PRINT '- 32 NFL teams inserted with SportRadar-compatible structure';
PRINT '- Admin user created (username: admin, password: Admin123!)';
PRINT '- Sample Survivor game created for 2024 season';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update Teams table with actual SportRadar IDs after first API sync';
PRINT '2. Configure backend with Azure connection strings';  
PRINT '3. Start the application server';
PRINT '4. Run initial data sync: POST /api/games/sync/teams';
GO