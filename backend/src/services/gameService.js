const db = require('../config/database');
const sportRadarService = require('./sportRadarService');
const logger = require('../utils/logger');

class GameService {
    constructor() {
        this.currentSeason = parseInt(process.env.CURRENT_NFL_SEASON) || new Date().getFullYear();
    }

    /**
     * Sync NFL teams from SportRadar to database
     */
    async syncNFLTeams() {
        try {
            logger.info('Starting NFL teams sync from SportRadar');
            
            // Get current season data to extract team information
            const scheduleData = await sportRadarService.getCurrentSeasonSchedule();
            
            if (!scheduleData || scheduleData.length === 0) {
                throw new Error('No schedule data available for team sync');
            }

            const teams = new Map();
            
            // Extract unique teams from schedule
            scheduleData.forEach(game => {
                if (game.homeTeam && game.homeTeam.id) {
                    teams.set(game.homeTeam.id, {
                        sportRadarId: game.homeTeam.id,
                        name: game.homeTeam.name,
                        alias: game.homeTeam.alias,
                        market: game.homeTeam.market,
                        fullName: `${game.homeTeam.market} ${game.homeTeam.name}`
                    });
                }
                
                if (game.awayTeam && game.awayTeam.id) {
                    teams.set(game.awayTeam.id, {
                        sportRadarId: game.awayTeam.id,
                        name: game.awayTeam.name,
                        alias: game.awayTeam.alias,
                        market: game.awayTeam.market,
                        fullName: `${game.awayTeam.market} ${game.awayTeam.name}`
                    });
                }
            });

            logger.info(`Found ${teams.size} unique teams to sync`);

            // Update database with team information
            for (const [teamId, teamData] of teams) {
                try {
                    await db.query(`
                        UPDATE Teams 
                        SET SportRadarId = @sportRadarId,
                            Name = @name,
                            Alias = @alias,
                            Market = @market,
                            FullName = @fullName,
                            UpdatedAt = GETDATE()
                        WHERE Alias = @alias OR SportRadarId = @sportRadarId
                    `, {
                        sportRadarId: teamData.sportRadarId,
                        name: teamData.name,
                        alias: teamData.alias,
                        market: teamData.market,
                        fullName: teamData.fullName
                    });
                    
                    logger.debug(`Updated team: ${teamData.fullName} (${teamData.alias})`);
                } catch (error) {
                    logger.error(`Failed to update team ${teamData.alias}:`, error.message);
                }
            }

            logger.info('NFL teams sync completed successfully');
            return { success: true, teamsProcessed: teams.size };
        } catch (error) {
            logger.error('Failed to sync NFL teams:', error.message);
            throw error;
        }
    }

    /**
     * Sync current week games from SportRadar to database
     */
    async syncCurrentWeekGames() {
        try {
            logger.info('Starting current week games sync');
            
            const games = await sportRadarService.getCurrentWeekSchedule();
            
            if (!games || games.length === 0) {
                logger.warn('No games found for current week');
                return { success: true, gamesProcessed: 0 };
            }

            let gamesProcessed = 0;
            let gamesUpdated = 0;
            let gamesCreated = 0;

            for (const game of games) {
                try {
                    // Get team IDs from database
                    const homeTeam = await this.getTeamByAlias(game.homeTeam.alias);
                    const awayTeam = await this.getTeamByAlias(game.awayTeam.alias);

                    if (!homeTeam || !awayTeam) {
                        logger.warn(`Skipping game ${game.gameId}: Missing team data for ${game.homeTeam.alias} vs ${game.awayTeam.alias}`);
                        continue;
                    }

                    // Check if game already exists
                    const existingGame = await db.query(`
                        SELECT GameId FROM Games WHERE SportRadarId = @sportRadarId
                    `, { sportRadarId: game.gameId });

                    if (existingGame.length > 0) {
                        // Update existing game
                        await db.query(`
                            UPDATE Games 
                            SET HomeTeamScore = @homeScore,
                                AwayTeamScore = @awayScore,
                                Status = @status,
                                GameDate = @gameDate,
                                UpdatedAt = GETDATE()
                            WHERE SportRadarId = @sportRadarId
                        `, {
                            homeScore: null, // Will be updated when boxscore is available
                            awayScore: null,
                            status: game.status,
                            gameDate: new Date(game.scheduled),
                            sportRadarId: game.gameId
                        });
                        gamesUpdated++;
                    } else {
                        // Create new game
                        await db.query(`
                            INSERT INTO Games (
                                SportRadarId, Week, Season, HomeTeamId, AwayTeamId, 
                                GameDate, Status, CreatedAt, UpdatedAt
                            ) VALUES (
                                @sportRadarId, @week, @season, @homeTeamId, @awayTeamId,
                                @gameDate, @status, GETDATE(), GETDATE()
                            )
                        `, {
                            sportRadarId: game.gameId,
                            week: game.week,
                            season: game.season,
                            homeTeamId: homeTeam.TeamId,
                            awayTeamId: awayTeam.TeamId,
                            gameDate: new Date(game.scheduled),
                            status: game.status
                        });
                        gamesCreated++;
                    }

                    gamesProcessed++;
                } catch (error) {
                    logger.error(`Failed to process game ${game.gameId}:`, error.message);
                }
            }

            logger.info(`Games sync completed: ${gamesProcessed} processed, ${gamesCreated} created, ${gamesUpdated} updated`);
            return { 
                success: true, 
                gamesProcessed, 
                gamesCreated, 
                gamesUpdated 
            };
        } catch (error) {
            logger.error('Failed to sync current week games:', error.message);
            throw error;
        }
    }

    /**
     * Update game scores from SportRadar
     */
    async updateGameScores(gameIds = null) {
        try {
            logger.info('Starting game scores update');

            let games;
            if (gameIds && Array.isArray(gameIds)) {
                // Update specific games
                const placeholders = gameIds.map((_, index) => `@gameId${index}`).join(',');
                const params = {};
                gameIds.forEach((id, index) => {
                    params[`gameId${index}`] = id;
                });
                
                games = await db.query(`
                    SELECT GameId, SportRadarId, HomeTeamId, AwayTeamId, Status
                    FROM Games 
                    WHERE SportRadarId IN (${placeholders})
                `, params);
            } else {
                // Update all games from current week that are not finalized
                games = await db.query(`
                    SELECT GameId, SportRadarId, HomeTeamId, AwayTeamId, Status
                    FROM Games 
                    WHERE Week = (
                        SELECT MAX(Week) FROM Games WHERE Season = @season
                    ) AND Season = @season
                    AND Status NOT IN ('closed', 'complete', 'final')
                `, { season: this.currentSeason });
            }

            if (!games || games.length === 0) {
                logger.info('No games found to update scores');
                return { success: true, gamesUpdated: 0 };
            }

            const sportRadarIds = games.map(game => game.SportRadarId);
            const { boxscores, errors } = await sportRadarService.getMultipleBoxscores(sportRadarIds);

            let gamesUpdated = 0;
            let gamesFinalized = 0;

            for (const result of boxscores) {
                if (!result.success) {
                    logger.warn(`Failed to get boxscore for game ${result.gameId}: ${result.error}`);
                    continue;
                }

                const game = games.find(g => g.SportRadarId === result.gameId);
                const boxscore = result.boxscore;

                if (!game || !boxscore) continue;

                try {
                    // Update game with scores and status
                    await db.query(`
                        UPDATE Games 
                        SET HomeTeamScore = @homeScore,
                            AwayTeamScore = @awayScore,
                            Status = @status,
                            IsComplete = @isComplete,
                            UpdatedAt = GETDATE()
                        WHERE GameId = @gameId
                    `, {
                        homeScore: boxscore.homeTeam.points,
                        awayScore: boxscore.awayTeam.points,
                        status: boxscore.status,
                        isComplete: boxscore.isComplete,
                        gameId: game.GameId
                    });

                    gamesUpdated++;

                    // If game is complete, process Survivor picks
                    if (boxscore.isComplete) {
                        await this.processGameResult(game.GameId, boxscore);
                        gamesFinalized++;
                    }

                    logger.debug(`Updated game ${game.SportRadarId}: ${boxscore.awayTeam.alias} ${boxscore.awayTeam.points} - ${boxscore.homeTeam.points} ${boxscore.homeTeam.alias} (${boxscore.status})`);
                } catch (error) {
                    logger.error(`Failed to update game ${game.GameId}:`, error.message);
                }
            }

            logger.info(`Scores update completed: ${gamesUpdated} games updated, ${gamesFinalized} games finalized`);
            return { 
                success: true, 
                gamesUpdated, 
                gamesFinalized,
                errors: errors.length 
            };
        } catch (error) {
            logger.error('Failed to update game scores:', error.message);
            throw error;
        }
    }

    /**
     * Process game result and update player picks
     */
    async processGameResult(gameId, boxscore) {
        try {
            logger.info(`Processing game result for game ${gameId}`);

            // Determine winner
            const gameResult = sportRadarService.determineWinner(
                boxscore.homeTeam.id,
                boxscore.awayTeam.id,
                boxscore.homeTeam.points,
                boxscore.awayTeam.points
            );

            // Get all picks for this game
            const picks = await db.query(`
                SELECT p.PickId, p.PlayerId, p.TeamId, p.GameId, p.Week,
                       t.SportRadarId as PickedTeamSportRadarId,
                       g.CurrentSurvivorGameId
                FROM PlayerPicks p
                INNER JOIN Teams t ON p.TeamId = t.TeamId
                INNER JOIN Games g ON p.GameId = g.GameId
                INNER JOIN SurvivorGames sg ON g.CurrentSurvivorGameId = sg.GameId
                WHERE p.GameId = @gameId AND sg.Status = 'active'
            `, { gameId });

            if (!picks || picks.length === 0) {
                logger.info(`No active picks found for game ${gameId}`);
                return;
            }

            let correctPicks = 0;
            let incorrectPicks = 0;
            const playersToEliminate = [];

            for (const pick of picks) {
                const isCorrect = sportRadarService.isPickCorrect(
                    pick.PickedTeamSportRadarId, 
                    gameResult
                );

                if (isCorrect === null) {
                    // Tie game - handle based on game rules
                    logger.warn(`Tie game detected for game ${gameId}, pick ${pick.PickId}`);
                    continue;
                }

                // Update pick result
                await db.query(`
                    UPDATE PlayerPicks 
                    SET IsCorrect = @isCorrect,
                        ProcessedAt = GETDATE(),
                        UpdatedAt = GETDATE()
                    WHERE PickId = @pickId
                `, {
                    isCorrect: isCorrect,
                    pickId: pick.PickId
                });

                if (isCorrect) {
                    correctPicks++;
                } else {
                    incorrectPicks++;
                    playersToEliminate.push({
                        playerId: pick.PlayerId,
                        gameId: pick.CurrentSurvivorGameId,
                        week: pick.Week,
                        pickId: pick.PickId
                    });
                }
            }

            // Eliminate players with incorrect picks
            for (const elimination of playersToEliminate) {
                await this.eliminatePlayer(
                    elimination.playerId, 
                    elimination.gameId, 
                    elimination.week,
                    `Incorrect pick in Week ${elimination.week}`
                );
            }

            logger.info(`Game ${gameId} processed: ${correctPicks} correct picks, ${incorrectPicks} incorrect picks, ${playersToEliminate.length} eliminations`);

            return {
                correctPicks,
                incorrectPicks,
                eliminations: playersToEliminate.length
            };
        } catch (error) {
            logger.error(`Failed to process game result for game ${gameId}:`, error.message);
            throw error;
        }
    }

    /**
     * Eliminate a player from Survivor game
     */
    async eliminatePlayer(playerId, survivorGameId, week, reason) {
        try {
            // Update player status to eliminated
            await db.query(`
                UPDATE SurvivorGamePlayers 
                SET Status = 'eliminated',
                    EliminatedWeek = @week,
                    EliminatedReason = @reason,
                    EliminatedAt = GETDATE(),
                    UpdatedAt = GETDATE()
                WHERE SurvivorGameId = @gameId AND PlayerId = @playerId
            `, {
                week,
                reason,
                gameId: survivorGameId,
                playerId
            });

            logger.info(`Player ${playerId} eliminated from game ${survivorGameId} in week ${week}: ${reason}`);
            
            // Check if this was the last player - if so, end the game
            await this.checkGameCompletion(survivorGameId);
            
            return true;
        } catch (error) {
            logger.error(`Failed to eliminate player ${playerId}:`, error.message);
            throw error;
        }
    }

    /**
     * Check if Survivor game should be completed
     */
    async checkGameCompletion(survivorGameId) {
        try {
            const activePlayers = await db.query(`
                SELECT COUNT(*) as ActiveCount
                FROM SurvivorGamePlayers 
                WHERE SurvivorGameId = @gameId AND Status = 'active'
            `, { gameId: survivorGameId });

            const activeCount = activePlayers[0]?.ActiveCount || 0;

            if (activeCount <= 1) {
                // Game is complete - declare winner if there's 1 player left
                if (activeCount === 1) {
                    const winner = await db.query(`
                        SELECT PlayerId
                        FROM SurvivorGamePlayers 
                        WHERE SurvivorGameId = @gameId AND Status = 'active'
                    `, { gameId: survivorGameId });

                    if (winner.length > 0) {
                        await db.query(`
                            UPDATE SurvivorGames 
                            SET Status = 'completed',
                                WinnerId = @winnerId,
                                CompletedAt = GETDATE(),
                                UpdatedAt = GETDATE()
                            WHERE GameId = @gameId
                        `, {
                            winnerId: winner[0].PlayerId,
                            gameId: survivorGameId
                        });

                        logger.info(`Survivor game ${survivorGameId} completed with winner: ${winner[0].PlayerId}`);
                    }
                } else {
                    // No survivors - everyone eliminated
                    await db.query(`
                        UPDATE SurvivorGames 
                        SET Status = 'completed',
                            WinnerId = NULL,
                            CompletedAt = GETDATE(),
                            UpdatedAt = GETDATE()
                        WHERE GameId = @gameId
                    `, { gameId: survivorGameId });

                    logger.info(`Survivor game ${survivorGameId} completed with no survivors`);
                }
            }
        } catch (error) {
            logger.error(`Failed to check game completion for ${survivorGameId}:`, error.message);
        }
    }

    /**
     * Get team by alias from database
     */
    async getTeamByAlias(alias) {
        try {
            const result = await db.query(`
                SELECT TeamId, Name, Alias, SportRadarId
                FROM Teams 
                WHERE Alias = @alias OR UPPER(Alias) = UPPER(@alias)
            `, { alias });

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            logger.error(`Failed to get team by alias ${alias}:`, error.message);
            return null;
        }
    }

    /**
     * Get current week number
     */
    async getCurrentWeek() {
        try {
            const result = await db.query(`
                SELECT MAX(Week) as CurrentWeek
                FROM Games 
                WHERE Season = @season 
                AND GameDate <= GETDATE()
            `, { season: this.currentSeason });

            return result[0]?.CurrentWeek || 1;
        } catch (error) {
            logger.error('Failed to get current week:', error.message);
            return 1;
        }
    }

    /**
     * Get games for specific week
     */
    async getWeekGames(week, season = null) {
        try {
            const result = await db.query(`
                SELECT g.GameId, g.SportRadarId, g.Week, g.Season,
                       g.GameDate, g.Status, g.IsComplete,
                       g.HomeTeamScore, g.AwayTeamScore,
                       ht.Name as HomeTeamName, ht.Alias as HomeTeamAlias,
                       at.Name as AwayTeamName, at.Alias as AwayTeamAlias
                FROM Games g
                INNER JOIN Teams ht ON g.HomeTeamId = ht.TeamId
                INNER JOIN Teams at ON g.AwayTeamId = at.TeamId
                WHERE g.Week = @week 
                AND g.Season = @season
                ORDER BY g.GameDate
            `, { 
                week, 
                season: season || this.currentSeason 
            });

            return result;
        } catch (error) {
            logger.error(`Failed to get games for week ${week}:`, error.message);
            throw error;
        }
    }
}

module.exports = new GameService();