#!/usr/bin/env node
/**
 * Test different SportRadar authentication methods and URL structures
 */

require('dotenv').config();
const axios = require('axios');

async function testSportRadarAuthentication() {
    console.log('🔐 Testing SportRadar Authentication Methods...\n');
    
    const apiKey = process.env.SPORTRADAR_API_KEY;
    
    // Different base URLs to try
    const baseUrls = [
        'https://api.sportradar.us',  // US domain (common for American sports)
        'https://api.sportradar.com', // Global domain
        'https://api.sportradar.com/nfl/official',
        'https://api.sportradar.us/nfl/official'
    ];
    
    // Simple endpoints to test
    const testEndpoints = [
        '/trial/v7/en/league/hierarchy.json',
        '/trial/v7/en/teams/hierarchy.json'
    ];
    
    console.log('🧪 Testing different base URLs and authentication methods:\n');
    
    for (const baseUrl of baseUrls) {
        console.log(`🌐 Testing base URL: ${baseUrl}`);
        
        for (const endpoint of testEndpoints) {
            // Method 1: Query parameter (what we're currently using)
            await testAuth(baseUrl, endpoint, 'query', { api_key: apiKey });
            
            // Method 2: Header authentication
            await testAuth(baseUrl, endpoint, 'header', null, { 'X-API-Key': apiKey });
            
            // Method 3: Authorization header
            await testAuth(baseUrl, endpoint, 'auth', null, { 'Authorization': `Bearer ${apiKey}` });
            
            // Method 4: Different query parameter name
            await testAuth(baseUrl, endpoint, 'apikey', { apikey: apiKey });
            
            console.log('');
        }
        console.log('─'.repeat(50));
    }
}

async function testAuth(baseUrl, endpoint, method, queryParams = null, headers = {}) {
    try {
        let url = `${baseUrl}${endpoint}`;
        
        if (queryParams) {
            const params = new URLSearchParams(queryParams);
            url += `?${params.toString()}`;
        }
        
        const config = {
            timeout: 10000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SurvivorSports/1.0',
                ...headers
            }
        };
        
        const response = await axios.get(url, config);
        console.log(`   ✅ SUCCESS (${method}): ${response.status} - ${endpoint}`);
        
        // Show some response details
        if (response.data) {
            const keys = Object.keys(response.data);
            console.log(`   📊 Response keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
        }
        
        return true;
        
    } catch (error) {
        const status = error.response?.status || 'NO_RESPONSE';
        const method_display = method.toUpperCase().padEnd(8);
        
        if (status === 403) {
            console.log(`   🔒 FORBIDDEN (${method_display}): ${status} - ${endpoint}`);
        } else if (status === 401) {
            console.log(`   🚫 UNAUTHORIZED (${method_display}): ${status} - ${endpoint}`);
        } else if (status === 404) {
            console.log(`   ❓ NOT FOUND (${method_display}): ${status} - ${endpoint}`);
        } else if (status === 429) {
            console.log(`   ⏱️  RATE LIMITED (${method_display}): ${status} - ${endpoint}`);
        } else {
            console.log(`   ❌ ERROR (${method_display}): ${status} - ${endpoint}`);
        }
        
        return false;
    }
}

// Also test the exact API as shown in SportRadar documentation
async function testDocumentationExamples() {
    console.log('\n📚 Testing Documentation Examples:\n');
    
    const apiKey = process.env.SPORTRADAR_API_KEY;
    
    // Common SportRadar NFL endpoint patterns from documentation
    const docExamples = [
        // Basic team info
        'https://api.sportradar.us/nfl/official/trial/v7/en/league/hierarchy.json',
        
        // Season schedule
        'https://api.sportradar.us/nfl/official/trial/v7/en/games/2024/REG/schedule.json',
        
        // Current season (different format)
        'https://api.sportradar.us/nfl/official/trial/v7/en/seasons/2024/REG/schedule.json',
    ];
    
    for (const url of docExamples) {
        await testDocUrl(url, apiKey);
    }
}

async function testDocUrl(baseUrl, apiKey) {
    const fullUrl = `${baseUrl}?api_key=${apiKey}`;
    
    try {
        console.log(`🔗 Testing: ${baseUrl.split('/').slice(-2).join('/')}`);
        
        const response = await axios.get(fullUrl, {
            timeout: 15000,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SurvivorSports/1.0'
            }
        });
        
        console.log(`   ✅ SUCCESS: ${response.status}`);
        console.log(`   📊 Data type: ${typeof response.data}`);
        
        if (response.data && typeof response.data === 'object') {
            const keys = Object.keys(response.data);
            console.log(`   🔑 Keys: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);
            
            // Look for schedule data
            if (response.data.games) {
                console.log(`   🏈 Games found: ${response.data.games.length}`);
            }
            if (response.data.conferences) {
                console.log(`   👥 Conferences: ${response.data.conferences.length}`);
            }
        }
        
        console.log('');
        
    } catch (error) {
        const status = error.response?.status || 'NO_RESPONSE';
        console.log(`   ❌ ERROR: ${status} - ${baseUrl.split('/').slice(-2).join('/')}`);
        console.log('');
    }
}

// Run all tests
if (require.main === module) {
    (async () => {
        await testSportRadarAuthentication();
        await testDocumentationExamples();
        console.log('🎯 Authentication testing complete!');
    })().catch(error => {
        console.error('❌ Auth test failed:', error.message);
        process.exit(1);
    });
}