-- Survivor Sports Betting App - Seed Data Script
-- This script populates the database with NFL teams and initial data
-- Run this after create-schema.sql

USE [SurvivorSportsDB];
GO

-- Insert NFL Teams (2024 season data)
PRINT 'Inserting NFL Teams...';

INSERT INTO dbo.Teams (TeamCode, TeamName, City, Conference, Division, PrimaryColor, SecondaryColor, ESPNTeamId, LogoUrl) VALUES
-- AFC East
('BUF', 'Buffalo Bills', 'Buffalo', 'AFC', 'East', '#00338D', '#C60C30', 2, 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png'),
('MIA', 'Miami Dolphins', 'Miami', 'AFC', 'East', '#008E97', '#FC4C02', 15, 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png'),
('NE', 'New England Patriots', 'New England', 'AFC', 'East', '#002244', '#C60C30', 17, 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png'),
('NYJ', 'New York Jets', 'New York', 'AFC', 'East', '#125740', '#FFFFFF', 20, 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png'),

-- AFC North
('BAL', 'Baltimore Ravens', 'Baltimore', 'AFC', 'North', '#241773', '#000000', 33, 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png'),
('CIN', 'Cincinnati Bengals', 'Cincinnati', 'AFC', 'North', '#FB4F14', '#000000', 4, 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png'),
('CLE', 'Cleveland Browns', 'Cleveland', 'AFC', 'North', '#311D00', '#FF3C00', 5, 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png'),
('PIT', 'Pittsburgh Steelers', 'Pittsburgh', 'AFC', 'North', '#FFB612', '#101820', 23, 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png'),

-- AFC South
('HOU', 'Houston Texans', 'Houston', 'AFC', 'South', '#03202F', '#A71930', 34, 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png'),
('IND', 'Indianapolis Colts', 'Indianapolis', 'AFC', 'South', '#002C5F', '#A2AAAD', 11, 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png'),
('JAX', 'Jacksonville Jaguars', 'Jacksonville', 'AFC', 'South', '#101820', '#D7A22A', 30, 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png'),
('TEN', 'Tennessee Titans', 'Tennessee', 'AFC', 'South', '#0C2340', '#4B92DB', 10, 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png'),

-- AFC West
('DEN', 'Denver Broncos', 'Denver', 'AFC', 'West', '#FB4F14', '#002244', 7, 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png'),
('KC', 'Kansas City Chiefs', 'Kansas City', 'AFC', 'West', '#E31837', '#FFB81C', 12, 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png'),
('LV', 'Las Vegas Raiders', 'Las Vegas', 'AFC', 'West', '#000000', '#A5ACAF', 13, 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png'),
('LAC', 'Los Angeles Chargers', 'Los Angeles', 'AFC', 'West', '#0080C6', '#FFC20E', 24, 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png'),

-- NFC East
('DAL', 'Dallas Cowboys', 'Dallas', 'NFC', 'East', '#003594', '#041E42', 6, 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png'),
('NYG', 'New York Giants', 'New York', 'NFC', 'East', '#0B2265', '#A71930', 19, 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png'),
('PHI', 'Philadelphia Eagles', 'Philadelphia', 'NFC', 'East', '#004C54', '#A5ACAF', 21, 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png'),
('WAS', 'Washington Commanders', 'Washington', 'NFC', 'East', '#5A1414', '#FFB612', 28, 'https://a.espncdn.com/i/teamlogos/nfl/500/was.png'),

-- NFC North
('CHI', 'Chicago Bears', 'Chicago', 'NFC', 'North', '#0B162A', '#C83803', 3, 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png'),
('DET', 'Detroit Lions', 'Detroit', 'NFC', 'North', '#0076B6', '#B0B7BC', 8, 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png'),
('GB', 'Green Bay Packers', 'Green Bay', 'NFC', 'North', '#203731', '#FFB612', 9, 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png'),
('MIN', 'Minnesota Vikings', 'Minnesota', 'NFC', 'North', '#4F2683', '#FFC62F', 16, 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png'),

-- NFC South
('ATL', 'Atlanta Falcons', 'Atlanta', 'NFC', 'South', '#A71930', '#000000', 1, 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png'),
('CAR', 'Carolina Panthers', 'Carolina', 'NFC', 'South', '#0085CA', '#101820', 29, 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png'),
('NO', 'New Orleans Saints', 'New Orleans', 'NFC', 'South', '#101820', '#D3BC8D', 18, 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png'),
('TB', 'Tampa Bay Buccaneers', 'Tampa Bay', 'NFC', 'South', '#D50A0A', '#FF7900', 27, 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png'),

-- NFC West
('ARI', 'Arizona Cardinals', 'Arizona', 'NFC', 'West', '#97233F', '#000000', 22, 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png'),
('LAR', 'Los Angeles Rams', 'Los Angeles', 'NFC', 'West', '#003594', '#FFA300', 14, 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png'),
('SF', 'San Francisco 49ers', 'San Francisco', 'NFC', 'West', '#AA0000', '#B3995D', 25, 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png'),
('SEA', 'Seattle Seahawks', 'Seattle', 'NFC', 'West', '#002244', '#69BE28', 26, 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png');

PRINT 'NFL Teams inserted successfully!';

-- Create a default admin user (password will be hashed in application)
-- Password: AdminPass123! (hash this in your application)
PRINT 'Creating default admin user...';

DECLARE @AdminUserId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Users (
    UserId,
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
    @AdminUserId,
    'admin',
    'admin@survivorsports.com',
    '$2b$10$example.hash.replace.with.real.hash.in.application', -- Replace with actual hash
    'System',
    'Administrator',
    '1990-01-01',
    'SuperAdmin',
    1,
    1
);

PRINT 'Default admin user created with UserId: ' + CAST(@AdminUserId AS NVARCHAR(36));
PRINT 'Email: admin@survivorsports.com';
PRINT 'Password: AdminPass123! (CHANGE THIS IMMEDIATELY)';

-- Create sample survivor game for testing
PRINT 'Creating sample survivor game...';

DECLARE @SampleGameId UNIQUEIDENTIFIER = NEWID();

INSERT INTO dbo.Games (
    GameId,
    GameName,
    Description,
    CreatedByUserId,
    EntryFee,
    PrizePool,
    MaxParticipants,
    StartWeek,
    EndWeek,
    RequireTwoPicksFromWeek,
    Season,
    Status,
    StartDate,
    EndDate
) VALUES (
    @SampleGameId,
    '2024 NFL Survivor Challenge',
    'Pick one team each week to win their game. Pick wrong and you''re eliminated! Starting Week 12, you must pick TWO teams to win.',
    @AdminUserId,
    25.00,
    0.00, -- Will be calculated based on participants
    150,
    1,
    18,
    12,
    2024,
    'Open',
    '2024-09-05 00:00:00', -- Adjust to actual NFL season start
    '2025-01-06 23:59:59'  -- Adjust to actual NFL season end
);

-- Create game weeks for the sample game (18 weeks)
PRINT 'Creating game weeks for sample game...';

DECLARE @WeekCounter INT = 1;
DECLARE @BaseDate DATETIME2 = '2024-09-05'; -- Adjust to actual NFL season start

WHILE @WeekCounter <= 18
BEGIN
    DECLARE @WeekStartDate DATETIME2 = DATEADD(WEEK, @WeekCounter - 1, @BaseDate);
    DECLARE @WeekEndDate DATETIME2 = DATEADD(DAY, 6, @WeekStartDate);
    DECLARE @PickDeadline DATETIME2 = DATEADD(HOUR, 20, @WeekStartDate); -- Thursday 8 PM ET
    DECLARE @RequiredPicksForWeek INT = CASE WHEN @WeekCounter >= 12 THEN 2 ELSE 1 END;

    INSERT INTO dbo.GameWeeks (
        GameWeekId,
        GameId,
        WeekNumber,
        StartDate,
        EndDate,
        PickDeadline,
        RequiredPicks,
        Status
    ) VALUES (
        NEWID(),
        @SampleGameId,
        @WeekCounter,
        @WeekStartDate,
        @WeekEndDate,
        @PickDeadline,
        @RequiredPicksForWeek,
        CASE WHEN @WeekCounter = 1 THEN 'Open' ELSE 'Upcoming' END
    );

    SET @WeekCounter = @WeekCounter + 1;
END;

PRINT 'Sample game and weeks created successfully!';
PRINT 'Game ID: ' + CAST(@SampleGameId AS NVARCHAR(36));

-- Create some sample NFL schedule data (Week 1 only for testing)
PRINT 'Creating sample NFL schedule data for Week 1...';

-- Note: In production, this data should come from ESPN API
-- This is just sample data for testing purposes
INSERT INTO dbo.NFLSchedule (ScheduleId, ESPNGameId, Season, Week, GameDate, HomeTeamId, AwayTeamId, GameStatus) VALUES
(NEWID(), 'espn_401671716', 2024, 1, '2024-09-05 20:15:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'KC'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'BAL'), 'Scheduled'),
(NEWID(), 'espn_401671717', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'GB'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'PHI'), 'Scheduled'),
(NEWID(), 'espn_401671718', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'BUF'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'ARI'), 'Scheduled'),
(NEWID(), 'espn_401671719', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'CIN'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'NE'), 'Scheduled'),
(NEWID(), 'espn_401671720', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'HOU'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'IND'), 'Scheduled'),
(NEWID(), 'espn_401671721', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'MIA'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'JAX'), 'Scheduled'),
(NEWID(), 'espn_401671722', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'MIN'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'NYG'), 'Scheduled'),
(NEWID(), 'espn_401671723', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'NO'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'CAR'), 'Scheduled'),
(NEWID(), 'espn_401671724', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'PIT'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'ATL'), 'Scheduled'),
(NEWID(), 'espn_401671725', 2024, 1, '2024-09-08 13:00:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'TEN'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'CHI'), 'Scheduled'),
(NEWID(), 'espn_401671726', 2024, 1, '2024-09-08 16:05:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'LV'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'LAC'), 'Scheduled'),
(NEWID(), 'espn_401671727', 2024, 1, '2024-09-08 16:25:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'SEA'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'DEN'), 'Scheduled'),
(NEWID(), 'espn_401671728', 2024, 1, '2024-09-08 16:25:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'TB'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'WAS'), 'Scheduled'),
(NEWID(), 'espn_401671729', 2024, 1, '2024-09-08 20:20:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'LAR'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'DET'), 'Scheduled'),
(NEWID(), 'espn_401671730', 2024, 1, '2024-09-09 20:15:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'NYJ'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'SF'), 'Scheduled'),
(NEWID(), 'espn_401671731', 2024, 1, '2024-09-09 20:15:00', (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'CLE'), (SELECT TeamId FROM dbo.Teams WHERE TeamCode = 'DAL'), 'Scheduled');

PRINT 'Sample NFL schedule data created for Week 1!';

-- Display summary
PRINT '';
PRINT '========================================';
PRINT 'SEED DATA CREATION COMPLETE!';
PRINT '========================================';
PRINT 'Teams created: 32 NFL teams';
PRINT 'Admin user created: admin@survivorsports.com';
PRINT 'Sample game created: 2024 NFL Survivor Challenge';
PRINT 'Game weeks created: 18 weeks';
PRINT 'Sample schedule: Week 1 games';
PRINT '';
PRINT 'IMPORTANT NEXT STEPS:';
PRINT '1. Change the admin password immediately';
PRINT '2. Set up ESPN API integration to populate real schedule data';
PRINT '3. Deploy and test the backend application';
PRINT '4. Configure automated tasks for score checking';
PRINT '';

-- Verify data integrity
PRINT 'Verifying data integrity...';

SELECT 
    'Teams' as TableName, 
    COUNT(*) as RecordCount 
FROM dbo.Teams
UNION ALL
SELECT 
    'Users' as TableName, 
    COUNT(*) as RecordCount 
FROM dbo.Users
UNION ALL
SELECT 
    'Games' as TableName, 
    COUNT(*) as RecordCount 
FROM dbo.Games
UNION ALL
SELECT 
    'GameWeeks' as TableName, 
    COUNT(*) as RecordCount 
FROM dbo.GameWeeks
UNION ALL
SELECT 
    'NFLSchedule' as TableName, 
    COUNT(*) as RecordCount 
FROM dbo.NFLSchedule;

PRINT 'Database setup complete and verified!';
GO