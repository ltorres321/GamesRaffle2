const axios = require('axios');

const API_KEY = '07b8c3848b0d7f73e088fbcba091140d';
const BASE_URL = 'https://api.the-odds-api.com/v4';

// Test configuration
const config = {
    timeout: 10000,
    headers: {
        'User-Agent': 'GamesRaffle2-Backend/1.0'
    }
};

console.log('🏈 The Odds API Exploration for NFL Data\n');
console.log('════════════════════════════════════════════════════════════');
console.log(`🔑 API Key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);
console.log(`🗓️  Testing Date: ${new Date().toISOString()}\n`);

async function testEndpoint(endpoint, description) {
    try {
        console.log(`🔍 Testing: ${description}`);
        console.log(`   URL: ${BASE_URL}${endpoint}`);
        
        const response = await axios.get(`${BASE_URL}${endpoint}`, config);
        
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Data type: ${typeof response.data}`);
        
        if (Array.isArray(response.data)) {
            console.log(`   📈 Array length: ${response.data.length}`);
            if (response.data.length > 0) {
                console.log(`   🔍 Sample item keys: ${Object.keys(response.data[0]).join(', ')}`);
            }
        } else if (typeof response.data === 'object') {
            console.log(`   🔍 Object keys: ${Object.keys(response.data).join(', ')}`);
        }
        
        // Show first few items for analysis
        if (Array.isArray(response.data) && response.data.length > 0) {
            console.log(`   📝 Sample data:`);
            response.data.slice(0, 3).forEach((item, index) => {
                console.log(`      ${index + 1}. ${JSON.stringify(item, null, 2).substring(0, 200)}...`);
            });
        }
        
        console.log('');
        return response.data;
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
        if (error.response?.data) {
            console.log(`   📄 Response: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        console.log('');
        return null;
    }
}

async function exploreAPI() {
    console.log('🌐 Basic API Exploration:\n');
    
    // Test available sports
    const sports = await testEndpoint(`/sports?apiKey=${API_KEY}`, 'Available Sports');
    
    // Look for NFL specifically
    if (sports) {
        const nflSport = sports.find(sport => 
            sport.key === 'americanfootball_nfl' || 
            sport.title?.toLowerCase().includes('nfl') ||
            sport.title?.toLowerCase().includes('football')
        );
        
        if (nflSport) {
            console.log(`🏈 Found NFL Sport: ${JSON.stringify(nflSport, null, 2)}\n`);
        }
    }
    
    console.log('🏈 NFL-Specific Endpoints:\n');
    
    // Test current NFL odds (this should show current/upcoming games)
    await testEndpoint(
        `/sports/americanfootball_nfl/odds?regions=us&markets=h2h&oddsFormat=american&apiKey=${API_KEY}`,
        'Current NFL Odds'
    );
    
    // Test NFL scores (this might show recent results)
    await testEndpoint(
        `/sports/americanfootball_nfl/scores?daysFrom=3&apiKey=${API_KEY}`,
        'Recent NFL Scores (last 3 days)'
    );
    
    // Test historical scores for different date ranges
    const testDates = [
        { from: 30, desc: '30 days ago' },
        { from: 60, desc: '60 days ago' },
        { from: 120, desc: '120 days ago' },
        { from: 365, desc: '1 year ago (2024 season)' }
    ];
    
    for (const dateTest of testDates) {
        await testEndpoint(
            `/sports/americanfootball_nfl/scores?daysFrom=${dateTest.from}&apiKey=${API_KEY}`,
            `NFL Scores from ${dateTest.desc}`
        );
    }
    
    console.log('🔍 Advanced Endpoint Testing:\n');
    
    // Test if we can get future games
    await testEndpoint(
        `/sports/americanfootball_nfl/odds?regions=us&markets=h2h,spreads&dateFormat=iso&apiKey=${API_KEY}`,
        'Future NFL Games with ISO dates'
    );
    
    // Test event-specific endpoints if we have event IDs from previous calls
    console.log('📊 API Usage and Rate Limits:\n');
    
    // Test a simple endpoint to check rate limiting headers
    try {
        const response = await axios.get(`${BASE_URL}/sports?apiKey=${API_KEY}`, config);
        console.log('📈 Rate Limit Headers:');
        Object.keys(response.headers).forEach(header => {
            if (header.toLowerCase().includes('rate') || 
                header.toLowerCase().includes('limit') || 
                header.toLowerCase().includes('remaining') ||
                header.toLowerCase().includes('usage')) {
                console.log(`   ${header}: ${response.headers[header]}`);
            }
        });
        console.log('');
    } catch (error) {
        console.log('❌ Could not retrieve rate limit information\n');
    }
}

async function testSeasonCoverage() {
    console.log('🗓️  Season Coverage Analysis:\n');
    
    // Try to determine what seasons/years are available
    const currentYear = new Date().getFullYear();
    const testYears = [currentYear - 1, currentYear, currentYear + 1]; // 2023, 2024, 2025
    
    for (const year of testYears) {
        console.log(`📅 Testing ${year} season data...`);
        
        // Try different date ranges for each year
        const seasonStart = new Date(`${year}-09-01`);
        const seasonEnd = new Date(`${year}-02-28`);
        const now = new Date();
        
        if (seasonStart < now) {
            // Past or current season - try to get historical data
            const daysFrom = Math.floor((now - seasonStart) / (1000 * 60 * 60 * 24));
            await testEndpoint(
                `/sports/americanfootball_nfl/scores?daysFrom=${daysFrom}&apiKey=${API_KEY}`,
                `${year} Season Historical Scores`
            );
        } else {
            // Future season - try to get schedule
            await testEndpoint(
                `/sports/americanfootball_nfl/odds?regions=us&markets=h2h&apiKey=${API_KEY}`,
                `${year} Season Future Schedule`
            );
        }
    }
}

async function main() {
    try {
        await exploreAPI();
        await testSeasonCoverage();
        
        console.log('🎯 Summary and Recommendations:\n');
        console.log('✅ API exploration complete!');
        console.log('📋 Check the output above for:');
        console.log('   • Available NFL data endpoints');
        console.log('   • Historical data coverage (2024 testing)');
        console.log('   • Future data availability (2025 schedule)');
        console.log('   • Data structure and format');
        console.log('   • Rate limits and usage information');
        console.log('\n🚀 Next steps based on findings will determine integration approach.');
        
    } catch (error) {
        console.error('❌ Script error:', error.message);
    }
}

main();