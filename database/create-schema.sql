-- Survivor Sports Betting App - Database Schema Creation Script
-- This script creates all tables, indexes, and constraints needed for the application
-- Run this after Azure infrastructure deployment

USE [SurvivorSportsDB];
GO

-- Drop existing tables if they exist (for development/testing)
IF OBJECT_ID('dbo.PlayerPicks', 'U') IS NOT NULL DROP TABLE dbo.PlayerPicks;
IF OBJECT_ID('dbo.GameHistory', 'U') IS NOT NULL DROP TABLE dbo.GameHistory;
IF OBJECT_ID('dbo.GameParticipants', 'U') IS NOT NULL DROP TABLE dbo.GameParticipants;
IF OBJECT_ID('dbo.NFLSchedule', 'U') IS NOT NULL DROP TABLE dbo.NFLSchedule;
IF OBJECT_ID('dbo.GameWeeks', 'U') IS NOT NULL DROP TABLE dbo.GameWeeks;
IF OBJECT_ID('dbo.Games', 'U') IS NOT NULL DROP TABLE dbo.Games;
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

-- Create Teams table (NFL teams)
CREATE TABLE dbo.Teams (
    TeamId INT PRIMARY KEY IDENTITY(1,1),
    TeamCode NVARCHAR(10) NOT NULL UNIQUE, -- e.g., 'KC', 'SF', 'BUF'
    TeamName NVARCHAR(100) NOT NULL, -- e.g., 'Kansas City Chiefs'
    City NVARCHAR(100) NOT NULL, -- e.g., 'Kansas City'
    Conference NVARCHAR(10) NOT NULL CHECK (Conference IN ('AFC', 'NFC')),
    Division NVARCHAR(20) NOT NULL, -- e.g., 'West', 'East', 'North', 'South'
    PrimaryColor NVARCHAR(10), -- Hex color code
    SecondaryColor NVARCHAR(10), -- Hex color code
    LogoUrl NVARCHAR(500),
    ESPNTeamId INT UNIQUE, -- ESPN API team identifier
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

-- Create Games table (Survivor game instances)
CREATE TABLE dbo.Games (
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
    Status NVARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (Status IN ('Open', 'InProgress', 'Completed', 'Cancelled')),
    WinnerUserId UNIQUEIDENTIFIER,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    StartDate DATETIME2,
    EndDate DATETIME2,
    FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (WinnerUserId) REFERENCES dbo.Users(UserId)
);
GO

-- Create GameWeeks table (Weekly game periods)
CREATE TABLE dbo.GameWeeks (
    GameWeekId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GameId UNIQUEIDENTIFIER NOT NULL,
    WeekNumber INT NOT NULL,
    StartDate DATETIME2 NOT NULL,
    EndDate DATETIME2 NOT NULL,
    PickDeadline DATETIME2 NOT NULL,
    RequiredPicks INT NOT NULL DEFAULT 1, -- Number of picks required this week
    Status NVARCHAR(20) NOT NULL DEFAULT 'Upcoming' CHECK (Status IN ('Upcoming', 'Open', 'Locked', 'InProgress', 'Completed')),
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId),
    UNIQUE (GameId, WeekNumber)
);
GO

-- Create NFLSchedule table (ESPN game data)
CREATE TABLE dbo.NFLSchedule (
    ScheduleId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ESPNGameId NVARCHAR(50) NOT NULL UNIQUE,
    Season INT NOT NULL,
    Week INT NOT NULL,
    GameDate DATETIME2 NOT NULL,
    HomeTeamId INT NOT NULL,
    AwayTeamId INT NOT NULL,
    HomeScore INT,
    AwayScore INT,
    WinnerTeamId INT,
    GameStatus NVARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (GameStatus IN ('Scheduled', 'InProgress', 'Final', 'Postponed', 'Cancelled')),
    IsPlayoffs BIT NOT NULL DEFAULT 0,
    LastUpdated DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (HomeTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (AwayTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (WinnerTeamId) REFERENCES dbo.Teams(TeamId)
);
GO

-- Create GameParticipants table (Users in specific games)
CREATE TABLE dbo.GameParticipants (
    ParticipantId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GameId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    IsEliminated BIT NOT NULL DEFAULT 0,
    EliminatedWeek INT,
    EliminatedReason NVARCHAR(200), -- e.g., 'Wrong pick', 'No pick submitted', 'Tie game'
    JoinedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    EliminatedAt DATETIME2,
    FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId),
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    UNIQUE (GameId, UserId)
);
GO

-- Create PlayerPicks table (User selections per week)
CREATE TABLE dbo.PlayerPicks (
    PickId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GameId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    GameWeekId UNIQUEIDENTIFIER NOT NULL,
    ScheduleId UNIQUEIDENTIFIER NOT NULL, -- The NFL game they're picking
    PickedTeamId INT NOT NULL, -- Team they picked to win
    PickNumber INT NOT NULL DEFAULT 1, -- 1 for first pick, 2 for second pick (week 12+)
    IsCorrect BIT, -- NULL until game result is known
    SubmittedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId),
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (GameWeekId) REFERENCES dbo.GameWeeks(GameWeekId),
    FOREIGN KEY (ScheduleId) REFERENCES dbo.NFLSchedule(ScheduleId),
    FOREIGN KEY (PickedTeamId) REFERENCES dbo.Teams(TeamId),
    UNIQUE (GameId, UserId, GameWeekId, PickNumber)
);
GO

-- Create GameHistory table (Historical results and player performance)
CREATE TABLE dbo.GameHistory (
    HistoryId UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    GameId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    WeekNumber INT NOT NULL,
    PickedTeamId INT,
    OpponentTeamId INT,
    PickResult NVARCHAR(20) CHECK (PickResult IN ('Correct', 'Incorrect', 'Tie', 'NoPickSubmitted')),
    WeekSurvived BIT NOT NULL DEFAULT 0,
    TotalWeeksSurvived INT NOT NULL DEFAULT 0,
    ProcessedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (GameId) REFERENCES dbo.Games(GameId),
    FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId),
    FOREIGN KEY (PickedTeamId) REFERENCES dbo.Teams(TeamId),
    FOREIGN KEY (OpponentTeamId) REFERENCES dbo.Teams(TeamId),
    UNIQUE (GameId, UserId, WeekNumber)
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

CREATE NONCLUSTERED INDEX IX_Teams_TeamCode ON dbo.Teams(TeamCode);
CREATE NONCLUSTERED INDEX IX_Teams_ESPNTeamId ON dbo.Teams(ESPNTeamId);
CREATE NONCLUSTERED INDEX IX_Teams_Conference ON dbo.Teams(Conference);

CREATE NONCLUSTERED INDEX IX_Games_Status ON dbo.Games(Status);
CREATE NONCLUSTERED INDEX IX_Games_Season ON dbo.Games(Season);
CREATE NONCLUSTERED INDEX IX_Games_CreatedByUserId ON dbo.Games(CreatedByUserId);
CREATE NONCLUSTERED INDEX IX_Games_StartDate ON dbo.Games(StartDate);

CREATE NONCLUSTERED INDEX IX_GameWeeks_GameId ON dbo.GameWeeks(GameId);
CREATE NONCLUSTERED INDEX IX_GameWeeks_WeekNumber ON dbo.GameWeeks(WeekNumber);
CREATE NONCLUSTERED INDEX IX_GameWeeks_Status ON dbo.GameWeeks(Status);
CREATE NONCLUSTERED INDEX IX_GameWeeks_PickDeadline ON dbo.GameWeeks(PickDeadline);

CREATE NONCLUSTERED INDEX IX_NFLSchedule_Season_Week ON dbo.NFLSchedule(Season, Week);
CREATE NONCLUSTERED INDEX IX_NFLSchedule_GameDate ON dbo.NFLSchedule(GameDate);
CREATE NONCLUSTERED INDEX IX_NFLSchedule_GameStatus ON dbo.NFLSchedule(GameStatus);
CREATE NONCLUSTERED INDEX IX_NFLSchedule_ESPNGameId ON dbo.NFLSchedule(ESPNGameId);

CREATE NONCLUSTERED INDEX IX_GameParticipants_GameId ON dbo.GameParticipants(GameId);
CREATE NONCLUSTERED INDEX IX_GameParticipants_UserId ON dbo.GameParticipants(UserId);
CREATE NONCLUSTERED INDEX IX_GameParticipants_IsEliminated ON dbo.GameParticipants(IsEliminated);

CREATE NONCLUSTERED INDEX IX_PlayerPicks_GameId_UserId ON dbo.PlayerPicks(GameId, UserId);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_GameWeekId ON dbo.PlayerPicks(GameWeekId);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_ScheduleId ON dbo.PlayerPicks(ScheduleId);
CREATE NONCLUSTERED INDEX IX_PlayerPicks_SubmittedAt ON dbo.PlayerPicks(SubmittedAt);

CREATE NONCLUSTERED INDEX IX_GameHistory_GameId_UserId ON dbo.GameHistory(GameId, UserId);
CREATE NONCLUSTERED INDEX IX_GameHistory_WeekNumber ON dbo.GameHistory(WeekNumber);
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

CREATE TRIGGER TR_GameWeeks_UpdatedAt ON dbo.GameWeeks
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.GameWeeks 
    SET UpdatedAt = GETUTCDATE() 
    FROM dbo.GameWeeks gw
    INNER JOIN inserted i ON gw.GameWeekId = i.GameWeekId;
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

PRINT 'Database schema created successfully!';
PRINT 'Next steps:';
PRINT '1. Run seed-data.sql to populate NFL teams';
PRINT '2. Create admin user account';
PRINT '3. Deploy backend application code';
GO