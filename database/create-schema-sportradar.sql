-- Survivor Sports Betting App - Updated Database Schema for SportRadar Integration
-- This script creates all tables, indexes, and constraints needed for the application
-- Run this after Azure infrastructure deployment

USE [SurvivorSportsDB];
GO

-- Drop existing tables if they exist (for development/testing)
IF OBJECT_ID('dbo.PlayerPicks', 'U') IS NOT NULL DROP TABLE dbo.PlayerPicks;
IF OBJECT_ID('dbo.GameHistory', 'U') IS NOT NULL DROP TABLE dbo.GameHistory;
IF OBJECT_ID('dbo.SurvivorGamePlayers', 'U') IS NOT NULL DROP TABLE dbo.SurvivorGamePlayers;
IF OBJECT_ID('dbo.Games', 'U') IS NOT NULL DROP TABLE dbo.Games;
IF OBJECT_ID('dbo.SurvivorGames', 'U') IS NOT NULL DROP TABLE dbo.SurvivorGames;
IF OBJECT_ID('dbo.UserVerification', 'U') IS NOT NULL DROP TABLE dbo.UserVerification;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Teams', 'U') IS NOT NULL DROP TABLE dbo.Teams;
GO

-- Create Users table
CREATE TABLE dbo.Users (
    UserId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NOT NULL,
    PhoneNumber NVARCHAR(20),
    Role NVARCHAR(20) NOT NULL DEFAULT 'Player' CHECK (Role IN ('Player', 'Admin', 'SuperAdmin')),
    IsVerified BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastLoginAt DATETIME2,
    RefreshToken NVARCHAR(500),
    RefreshTokenExpiresAt DATETIME2
);
GO

-- Create Teams table (NFL teams with SportRadar integration)
CREATE TABLE dbo.Teams (
    TeamId INT PRIMARY KEY IDENTITY(1,1),
    SportRadarId NVARCHAR(50) UNIQUE, -- SportRadar team identifier
    Name NVARCHAR(100) NOT NULL, -- e.g., 'Chiefs', 'Giants'
    Alias NVARCHAR(10) NOT NULL UNIQUE, -- e.g., 'KC', 'NYG', 'BUF'
    Market NVARCHAR(100) NOT NULL, -- e.g., 'Kansas City', 'New York'
    FullName NVARCHAR(200) NOT NULL, -- e.g., 'Kansas City Chiefs'
    Conference NVARCHAR(10) NOT NULL CHECK (Conference IN ('AFC', 'NFC')),
    Division NVARCHAR(20) NOT NULL, -- e.g., 'West', 'East', 'North', 'South'
    PrimaryColor NVARCHAR(10), -- Hex color code
    SecondaryColor NVARCHAR(10), -- Hex color code
    LogoUrl NVARCHAR(500),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create SurvivorGames table (Survivor game instances)
CREATE TABLE dbo.SurvivorGames (
    GameId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GameName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    CreatedByUserId UNIQUEIDENTIFIER NOT NULL,
    EntryFee DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    PrizePool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    MaxParticipants INT,
    StartWeek INT NOT NULL DEFAULT 1, -- NFL week to start
    EndWeek INT NOT NULL DEFAULT 18, -- NFL week to end
    RequireTwoPicksFromWeek INT NOT NULL DEFAULT 12, -- Week to require 2 picks
    Season INT NOT NULL, -- e.g., 2024
    Status NVARCHAR(20) NOT NULL DEFAULT 'open' CHECK (Status IN ('open', 'active', 'completed', 'cancelled')),
    WinnerId UNIQUEIDENTIFIER, -- Winner player ID
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CompletedAt DATETIME2,
    FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (WinnerId) REFERENCES dbo.Users(UserId)
);
GO

-- Create Games table (NFL games from SportRadar)
CREATE TABLE dbo.Games (
    GameId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SportRadarId NVARCHAR(50) NOT NULL UNIQUE, -- SportRadar game identifier
    Week INT NOT NULL,
    Season INT NOT NULL,
    GameDate DATETIME2 NOT NULL,
    HomeTeamId INT NOT NULL,
    AwayTeamId INT NOT NULL,
    HomeTeamScore INT,
    AwayTeamScore INT,
    Status NVARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, inprogress, closed, etc.
    IsComplete BIT NOT NULL DEFAULT 0,
    CurrentSurvivorGameId UNIQUEIDENTIFIER, -- Link to active survivor game
    Venue NVARCHAR(200),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (HomeTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (AwayTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (CurrentSurvivorGameId) REFERENCES dbo.SurvivorGames(GameId)
);
GO

-- Create SurvivorGamePlayers table (Players in specific survivor games)
CREATE TABLE dbo.SurvivorGamePlayers (
    ParticipantId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SurvivorGameId UNIQUEIDENTIFIER NOT NULL,
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'active' CHECK (Status IN ('active', 'eliminated')),
    EliminatedWeek INT,
    EliminatedReason NVARCHAR(200), -- e.g., 'Incorrect pick in Week 5'
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    EliminatedAt DATETIME2,
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (SurvivorGameId) REFERENCES dbo.SurvivorGames(GameId),
    FOREIGN KEY (PlayerId) REFERENCES dbo.Users(UserId),
    UNIQUE (SurvivorGameId, PlayerId)
);
GO

-- Create PlayerPicks table (User selections per week)
CREATE TABLE dbo.PlayerPicks (
    PickId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    GameId UNIQUEIDENTIFIER NOT NULL, -- NFL Game being picked
    TeamId INT NOT NULL, -- Team picked to win
    Week INT NOT NULL,
    PickNumber INT NOT NULL DEFAULT 1, -- 1 for first pick, 2 for second pick (week 12+)
    IsCorrect BIT, -- NULL until game result is known
    SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ProcessedAt DATETIME2, -- When the pick result was determined
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (PlayerId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId),
    FOREIGN KEY (TeamId) REFERENCES dbo.Teams(TeamId),
    UNIQUE (PlayerId, GameId, PickNumber) -- Each player can only pick each game once per pick number
);
GO

-- Create GameHistory table (Historical results and player performance)  
CREATE TABLE dbo.GameHistory (
    HistoryId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    SurvivorGameId UNIQUEIDENTIFIER NOT NULL,
    PlayerId UNIQUEIDENTIFIER NOT NULL,
    Week INT NOT NULL,
    NFLGameId UNIQUEIDENTIFIER,
    PickedTeamId INT,
    OpponentTeamId INT,
    PickResult NVARCHAR(20) CHECK (PickResult IN ('correct', 'incorrect', 'tie', 'no_pick')),
    Survived BIT NOT NULL DEFAULT 0,
    TotalWeeksSurvived INT NOT NULL DEFAULT 0,
    ProcessedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (SurvivorGameId) REFERENCES dbo.SurvivorGames(GameId),
    FOREIGN KEY (PlayerId) REFERENCES dbo.Users(UserId), 
    FOREIGN KEY (NFLGameId) REFERENCES dbo.Games(GameId),
    FOREIGN KEY (PickedTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (OpponentTeamId) REFERENCES dbo.Teams(TeamId),
    UNIQUE (SurvivorGameId, PlayerId, Week)
);
GO

-- Create UserVerification table (Age verification documents)
CREATE TABLE dbo.UserVerification (
    VerificationId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    DocumentType NVARCHAR(50) NOT NULL CHECK (DocumentType IN ('DriversLicense', 'Passport', 'StateId', 'Other')),
    DocumentUrl NVARCHAR(500) NOT NULL, -- Azure Blob Storage URL
    VerificationStatus NVARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (VerificationStatus IN ('Pending', 'Approved', 'Rejected', 'RequiresReview')),
    SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ReviewedAt DATETIME2,
    ReviewedByUserId UNIQUEIDENTIFIER,
    ReviewNotes NVARCHAR(1000),
    ExpiresAt DATETIME2, -- Document expiration date
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (ReviewedByUserId) REFERENCES dbo.Users(UserId)
);
GO

-- Create indexes for performance optimization
CREATE NONCLUSTERED INDEX IX_Users_Email ON dbo.Users(Email);
CREATE NONCLUSTERED INDEX IX_Users_Username ON dbo.Users(Username);
CREATE NONCLUSTERED INDEX IX_Users_IsVerified ON dbo.Users(IsVerified);
CREATE NONCLUSTERED INDEX IX_Users_Role ON dbo.Users(Role);
CREATE NONCLUSTERED INDEX IX_Users_IsActive ON dbo.Users(IsActive);

CREATE NONCLUSTERED INDEX IX_Teams_Alias ON dbo.Teams(Alias);
CREATE NONCLUSTERED INDEX IX_Teams_SportRadarId ON dbo.Teams(SportRadarId);
CREATE NONCLUSTERED INDEX IX_Teams_Conference ON dbo.Teams(Conference);

CREATE NONCLUSTERED INDEX IX_SurvivorGames_Status ON dbo.SurvivorGames(Status);
CREATE NONCLUSTERED INDEX IX_SurvivorGames_Season ON dbo.SurvivorGames(Season);
CREATE NONCLUSTERED INDEX IX_SurvivorGames_CreatedByUserId ON dbo.SurvivorGames(CreatedByUserId);

CREATE NONCLUSTERED INDEX IX_Games_Season_Week ON dbo.Games(Season, Week);
CREATE NONCLUSTERED INDEX IX_Games_GameDate ON dbo.Games(GameDate);
CREATE NONCLUSTERED INDEX IX_Games_Status ON dbo.Games(Status);
CREATE NONCLUSTERED INDEX IX_Games_SportRadarId ON dbo.Games(SportRadarId);
CREATE NONCLUSTERED INDEX IX_Games_IsComplete ON dbo.Games(IsComplete);

CREATE NONCLUSTERED INDEX IX_SurvivorGamePlayers_SurvivorGameId ON dbo.SurvivorGamePlayers(SurvivorGameId);
CREATE NONCLUSTERED INDEX IX_SurvivorGamePlayers_PlayerId ON dbo.SurvivorGamePlayers(PlayerId);
CREATE NONCLUSTERED INDEX IX_SurvivorGamePlayers_Status ON dbo.SurvivorGamePlayers(Status);

CREATE NONCLUSTERED INDEX IX_PlayerPicks_PlayerId_Week ON dbo.PlayerPicks(PlayerId, Week);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_GameId ON dbo.PlayerPicks(GameId);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_SubmittedAt ON dbo.PlayerPicks(SubmittedAt);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_IsCorrect ON dbo.PlayerPicks(IsCorrect);

CREATE NONCLUSTERED INDEX IX_GameHistory_SurvivorGameId_PlayerId ON dbo.GameHistory(SurvivorGameId, PlayerId);
CREATE NONCLUSTERED INDEX IX_GameHistory_Week ON dbo.GameHistory(Week);
CREATE NONCLUSTERED INDEX IX_GameHistory_PickResult ON dbo.GameHistory(PickResult);

CREATE NONCLUSTERED INDEX IX_UserVerification_UserId ON dbo.UserVerification(UserId);
CREATE NONCLUSTERED INDEX IX_UserVerification_Status ON dbo.UserVerification(VerificationStatus);
CREATE NONCLUSTERED INDEX IX_UserVerification_SubmittedAt ON dbo.UserVerification(SubmittedAt);

GO

-- Create triggers for UpdatedAt columns
CREATE TRIGGER TR_Users_UpdatedAt ON dbo.Users
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.Users u
    INNER JOIN inserted i ON u.UserId = i.UserId;
END;
GO

CREATE TRIGGER TR_Teams_UpdatedAt ON dbo.Teams
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Teams 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.Teams t
    INNER JOIN inserted i ON t.TeamId = i.TeamId;
END;
GO

CREATE TRIGGER TR_SurvivorGames_UpdatedAt ON dbo.SurvivorGames
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.SurvivorGames 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.SurvivorGames g
    INNER JOIN inserted i ON g.GameId = i.GameId;
END;
GO

CREATE TRIGGER TR_Games_UpdatedAt ON dbo.Games
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Games 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.Games g
    INNER JOIN inserted i ON g.GameId = i.GameId;
END;
GO

CREATE TRIGGER TR_SurvivorGamePlayers_UpdatedAt ON dbo.SurvivorGamePlayers
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.SurvivorGamePlayers 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.SurvivorGamePlayers sgp
    INNER JOIN inserted i ON sgp.ParticipantId = i.ParticipantId;
END;
GO

CREATE TRIGGER TR_PlayerPicks_UpdatedAt ON dbo.PlayerPicks
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.PlayerPicks 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.PlayerPicks pp
    INNER JOIN inserted i ON pp.PickId = i.PickId;
END;
GO

PRINT 'SportRadar-compatible database schema created successfully!';
PRINT 'Key changes from original schema:';
PRINT '- Teams table updated with SportRadar fields (SportRadarId, Name, Alias, Market, FullName)';
PRINT '- Games table redesigned for NFL games with SportRadar integration';
PRINT '- SurvivorGames table separated for survivor game instances';
PRINT '- SurvivorGamePlayers table for player participation tracking';
PRINT '- PlayerPicks simplified for easier pick management';
PRINT '- All tables optimized for SportRadar API integration';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Run seed-data-sportradar.sql to populate NFL teams';
PRINT '2. Create admin user account';
PRINT '3. Deploy backend application code with SportRadar integration';
GO