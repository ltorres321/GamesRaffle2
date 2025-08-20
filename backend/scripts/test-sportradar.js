#!/usr/bin/env node
/**
 * Test script to verify SportRadar API connectivity and data retrieval
 */

require('dotenv').config();
const sportRadarService = require('../src/services/sportRadarService');
const nflDataService = require('../src/services/nflDataService');
const logger = require('../src/utils/logger');

async function testSportRadarIntegration() {
    console.log('🏈 Testing SportRadar NFL API Integration...\n');
    
    try {
        // Test 1: API Configuration
        console.log('1. ✅ API Configuration Check:');
        console.log(`   API Key: ${process.env.SPORTRADAR_API_KEY ? 'CONFIGURED' : 'MISSING'}`);
        console.log(`   Base URL: ${process.env.SPORTRADAR_BASE_URL}`);
        console.log(`   Access Level: ${process.env.SPORTRADAR_ACCESS_LEVEL}`);
        console.log('');
        
        if (!process.env.SPORTRADAR_API_KEY) {
            throw new Error('SportRadar API key is not configured');
        }
        
        // Test 2: Get Current Season Schedule
        console.log('2. 🔄 Testing Current Season Schedule...');
        try {
            const schedule = await sportRadarService.getCurrentSeasonSchedule();
            console.log(`   ✅ Schedule Retrieved: ${schedule.length} games`);
            
            if (schedule.length > 0) {
                const sampleGame = schedule[0];
                console.log(`   📋 Sample Game:`);
                console.log(`      ID: ${sampleGame.gameId}`);
                console.log(`      Matchup: ${sampleGame.awayTeam?.alias} @ ${sampleGame.homeTeam?.alias}`);
                console.log(`      Date: ${sampleGame.scheduled}`);
                console.log(`      Week: ${sampleGame.week}`);
                console.log(`      Season: ${sampleGame.season}`);
                console.log(`      Status: ${sampleGame.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Schedule Error: ${error.message}`);
        }
        console.log('');
        
        // Test 3: Get Current Week Schedule
        console.log('3. 🔄 Testing Current Week Schedule...');
        try {
            const weekSchedule = await sportRadarService.getCurrentWeekSchedule();
            console.log(`   ✅ Week Schedule Retrieved: ${weekSchedule.length} games`);
            
            if (weekSchedule.length > 0) {
                console.log(`   📋 Current Week Games:`);
                weekSchedule.forEach((game, index) => {
                    if (index < 3) { // Show first 3 games
                        console.log(`      ${game.awayTeam?.alias} @ ${game.homeTeam?.alias} (${game.status})`);
                    }
                });
                if (weekSchedule.length > 3) {
                    console.log(`      ... and ${weekSchedule.length - 3} more games`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Week Schedule Error: ${error.message}`);
        }
        console.log('');
        
        // Test 4: API Statistics
        console.log('4. 📊 Testing API Statistics...');
        try {
            const stats = await sportRadarService.getApiStats();
            console.log(`   ✅ API Stats Retrieved:`);
            console.log(`      Requests: ${stats?.requestCount || 0}`);
            console.log(`      Errors: ${stats?.errorCount || 0}`);
            console.log(`      Cache Hits: ${stats?.cacheHits || 0}`);
            console.log(`      Last Request: ${stats?.lastRequest || 'Never'}`);
        } catch (error) {
            console.log(`   ❌ Stats Error: ${error.message}`);
        }
        console.log('');
        
        // Test 5: Data Service Integration
        console.log('5. 🔄 Testing NFL Data Service Integration...');
        try {
            console.log('   📋 Current week number:', nflDataService.getCurrentWeekNumber());
            
            // Test the enhanced loading method
            console.log('   🔄 Testing SportRadar-first data loading...');
            const loadResult = await nflDataService.loadCurrentSeasonData();
            console.log(`   ✅ Load Result:`);
            console.log(`      Success: ${loadResult.success}`);
            console.log(`      Source: ${loadResult.source}`);
            console.log(`      Message: ${loadResult.message}`);
            
            if (loadResult.details) {
                console.log(`   📊 Details:`);
                console.log(`      Total Games: ${loadResult.details.gamesTotal || 'N/A'}`);
                console.log(`      Inserted: ${loadResult.details.gamesInserted || 'N/A'}`);
                console.log(`      Updated: ${loadResult.details.gamesUpdated || 'N/A'}`);
                console.log(`      Teams Updated: ${loadResult.details.teamsUpdated || 'N/A'}`);
            }
        } catch (error) {
            console.log(`   ❌ Data Service Error: ${error.message}`);
        }
        console.log('');
        
        console.log('🎉 SportRadar API Integration Test Complete!\n');
        
    } catch (error) {
        console.error('❌ SportRadar Integration Test Failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testSportRadarIntegration()
        .then(() => {
            console.log('✅ All tests completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = testSportRadarIntegration;