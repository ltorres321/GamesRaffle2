# SportRadar NFL API Integration

This document explains the SportRadar API integration implemented for the Survivor Sports Betting application.

## Overview

The application uses SportRadar's official NFL API v7.0 to fetch:
- Current NFL season schedules
- Weekly game schedules  
- Live game scores and results
- Team information

## API Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# SportRadar NFL API Configuration
SPORTRADAR_API_KEY="FprVFPIo5uZAI4XuXFy1HBbeEBfzWPVivbKVZ0Fc"
SPORTRADAR_BASE_URL="https://api.sportradar.com/nfl/official"
SPORTRADAR_ACCESS_LEVEL="trial"
SPORTRADAR_LANGUAGE="en"
SPORTRADAR_TIMEOUT=15000
SPORTRADAR_RETRY_ATTEMPTS=3
SPORTRADAR_RETRY_DELAY=2000
SPORTRADAR_CACHE_TTL=600
SPORTRADAR_SCHEDULE_CACHE_TTL=86400
SPORTRADAR_SCORE_CACHE_TTL=300
```

### Rate Limits

- **Trial Access**: 1,000 calls per month
- **Production Access**: Higher limits available
- **Caching**: Implemented to minimize API calls
- **Retry Logic**: Automatic retries with exponential backoff

## Core Services

### 1. SportRadarService (`src/services/sportRadarService.js`)

Main service for SportRadar API interactions:

```javascript
const sportRadarService = require('./services/sportRadarService');

// Get current week schedule
const schedule = await sportRadarService.getCurrentWeekSchedule();

// Get game boxscore
const boxscore = await sportRadarService.getGameBoxscore(gameId);

// Get full season schedule
const fullSchedule = await sportRadarService.getCurrentSeasonSchedule();
```

### 2. GameService (`src/services/gameService.js`)

Manages NFL game data and Survivor game logic:

```javascript
const gameService = require('./services/gameService');

// Sync NFL teams from SportRadar
await gameService.syncNFLTeams();

// Sync current week games
await gameService.syncCurrentWeekGames();

// Update game scores and process results
await gameService.updateGameScores();
```

### 3. ScheduledJobService (`src/services/scheduledJobService.js`)

Automated job scheduling for score updates:

- **Score Check**: Tuesday 3 AM (after Monday Night Football)
- **Schedule Update**: Daily 2 AM
- **Game Processing**: Every 15 minutes during game days

## API Endpoints

### Public Endpoints

```bash
# Get current week games
GET /api/games/current-week

# Get specific week games
GET /api/games/week/:week?season=2024

# Get game boxscore
GET /api/games/:gameId/boxscore

# Get current season schedule
GET /api/games/schedule/current-season

# Health check
GET /api/games/health
```

### Admin Endpoints (Authentication Required)

```bash
# Sync NFL teams from SportRadar
POST /api/games/sync/teams

# Sync current week games
POST /api/games/sync/current-week

# Update game scores
POST /api/games/update-scores
# Optional body: { "gameIds": ["game-id-1", "game-id-2"] }

# Get scheduled jobs status
GET /api/games/jobs/status

# Manually trigger jobs
POST /api/games/jobs/trigger/scoreCheck
POST /api/games/jobs/trigger/scheduleUpdate
POST /api/games/jobs/trigger/gameProcessing

# Get API usage statistics
GET /api/games/stats/api
```

## Database Schema

### Updated Tables

#### Teams Table
```sql
CREATE TABLE dbo.Teams (
    TeamId INT PRIMARY KEY IDENTITY(1,1),
    SportRadarId NVARCHAR(50) UNIQUE, -- SportRadar identifier
    Name NVARCHAR(100) NOT NULL,      -- e.g., 'Chiefs'
    Alias NVARCHAR(10) NOT NULL,      -- e.g., 'KC'
    Market NVARCHAR(100) NOT NULL,    -- e.g., 'Kansas City'
    FullName NVARCHAR(200) NOT NULL,  -- e.g., 'Kansas City Chiefs'
    Conference NVARCHAR(10) NOT NULL,
    Division NVARCHAR(20) NOT NULL,
    -- ... other fields
);
```

#### Games Table (NFL Games)
```sql
CREATE TABLE dbo.Games (
    GameId UNIQUEIDENTIFIER PRIMARY KEY,
    SportRadarId NVARCHAR(50) NOT NULL UNIQUE,
    Week INT NOT NULL,
    Season INT NOT NULL,
    HomeTeamId INT NOT NULL,
    AwayTeamId INT NOT NULL,
    HomeTeamScore INT,
    AwayTeamScore INT,
    Status NVARCHAR(20) NOT NULL,
    IsComplete BIT NOT NULL DEFAULT 0,
    -- ... other fields
);
```

## Caching Strategy

### Redis Cache Keys

- `sportradar:schedule:current_week:{season}` - Current week schedule (24h TTL)
- `sportradar:schedule:current_season:{season}` - Full season schedule (24h TTL)
- `sportradar:boxscore:{gameId}` - Game boxscore (5min TTL)
- `sportradar:api_stats` - API usage statistics (24h TTL)

### Cache Invalidation

- Schedules: Automatically expire after 24 hours
- Boxscores: Expire after 5 minutes during live games
- Final scores: Cached permanently once game is complete

## Survivor Game Logic

### Pick Validation

1. **Team Selection**: Players pick one team per week to win
2. **Reuse Prevention**: Teams can't be picked again in same season
3. **Deadline Enforcement**: Picks must be submitted before game kickoff
4. **Multiple Picks**: Week 12+ requires two picks per week

### Elimination Process

1. **Score Processing**: Automated after game completion
2. **Result Determination**: Compare picked team vs actual winner
3. **Player Elimination**: Incorrect picks result in elimination
4. **Game Completion**: Last player standing wins

### Automated Processing

```javascript
// Triggered automatically on Tuesdays at 3 AM
async function processWeeklyResults() {
    // 1. Sync teams and games
    await gameService.syncNFLTeams();
    await gameService.syncCurrentWeekGames();
    
    // 2. Update scores and process picks
    await gameService.updateGameScores();
    // This automatically eliminates players with incorrect picks
    
    // 3. Check for game completion
    // If only one player remains, declare winner
}
```

## Error Handling

### API Errors

- **Rate Limit Exceeded**: Implements exponential backoff
- **Network Failures**: Automatic retry with configurable attempts
- **Invalid Data**: Graceful handling with detailed logging
- **Timeout**: Configurable timeout with fallback behavior

### Data Validation

- **Team Mapping**: Validates SportRadar teams against database
- **Score Validation**: Ensures scores are valid integers
- **Game Status**: Validates game completion before processing picks

## Monitoring & Logging

### API Usage Tracking

```javascript
// Get current API statistics
const stats = await sportRadarService.getApiStats();
// Returns: { requestCount, errorCount, lastRequest, cacheHits, cacheMisses }
```

### Scheduled Job Monitoring

```javascript
// Get job status and next run times
const status = scheduledJobService.getStatus();
const nextRuns = scheduledJobService.getNextRunTimes();
```

### Health Checks

```bash
# Application health
GET /health

# Games service health  
GET /api/games/health
```

## Development & Testing

### Manual API Testing

```bash
# Test SportRadar connection
curl -X GET "https://api.sportradar.com/nfl/official/trial/v7/en/games/current_week/schedule.json?api_key=YOUR_API_KEY"

# Test application endpoints
curl http://localhost:8000/api/games/current-week
curl http://localhost:8000/api/games/health
```

### Database Setup

1. Run the updated schema:
```sql
-- Use the SportRadar-compatible schema
-- File: database/create-schema-sportradar.sql
```

2. Insert seed data:
```sql  
-- Insert NFL teams and admin user
-- File: database/seed-data-sportradar.sql
```

3. Sync with SportRadar:
```bash
# After application startup
POST /api/games/sync/teams
POST /api/games/sync/current-week
```

## Production Deployment

### Environment Setup

1. **API Key**: Upgrade to production SportRadar subscription
2. **Caching**: Ensure Redis is properly configured
3. **Monitoring**: Enable Application Insights
4. **Scaling**: Consider API rate limits for production traffic

### Performance Optimization

- **Batch Processing**: Multiple games processed simultaneously
- **Smart Caching**: Longer TTL for completed games
- **Rate Limit Respect**: Built-in delays between API calls
- **Error Recovery**: Automatic retry with circuit breaker pattern

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Verify key in environment variables
2. **Rate Limit Exceeded**: Check API usage statistics
3. **Cache Issues**: Clear Redis cache if data seems stale
4. **Database Sync**: Run manual sync if teams/games missing

### Debug Commands

```bash
# Check job status
GET /api/games/jobs/status

# Check API statistics  
GET /api/games/stats/api

# Manual sync (admin only)
POST /api/games/sync/teams
POST /api/games/update-scores

# Trigger jobs manually
POST /api/games/jobs/trigger/scoreCheck
```

This integration provides a robust, production-ready solution for NFL data management in the Survivor Sports Betting application.