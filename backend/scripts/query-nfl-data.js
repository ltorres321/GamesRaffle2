#!/usr/bin/env node

const pool = require('../src/config/database');

/**
 * Simple NFL Data Query Tool
 * Usage: node query-nfl-data.js [query-type]
 * 
 * Available query types:
 * - games [week] - Show games for specific week (default: 1)
 * - teams - Show all NFL teams
 * - washington - Show all Washington games
 * - week1 - Show week 1 games
 * - stats - Show database statistics
 * - custom "SQL query" - Run custom SQL
 */

async function runQuery() {
    const args = process.argv.slice(2);
    const queryType = args[0] || 'stats';
    const param = args[1];

    try {
        await pool.initialize();
        console.log('🔌 Connected to Supabase PostgreSQL\n');

        switch (queryType.toLowerCase()) {
            case 'games':
                await showGamesForWeek(param || 1);
                break;
            case 'teams':
                await showAllTeams();
                break;
            case 'washington':
            case 'wsh':
            case 'was':
                await showWashingtonGames();
                break;
            case 'week1':
                await showGamesForWeek(1);
                break;
            case 'stats':
                await showStats();
                break;
            case 'custom':
                if (!param) {
                    console.log('❌ Please provide SQL query: node query-nfl-data.js custom "SELECT * FROM nfl_games LIMIT 5"');
                    return;
                }
                await runCustomQuery(param);
                break;
            default:
                showHelp();
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Query failed:', error.message);
        process.exit(1);
    }
}

async function showGamesForWeek(week) {
    console.log(`🏈 NFL Games - Week ${week} (2025 Season)\n`);
    
    const result = await pool.query(`
        SELECT 
            g.game_date,
            at.team_code as away_team,
            ht.team_code as home_team,
            g.away_score,
            g.home_score,
            g.is_final,
            g.espn_game_id
        FROM nfl_games g
        JOIN nfl_teams ht ON g.home_team_id = ht.id
        JOIN nfl_teams at ON g.away_team_id = at.id
        WHERE g.week = $1 AND g.season = 2025
        ORDER BY g.game_date
    `, [week]);

    if (result.rows.length === 0) {
        console.log(`No games found for week ${week}`);
        return;
    }

    console.log('Date       | Away @ Home    | Score | Final | ESPN ID');
    console.log('-----------|----------------|-------|-------|----------');
    
    result.rows.forEach(game => {
        const date = new Date(game.game_date).toISOString().split('T')[0];
        const matchup = `${game.away_team} @ ${game.home_team}`;
        const score = `${game.away_score}-${game.home_score}`;
        const final = game.is_final ? '✓' : '○';
        console.log(`${date} | ${matchup.padEnd(14)} | ${score.padEnd(5)} | ${final.padEnd(5)} | ${game.espn_game_id}`);
    });
    
    console.log(`\n📊 Total games in week ${week}: ${result.rows.length}`);
}

async function showAllTeams() {
    console.log('🏈 NFL Teams\n');
    
    const result = await pool.query(`
        SELECT team_code, city, name, conference, division
        FROM nfl_teams
        WHERE is_active = true
        ORDER BY conference, division, team_code
    `);

    console.log('Code | Team                    | Conference | Division');
    console.log('-----|-------------------------|------------|----------');
    
    result.rows.forEach(team => {
        const fullName = `${team.city} ${team.name}`;
        console.log(`${team.team_code.padEnd(4)} | ${fullName.padEnd(23)} | ${team.conference.padEnd(10)} | ${team.division}`);
    });
    
    console.log(`\n📊 Total teams: ${result.rows.length}`);
}

async function showWashingtonGames() {
    console.log('🏈 Washington Commanders Games (All 2025 Season)\n');
    
    const result = await pool.query(`
        SELECT 
            g.week,
            g.game_date,
            at.team_code as away_team,
            ht.team_code as home_team,
            g.away_score,
            g.home_score,
            g.is_final
        FROM nfl_games g
        JOIN nfl_teams ht ON g.home_team_id = ht.id
        JOIN nfl_teams at ON g.away_team_id = at.id
        WHERE (ht.team_code = 'WAS' OR at.team_code = 'WAS') 
        AND g.season = 2025
        ORDER BY g.week, g.game_date
    `);

    console.log('Week | Date       | Away @ Home    | Score | Final');
    console.log('-----|------------|----------------|-------|------');
    
    result.rows.forEach(game => {
        const date = new Date(game.game_date).toISOString().split('T')[0];
        const matchup = `${game.away_team} @ ${game.home_team}`;
        const score = `${game.away_score}-${game.home_score}`;
        const final = game.is_final ? '✓' : '○';
        console.log(`${game.week.toString().padEnd(4)} | ${date} | ${matchup.padEnd(14)} | ${score.padEnd(5)} | ${final}`);
    });
    
    console.log(`\n📊 Total Washington games: ${result.rows.length}`);
}

async function showStats() {
    console.log('📊 NFL Database Statistics\n');
    
    const totalTeams = await pool.query('SELECT COUNT(*) FROM nfl_teams WHERE is_active = true');
    const totalGames = await pool.query('SELECT COUNT(*) FROM nfl_games WHERE season = 2025');
    const completedGames = await pool.query('SELECT COUNT(*) FROM nfl_games WHERE season = 2025 AND is_final = true');
    const weeks = await pool.query('SELECT DISTINCT week FROM nfl_games WHERE season = 2025 ORDER BY week');
    const byWeek = await pool.query(`
        SELECT week, COUNT(*) as game_count
        FROM nfl_games 
        WHERE season = 2025 
        GROUP BY week 
        ORDER BY week
    `);

    console.log('📈 Overview:');
    console.log(`  Total Teams: ${totalTeams.rows[0].count}`);
    console.log(`  Total 2025 Games: ${totalGames.rows[0].count}`);
    console.log(`  Completed Games: ${completedGames.rows[0].count}`);
    console.log(`  Weeks with Games: ${weeks.rows.map(r => r.week).join(', ')}`);
    
    console.log('\n📅 Games by Week:');
    byWeek.rows.forEach(week => {
        console.log(`  Week ${week.week}: ${week.game_count} games`);
    });

    // Show sample upcoming games
    const upcomingGames = await pool.query(`
        SELECT 
            g.week,
            g.game_date,
            at.team_code as away_team,
            ht.team_code as home_team
        FROM nfl_games g
        JOIN nfl_teams ht ON g.home_team_id = ht.id
        JOIN nfl_teams at ON g.away_team_id = at.id
        WHERE g.season = 2025 AND g.is_final = false
        ORDER BY g.game_date
        LIMIT 5
    `);

    console.log('\n🔜 Next 5 Games:');
    upcomingGames.rows.forEach(game => {
        const date = new Date(game.game_date).toISOString().split('T')[0];
        console.log(`  Week ${game.week}: ${game.away_team} @ ${game.home_team} (${date})`);
    });
}

async function runCustomQuery(sql) {
    console.log(`🔍 Running Custom Query:\n${sql}\n`);
    
    try {
        const result = await pool.query(sql);
        
        if (result.rows.length === 0) {
            console.log('No results found.');
            return;
        }

        // Display results in table format
        const columns = Object.keys(result.rows[0]);
        console.log(columns.join(' | '));
        console.log(columns.map(() => '---').join('|'));
        
        result.rows.forEach(row => {
            console.log(columns.map(col => String(row[col] || '')).join(' | '));
        });
        
        console.log(`\n📊 Total rows: ${result.rows.length}`);
        
    } catch (error) {
        console.error('❌ SQL Error:', error.message);
    }
}

function showHelp() {
    console.log(`🏈 NFL Data Query Tool

Usage: node query-nfl-data.js [command] [parameter]

Commands:
  stats              - Show database statistics
  teams              - Show all NFL teams
  games [week]       - Show games for specific week (default: 1)
  washington         - Show all Washington Commanders games
  week1              - Show week 1 games
  custom "SQL"       - Run custom SQL query

Examples:
  node query-nfl-data.js stats
  node query-nfl-data.js games 5
  node query-nfl-data.js washington
  node query-nfl-data.js custom "SELECT * FROM nfl_teams WHERE conference = 'NFC'"

Tables:
  nfl_teams - All NFL teams (32 teams)
  nfl_games - All NFL games (272 games for 2025 season)
`);
}

// Run the query tool
runQuery();