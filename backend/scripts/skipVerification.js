const { Pool } = require('pg');
require('dotenv').config();

async function skipVerificationForUser(username = 'ltorres') {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log(`🔄 Updating verification status for user: ${username}`);
        
        // First check if user exists
        const checkUser = await pool.query(
            'SELECT userid, username, email, emailverified, phoneverified, isverified FROM public.users WHERE username = $1',
            [username]
        );

        if (checkUser.rows.length === 0) {
            console.log(`❌ User '${username}' not found in database`);
            return false;
        }

        console.log('📋 Current user status:');
        console.log(checkUser.rows[0]);

        // Update verification flags
        const updateResult = await pool.query(`
            UPDATE public.users 
            SET 
                emailverified = true,
                phoneverified = true,
                isverified = true,
                datemodified = CURRENT_TIMESTAMP
            WHERE username = $1
            RETURNING userid, username, email, emailverified, phoneverified, isverified
        `, [username]);

        if (updateResult.rows.length > 0) {
            console.log('\n✅ Successfully updated verification status:');
            console.log(updateResult.rows[0]);
            console.log(`\n🎉 User '${username}' can now skip verification and access all features!`);
            return true;
        } else {
            console.log(`❌ Failed to update user '${username}'`);
            return false;
        }

    } catch (error) {
        console.error('💥 Error updating verification status:', error.message);
        return false;
    } finally {
        await pool.end();
    }
}

// Run the script
if (require.main === module) {
    const username = process.argv[2] || 'ltorres';
    skipVerificationForUser(username)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Script failed:', error);
            process.exit(1);
        });
}

module.exports = skipVerificationForUser;