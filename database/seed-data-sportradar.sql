-- Survivor Sports Betting App - Seed Data for SportRadar Integration
-- This script populates the database with initial data including all 32 NFL teams
-- Compatible with SportRadar API structure

USE [SurvivorSportsDB];
GO

-- Clear existing data if any (in proper order)
DELETE FROM dbo.SurvivorGames WHERE CreatedByUserId IN (SELECT UserId FROM dbo.Users WHERE Username = 'admin');
DELETE FROM dbo.Users WHERE Username = 'admin';
DELETE FROM dbo.Teams;
GO

-- Drop ALL unique constraints and indexes on SportRadarId column
DECLARE @ConstraintName NVARCHAR(255);
DECLARE @IndexName NVARCHAR(255);
DECLARE @SQL NVARCHAR(500);

-- First, drop all UNIQUE KEY constraints on the Teams table
DECLARE constraint_cursor CURSOR FOR
SELECT name FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('dbo.Teams') 
AND type = 'UQ';

OPEN constraint_cursor;
FETCH NEXT FROM constraint_cursor INTO @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'ALTER TABLE dbo.Teams DROP CONSTRAINT [' + @ConstraintName + ']';
    EXEC sp_executesql @SQL;
    PRINT '✓ Dropped UNIQUE constraint: ' + @ConstraintName;
    FETCH NEXT FROM constraint_cursor INTO @ConstraintName;
END

CLOSE constraint_cursor;
DEALLOCATE constraint_cursor;

-- Next, drop all UNIQUE indexes that might be on SportRadarId
DECLARE index_cursor CURSOR FOR
SELECT i.name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.Teams')
AND c.name = 'SportRadarId'
AND i.is_unique = 1
AND i.type > 0; -- Exclude heaps

OPEN index_cursor;
FETCH NEXT FROM index_cursor INTO @IndexName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @SQL = 'DROP INDEX [' + @IndexName + '] ON dbo.Teams';
    EXEC sp_executesql @SQL;
    PRINT '✓ Dropped UNIQUE index: ' + @IndexName;
    FETCH NEXT FROM index_cursor INTO @IndexName;
END

CLOSE index_cursor;
DEALLOCATE index_cursor;
GO

-- Insert all 32 NFL teams with SportRadar-compatible structure
-- Note: SportRadarId will be populated later via API sync
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

-- Re-add a filtered UNIQUE constraint that allows multiple NULLs
-- This creates a unique index that ignores NULL values
CREATE UNIQUE NONCLUSTERED INDEX UQ_Teams_SportRadarId_Filtered 
ON dbo.Teams (SportRadarId) 
WHERE SportRadarId IS NOT NULL;

PRINT '✓ Created filtered UNIQUE index on SportRadarId (allows multiple NULLs)';

-- Verify all teams were inserted
DECLARE @TeamCount INT = (SELECT COUNT(*) FROM dbo.Teams);
IF @TeamCount = 32
    PRINT '✓ All 32 NFL teams inserted successfully'
ELSE
    PRINT '✗ Error: Expected 32 teams, found ' + CAST(@TeamCount AS VARCHAR(10));

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
    PhoneNumber,
    StreetAddress,
    City,
    State,
    ZipCode,
    Role,
    IsVerified,
    IsActive,
    EmailVerified,
    PhoneVerified
) VALUES (
    'admin',
    'admin@survivorsports.com',
    '$2b$12$LQv3c1yqBwlVHpPqr5HpOeJHFd5ShQTMREE/gT4XNNhiCzH4CZzAu', -- Admin123!
    'System',
    'Administrator',
    '1990-01-01',
    '+1-555-0123',
    '123 Admin Street',
    'Seattle',
    'WA',
    '98101',
    'SuperAdmin',
    1,
    1,
    1,
    1
);

GO

-- Verify admin user was created
IF EXISTS (SELECT 1 FROM dbo.Users WHERE Username = 'admin')
    PRINT '✓ Admin user created successfully'
ELSE
    PRINT '✗ Error: Failed to create admin user';

GO

-- Create a sample test survivor game for the current season
DECLARE @AdminUserId UNIQUEIDENTIFIER;
SELECT @AdminUserId = UserId FROM dbo.Users WHERE Username = 'admin';

IF @AdminUserId IS NOT NULL
BEGIN
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
        'NFL Survivor 2025 - Main Pool',
        'Official NFL Survivor pool for the 2025 season. Pick one team each week to win. If your team loses, you''re eliminated! Starting Week 12, you must pick TWO teams each week.',
        @AdminUserId,
        25.00,
        100,
        1,
        18,
        12,
        2025,
        'open'
    );
    
    PRINT '✓ Sample Survivor game created for 2025 season';
END
ELSE
BEGIN
    PRINT '✗ Error: Could not create Survivor game - admin user not found';
END

GO

-- Display summary of inserted data
PRINT '';
PRINT '=== DATABASE SEED SUMMARY ===';

DECLARE @TeamCount INT = (SELECT COUNT(*) FROM dbo.Teams);
DECLARE @UserCount INT = (SELECT COUNT(*) FROM dbo.Users);
DECLARE @GameCount INT = (SELECT COUNT(*) FROM dbo.SurvivorGames);

SELECT 'Teams' as DataType, @TeamCount as Count, CASE WHEN @TeamCount = 32 THEN '✓' ELSE '✗' END as Status
UNION ALL
SELECT 'Users' as DataType, @UserCount as Count, CASE WHEN @UserCount >= 1 THEN '✓' ELSE '✗' END as Status
UNION ALL
SELECT 'Survivor Games' as DataType, @GameCount as Count, CASE WHEN @GameCount >= 1 THEN '✓' ELSE '✗' END as Status;

GO

-- Display some sample team data to verify structure
PRINT '';
PRINT '=== SAMPLE TEAM DATA ===';
SELECT TOP 5 
    TeamId,
    Name,
    Alias,
    Market,
    FullName,
    Conference,
    Division,
    SportRadarId
FROM dbo.Teams
ORDER BY Conference, Division, Name;

GO

PRINT '';
PRINT '=== SEED DATA COMPLETED SUCCESSFULLY ===';
PRINT '';
PRINT 'What was created:';
PRINT '✓ 32 NFL teams with complete information';
PRINT '✓ SportRadar-compatible team structure';
PRINT '✓ Admin user account (username: admin, password: Admin123!)';
PRINT '✓ Sample Survivor game for 2025 season';
PRINT '✓ Filtered UNIQUE constraint on SportRadarId (allows multiple NULLs)';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Update SportRadarId values via API sync';
PRINT '2. Configure backend application';
PRINT '3. Test the admin login';
PRINT '4. Create additional users through the application';
PRINT '';
PRINT 'Important Notes:';
PRINT '- SportRadarId fields are currently NULL and will be populated during API sync';
PRINT '- Admin password is: Admin123! (change in production)';
PRINT '- All teams have official NFL colors and structure';
PRINT '- UNIQUE constraint now properly allows multiple NULL values';
GO