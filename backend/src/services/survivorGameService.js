const { Pool } = require('pg');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Core Survivor Game Engine
 * Handles game creation, player management, pick validation, and elimination logic
 */
class SurvivorGameService {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
    }

    /**
     * Create a new survivor game
     */
    async createSurvivorGame(gameData, creatorUserId) {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            const gameId = uuidv4();
            
            // Insert survivor game
            const insertGameQuery = `
                INSERT INTO public.survivorgames (
                    gameid, gamename, description, createdbyuserid, entryfee, prizepool,
                    maxparticipants, startweek, endweek, requiretwopicksfromweek, season, status
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *
            `;

            const gameResult = await client.query(insertGameQuery, [
                gameId,
                gameData.gameName,
                gameData.description,
                creatorUserId,
                gameData.entryFee || 0,
                gameData.prizePool || 0,
                gameData.maxParticipants || 100,
                gameData.startWeek || 1,
                gameData.endWeek || 18,
                gameData.requireTwoPicksFromWeek || 12,
                gameData.season || 2024,
                'open'
            ]);

            await client.query('COMMIT');

            logger.info(`Created survivor game: ${gameData.gameName} (${gameId})`);

            return {
                success: true,
                gameId,
                game: this.transformGameData(gameResult.rows[0])
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to create survivor game:', error);
            throw new Error(`Failed to create survivor game: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Join a survivor game
     */
    async joinSurvivorGame(gameId, playerId) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Check if game exists and is open
            const gameQuery = 'SELECT * FROM public.survivorgames WHERE gameid = $1';
            const gameResult = await client.query(gameQuery, [gameId]);

            if (gameResult.rows.length === 0) {
                throw new Error('Survivor game not found');
            }

            const game = gameResult.rows[0];

            if (game.status !== 'open') {
                throw new Error('Game is not open for new participants');
            }

            // Check current participant count
            const participantCountQuery = 'SELECT COUNT(*) FROM public.survivorgameplayers WHERE survivorgameid = $1';
            const countResult = await client.query(participantCountQuery, [gameId]);
            const currentCount = parseInt(countResult.rows[0].count);

            if (game.maxparticipants && currentCount >= game.maxparticipants) {
                throw new Error('Game is full');
            }

            // Check if player already joined
            const existingQuery = 'SELECT * FROM public.survivorgameplayers WHERE survivorgameid = $1 AND playerid = $2';
            const existingResult = await client.query(existingQuery, [gameId, playerId]);

            if (existingResult.rows.length > 0) {
                throw new Error('Player already joined this game');
            }

            // Add player to game
            const participantId = uuidv4();
            const joinQuery = `
                INSERT INTO public.survivorgameplayers (
                    participantid, survivorgameid, playerid, status
                ) VALUES ($1, $2, $3, $4)
                RETURNING *
            `;

            const joinResult = await client.query(joinQuery, [participantId, gameId, playerId, 'active']);

            await client.query('COMMIT');

            logger.info(`Player ${playerId} joined survivor game ${gameId}`);

            return {
                success: true,
                participantId,
                participant: this.transformParticipantData(joinResult.rows[0])
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to join survivor game:', error);
            throw new Error(`Failed to join game: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Submit a pick for a player
     */
    async submitPick(gameId, playerId, week, teamId, gameIdNFL, pickNumber = 1) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            // Validate the pick
            await this.validatePick(client, gameId, playerId, week, teamId, gameIdNFL, pickNumber);

            const pickId = uuidv4();

            // Submit the pick
            const insertPickQuery = `
                INSERT INTO public.playerpicks (
                    pickid, playerid, gameid, teamid, week, picknumber
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (playerid, gameid, picknumber) 
                DO UPDATE SET teamid = $4, submittedat = CURRENT_TIMESTAMP
                RETURNING *
            `;

            const pickResult = await client.query(insertPickQuery, [
                pickId, playerId, gameIdNFL, teamId, week, pickNumber
            ]);

            await client.query('COMMIT');

            logger.info(`Pick submitted: Player ${playerId}, Week ${week}, Team ${teamId}`);

            return {
                success: true,
                pickId,
                pick: this.transformPickData(pickResult.rows[0])
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to submit pick:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Validate a pick before submission
     */
    async validatePick(client, gameId, playerId, week, teamId, gameIdNFL, pickNumber) {
        // Check if player is active in the game
        const participantQuery = `
            SELECT * FROM public.survivorgameplayers 
            WHERE survivorgameid = $1 AND playerid = $2 AND status = 'active'
        `;
        const participantResult = await client.query(participantQuery, [gameId, playerId]);

        if (participantResult.rows.length === 0) {
            throw new Error('Player is not active in this game');
        }

        // Check if NFL game exists and is not started
        const gameQuery = 'SELECT * FROM public.games WHERE gameid = $1';
        const gameResult = await client.query(gameQuery, [gameIdNFL]);

        if (gameResult.rows.length === 0) {
            throw new Error('NFL game not found');
        }

        const nflGame = gameResult.rows[0];
        
        if (nflGame.iscomplete) {
            throw new Error('Cannot pick on a completed game');
        }

        if (new Date(nflGame.gamedate) < new Date()) {
            throw new Error('Game has already started');
        }

        // Check if team is valid for this game
        if (nflGame.hometeamid !== teamId && nflGame.awayteamid !== teamId) {
            throw new Error('Team is not playing in this game');
        }

        // Check if player has already used this team this season
        const teamUsedQuery = `
            SELECT pp.* FROM public.playerpicks pp
            INNER JOIN public.games g ON pp.gameid = g.gameid
            WHERE pp.playerid = $1 AND pp.teamid = $2 AND g.season = $3
        `;
        const teamUsedResult = await client.query(teamUsedQuery, [playerId, teamId, nflGame.season]);

        if (teamUsedResult.rows.length > 0) {
            throw new Error('You have already used this team this season');
        }

        // Check if it's a week that requires two picks
        const survivorGameQuery = 'SELECT * FROM public.survivorgames WHERE gameid = $1';
        const survivorGameResult = await client.query(survivorGameQuery, [gameId]);
        const survivorGame = survivorGameResult.rows[0];

        if (week >= survivorGame.requiretwopicksfromweek && pickNumber === 1) {
            // For weeks requiring two picks, validate both picks together
            // This is a simplified check - full validation would happen when both picks are submitted
            logger.info(`Week ${week} requires two picks - validating pick ${pickNumber}`);
        }
    }

    /**
     * Process weekly results and eliminate players
     */
    async processWeeklyResults(gameId, week) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            logger.info(`Processing Week ${week} results for game ${gameId}`);

            // Get all picks for this week
            const picksQuery = `
                SELECT pp.*, g.hometeamid, g.awayteamid, g.hometeamscore, g.awayteamscore, 
                       g.iscomplete, g.status
                FROM public.playerpicks pp
                INNER JOIN public.games g ON pp.gameid = g.gameid
                WHERE g.week = $1 AND g.iscomplete = true
                AND pp.playerid IN (
                    SELECT playerid FROM public.survivorgameplayers 
                    WHERE survivorgameid = $2 AND status = 'active'
                )
            `;

            const picksResult = await client.query(picksQuery, [week, gameId]);
            const picks = picksResult.rows;

            let eliminatedCount = 0;

            for (const pick of picks) {
                const isCorrect = this.determinePickResult(pick);
                
                // Update pick result
                await client.query(
                    'UPDATE public.playerpicks SET iscorrect = $1, processedat = CURRENT_TIMESTAMP WHERE pickid = $2',
                    [isCorrect, pick.pickid]
                );

                // If pick is incorrect, eliminate player
                if (!isCorrect) {
                    await this.eliminatePlayer(client, gameId, pick.playerid, week, 'Incorrect pick');
                    eliminatedCount++;
                }

                // Record in game history
                await this.recordGameHistory(client, gameId, pick.playerid, week, pick, isCorrect);
            }

            // Check if game is complete (only one player left)
            const remainingPlayersQuery = `
                SELECT COUNT(*) FROM public.survivorgameplayers 
                WHERE survivorgameid = $1 AND status = 'active'
            `;
            const remainingResult = await client.query(remainingPlayersQuery, [gameId]);
            const remainingCount = parseInt(remainingResult.rows[0].count);

            if (remainingCount <= 1) {
                await this.completeSurvivorGame(client, gameId);
            }

            await client.query('COMMIT');

            logger.info(`Week ${week} processing complete: ${eliminatedCount} players eliminated, ${remainingCount} remaining`);

            return {
                success: true,
                eliminatedCount,
                remainingCount,
                isGameComplete: remainingCount <= 1
            };

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Failed to process weekly results:', error);
            throw new Error(`Failed to process week ${week} results: ${error.message}`);
        } finally {
            client.release();
        }
    }

    /**
     * Determine if a pick was correct
     */
    determinePickResult(pick) {
        const homeScore = pick.hometeamscore;
        const awayScore = pick.awayteamscore;
        const pickedTeamId = pick.teamid;
        
        if (homeScore === awayScore) {
            // Tie - usually counts as incorrect in survivor
            return false;
        }

        if (homeScore > awayScore) {
            // Home team won
            return pickedTeamId === pick.hometeamid;
        } else {
            // Away team won
            return pickedTeamId === pick.awayteamid;
        }
    }

    /**
     * Eliminate a player from the game
     */
    async eliminatePlayer(client, gameId, playerId, week, reason) {
        const eliminateQuery = `
            UPDATE public.survivorgameplayers 
            SET status = 'eliminated', 
                eliminatedweek = $1, 
                eliminatedreason = $2, 
                eliminatedat = CURRENT_TIMESTAMP,
                updatedat = CURRENT_TIMESTAMP
            WHERE survivorgameid = $3 AND playerid = $4
        `;

        await client.query(eliminateQuery, [week, reason, gameId, playerId]);
        logger.info(`Player ${playerId} eliminated in Week ${week}: ${reason}`);
    }

    /**
     * Record game history
     */
    async recordGameHistory(client, gameId, playerId, week, pick, isCorrect) {
        const historyId = uuidv4();
        const pickResult = isCorrect ? 'correct' : 'incorrect';
        
        // Get opponent team ID
        const opponentTeamId = pick.teamid === pick.hometeamid ? pick.awayteamid : pick.hometeamid;

        const historyQuery = `
            INSERT INTO public.gamehistory (
                historyid, survivorgameid, playerid, week, nflgameid,
                pickedteamid, opponentteamid, pickresult, survived
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (survivorgameid, playerid, week) DO UPDATE SET
                pickresult = $8,
                survived = $9,
                processedat = CURRENT_TIMESTAMP
        `;

        await client.query(historyQuery, [
            historyId, gameId, playerId, week, pick.gameid,
            pick.teamid, opponentTeamId, pickResult, isCorrect
        ]);
    }

    /**
     * Complete survivor game
     */
    async completeSurvivorGame(client, gameId) {
        // Find winner (last active player)
        const winnerQuery = `
            SELECT playerid FROM public.survivorgameplayers 
            WHERE survivorgameid = $1 AND status = 'active'
            LIMIT 1
        `;
        const winnerResult = await client.query(winnerQuery, [gameId]);
        const winnerId = winnerResult.rows.length > 0 ? winnerResult.rows[0].playerid : null;

        // Update game status
        const completeQuery = `
            UPDATE public.survivorgames 
            SET status = 'completed', 
                winnerid = $1, 
                completedat = CURRENT_TIMESTAMP,
                updatedat = CURRENT_TIMESTAMP
            WHERE gameid = $2
        `;

        await client.query(completeQuery, [winnerId, gameId]);
        
        logger.info(`Survivor game ${gameId} completed. Winner: ${winnerId || 'No winner'}`);
    }

    /**
     * Get survivor game details
     */
    async getSurvivorGame(gameId) {
        try {
            const gameQuery = `
                SELECT sg.*, u.username as creatorusername, u.firstname as creatorfirstname, u.lastname as creatorlastname
                FROM public.survivorgames sg
                LEFT JOIN public.users u ON sg.createdbyuserid = u.userid
                WHERE sg.gameid = $1
            `;

            const gameResult = await this.pool.query(gameQuery, [gameId]);

            if (gameResult.rows.length === 0) {
                throw new Error('Survivor game not found');
            }

            const game = gameResult.rows[0];

            // Get participant count
            const participantQuery = 'SELECT COUNT(*) FROM public.survivorgameplayers WHERE survivorgameid = $1';
            const participantResult = await this.pool.query(participantQuery, [gameId]);
            game.currentParticipants = parseInt(participantResult.rows[0].count);

            // Get active participant count
            const activeQuery = 'SELECT COUNT(*) FROM public.survivorgameplayers WHERE survivorgameid = $1 AND status = \'active\'';
            const activeResult = await this.pool.query(activeQuery, [gameId]);
            game.activeParticipants = parseInt(activeResult.rows[0].count);

            return {
                success: true,
                game: this.transformGameData(game)
            };

        } catch (error) {
            logger.error(`Failed to get survivor game ${gameId}:`, error);
            throw new Error(`Failed to get survivor game: ${error.message}`);
        }
    }

    /**
     * Get player's picks for a game
     */
    async getPlayerPicks(gameId, playerId, season = 2024) {
        try {
            const picksQuery = `
                SELECT pp.*, g.week, g.gamedate, g.hometeamscore, g.awayteamscore, g.iscomplete,
                       t.name as teamname, t.alias as teamalias, t.market as teammarket, t.fullname as teamfullname,
                       ht.name as hometeamname, ht.alias as hometeamalias,
                       at.name as awayteamname, at.alias as awayteamalias
                FROM public.playerpicks pp
                INNER JOIN public.games g ON pp.gameid = g.gameid
                INNER JOIN public.teams t ON pp.teamid = t.teamid
                INNER JOIN public.teams ht ON g.hometeamid = ht.teamid
                INNER JOIN public.teams at ON g.awayteamid = at.teamid
                WHERE pp.playerid = $1 AND g.season = $2
                AND pp.playerid IN (
                    SELECT playerid FROM public.survivorgameplayers WHERE survivorgameid = $3
                )
                ORDER BY g.week ASC, pp.picknumber ASC
            `;

            const result = await this.pool.query(picksQuery, [playerId, season, gameId]);

            return {
                success: true,
                picks: result.rows.map(pick => this.transformPickData(pick))
            };

        } catch (error) {
            logger.error('Failed to get player picks:', error);
            throw new Error('Failed to retrieve player picks');
        }
    }

    /**
     * Transform game data for API response
     */
    transformGameData(game) {
        return {
            gameId: game.gameid,
            gameName: game.gamename,
            description: game.description,
            createdByUserId: game.createdbyuserid,
            creatorUsername: game.creatorusername,
            creatorName: game.creatorfirstname && game.creatorlastname ? 
                `${game.creatorfirstname} ${game.creatorlastname}` : game.creatorusername,
            entryFee: parseFloat(game.entryfee || 0),
            prizePool: parseFloat(game.prizepool || 0),
            maxParticipants: game.maxparticipants,
            currentParticipants: game.currentParticipants || 0,
            activeParticipants: game.activeParticipants || 0,
            startWeek: game.startweek,
            endWeek: game.endweek,
            requireTwoPicksFromWeek: game.requiretwopicksfromweek,
            season: game.season,
            status: game.status,
            winnerId: game.winnerid,
            isActive: game.isactive,
            createdAt: game.createdat,
            updatedAt: game.updatedat,
            completedAt: game.completedat
        };
    }

    /**
     * Transform participant data for API response
     */
    transformParticipantData(participant) {
        return {
            participantId: participant.participantid,
            survivorGameId: participant.survivorgameid,
            playerId: participant.playerid,
            status: participant.status,
            eliminatedWeek: participant.eliminatedweek,
            eliminatedReason: participant.eliminatedreason,
            joinedAt: participant.joinedat,
            eliminatedAt: participant.eliminatedat
        };
    }

    /**
     * Transform pick data for API response
     */
    transformPickData(pick) {
        return {
            pickId: pick.pickid,
            playerId: pick.playerid,
            gameId: pick.gameid,
            teamId: pick.teamid,
            teamName: pick.teamname,
            teamAlias: pick.teamalias,
            teamFullName: pick.teamfullname,
            week: pick.week,
            pickNumber: pick.picknumber,
            isCorrect: pick.iscorrect,
            submittedAt: pick.submittedat,
            processedAt: pick.processedat,
            gameDate: pick.gamedate,
            homeTeamAlias: pick.hometeamalias,
            awayTeamAlias: pick.awayteamalias,
            isComplete: pick.iscomplete,
            homeScore: pick.hometeamscore,
            awayScore: pick.awayteamscore
        };
    }
}

module.exports = new SurvivorGameService();