#!/usr/bin/env node
/**
 * Debug script to identify SportRadar API issues
 */

require('dotenv').config();
const axios = require('axios');

async function debugSportRadarAPI() {
    console.log('🔍 Debugging SportRadar NFL API Issues...\n');
    
    const apiKey = process.env.SPORTRADAR_API_KEY;
    const baseUrl = process.env.SPORTRADAR_BASE_URL || 'https://api.sportradar.com';
    
    console.log('📋 Configuration:');
    console.log(`   API Key: ${apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING'}`);
    console.log(`   Base URL: ${baseUrl}`);
    console.log('');
    
    // Test different endpoint variations
    const endpointsToTest = [
        // Current approach (what's failing)
        '/nfl/official/trial/v7/en/games/current_season/schedule.json',
        
        // Alternative structures based on common SportRadar patterns
        '/nfl/official/trial/v7/en/seasons/2024/schedule.json',
        '/nfl/official/trial/v7/en/seasons/2024/REG/schedule.json',
        '/nfl/official/trial/v7/en/games/schedule.json',
        
        // Try different versions
        '/nfl/official/trial/v6/en/games/current_season/schedule.json',
        '/nfl/official/trial/v5/en/games/current_season/schedule.json',
        
        // Try without /official
        '/nfl/trial/v7/en/games/current_season/schedule.json',
        '/nfl/trial/v7/en/seasons/2024/schedule.json',
        
        // Try basic info endpoint first
        '/nfl/official/trial/v7/en/league/hierarchy.json',
        '/nfl/official/trial/v7/en/teams/hierarchy.json'
    ];
    
    for (const endpoint of endpointsToTest) {
        await testEndpoint(baseUrl, endpoint, apiKey);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
    }
}

async function testEndpoint(baseUrl, endpoint, apiKey) {
    const fullUrl = `${baseUrl}${endpoint}?api_key=${apiKey}`;
    
    try {
        console.log(`🔗 Testing: ${endpoint}`);
        
        const response = await axios.get(fullUrl, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SurvivorSports/1.0'
            }
        });
        
        console.log(`   ✅ SUCCESS (${response.status}): ${endpoint}`);
        
        // Show sample of successful data
        if (response.data) {
            const dataKeys = Object.keys(response.data);
            console.log(`   📊 Response keys: ${dataKeys.slice(0, 5).join(', ')}${dataKeys.length > 5 ? '...' : ''}`);
            
            // If it's a schedule, show game count
            if (response.data.games && Array.isArray(response.data.games)) {
                console.log(`   🏈 Games found: ${response.data.games.length}`);
            }
            
            // If it's teams, show team count
            if (response.data.conferences && Array.isArray(response.data.conferences)) {
                const teamCount = response.data.conferences.reduce((count, conf) => 
                    count + (conf.divisions ? conf.divisions.reduce((divCount, div) => 
                        divCount + (div.teams ? div.teams.length : 0), 0) : 0), 0);
                console.log(`   👥 Teams found: ${teamCount}`);
            }
        }
        
        console.log('');
        
    } catch (error) {
        const status = error.response?.status;
        const statusText = error.response?.statusText;
        
        if (status === 403) {
            console.log(`   ❌ FORBIDDEN (${status}): ${endpoint}`);
        } else if (status === 404) {
            console.log(`   ⚠️  NOT FOUND (${status}): ${endpoint}`);
        } else if (status === 429) {
            console.log(`   ⏱️  RATE LIMITED (${status}): ${endpoint}`);
        } else {
            console.log(`   ❌ ERROR (${status || 'NO_RESPONSE'}): ${endpoint}`);
            if (error.code === 'ENOTFOUND') {
                console.log(`   🌐 DNS/Network issue`);
            }
        }
        
        // Show error details for debugging
        if (error.response?.data && typeof error.response.data === 'string' && error.response.data.length < 200) {
            console.log(`   📝 Error: ${error.response.data.trim()}`);
        }
        
        console.log('');
    }
}

// Try a simple HTTP test first
async function testBasicConnectivity() {
    console.log('🌐 Testing basic connectivity...\n');
    
    try {
        const response = await axios.get('https://httpbin.org/get', { timeout: 10000 });
        console.log('✅ Internet connectivity: OK');
    } catch (error) {
        console.log('❌ Internet connectivity: FAILED');
        console.log(`   Error: ${error.message}`);
    }
    
    try {
        const response = await axios.get('https://api.sportradar.com', { timeout: 10000 });
        console.log('✅ SportRadar domain: ACCESSIBLE');
    } catch (error) {
        console.log('❌ SportRadar domain: INACCESSIBLE');
        console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
}

// Run the debug session
if (require.main === module) {
    (async () => {
        await testBasicConnectivity();
        await debugSportRadarAPI();
        console.log('🎯 Debug session complete!');
    })().catch(error => {
        console.error('❌ Debug session failed:', error.message);
        process.exit(1);
    });
}

module.exports = debugSportRadarAPI;