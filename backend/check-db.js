// Test script để kiểm tra database
const pool = require('./config/db');

async function checkDatabase() {
    try {
        console.log('🔍 Checking database...\n');

        // Check roles table
        console.log('1. Checking roles table:');
        const [roles] = await pool.execute('SELECT * FROM roles');
        console.log('Roles:', roles);
        console.log('Role count:', roles.length);

        if (roles.length === 0) {
            console.log('⚠️ WARNING: roles table is empty!');
            console.log('💡 Solution: Run seed.sql to insert default roles');
            console.log('   Command: mysql -u root -p < database/seed.sql');
        }

        console.log('\n2. Checking users table:');
        const [users] = await pool.execute('SELECT user_id, email, full_name FROM users LIMIT 5');
        console.log('Users:', users);
        console.log('User count:', users.length);

        console.log('\n3. Checking user_roles table:');
        const [userRoles] = await pool.execute('SELECT * FROM user_roles LIMIT 5');
        console.log('User roles:', userRoles);

        console.log('\n✅ Database check complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database check error:', error.message);
        process.exit(1);
    }
}

checkDatabase();
