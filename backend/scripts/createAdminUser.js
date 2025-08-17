const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Configuration
const adminUser = {
    email: 'admin@gamesraffle.com',
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    password: 'AdminPass2024!',
    role: 'SuperAdmin'
};

async function createAdminUser() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.SQL_CONNECTION_STRING,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
        console.log('🔍 Checking for existing admin user...');
        
        // Check if admin user already exists
        const existingUser = await pool.query(
            'SELECT userid, email, username, role FROM public.users WHERE email = $1',
            [adminUser.email]
        );

        if (existingUser.rows.length > 0) {
            console.log('👤 Admin user already exists:', existingUser.rows[0]);
            
            // Update role if not already admin
            const user = existingUser.rows[0];
            if (user.role !== 'SuperAdmin' && user.role !== 'Admin') {
                console.log('🔧 Updating user role to SuperAdmin...');
                await pool.query(
                    'UPDATE public.users SET role = $1 WHERE userid = $2',
                    ['SuperAdmin', user.userid]
                );
                console.log('✅ User role updated to SuperAdmin');
            } else {
                console.log('✅ User already has admin privileges');
            }
            return user;
        }

        console.log('👤 Creating new admin user...');
        
        // Hash password
        const hashedPassword = await bcrypt.hash(adminUser.password, 12);
        
        // Create admin user
        const result = await pool.query(`
            INSERT INTO public.users (
                email, username, passwordhash, firstname, lastname, role,
                isverified, emailverified, phoneverified,
                createdat, updatedat
            )
            VALUES ($1, $2, $3, $4, $5, $6, true, true, true, NOW(), NOW())
            RETURNING userid, email, username, role, createdat
        `, [
            adminUser.email,
            adminUser.username,
            hashedPassword,
            adminUser.firstName,
            adminUser.lastName,
            adminUser.role
        ]);

        const newUser = result.rows[0];
        console.log('✅ Admin user created successfully:');
        console.log(`   ID: ${newUser.userid}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Username: ${newUser.username}`);
        console.log(`   Role: ${newUser.role}`);
        console.log(`   Created: ${newUser.createdat}`);
        
        console.log('\n🔑 Admin Login Credentials:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Password: ${adminUser.password}`);
        
        return newUser;
        
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        throw error;
    } finally {
        await pool.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
if (require.main === module) {
    createAdminUser()
        .then(() => {
            console.log('🎉 Admin user setup completed!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createAdminUser };