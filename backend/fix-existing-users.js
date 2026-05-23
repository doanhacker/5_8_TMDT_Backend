// Script để gán role cho các users hiện có
const pool = require('./config/db');

async function assignRolesToExistingUsers() {
    try {
        console.log('🎭 Assigning roles to existing users...\n');

        // Lấy tất cả users
        const [users] = await pool.execute('SELECT user_id, email FROM users');
        
        for (const user of users) {
            try {
                // Gán role CUSTOMER (role_id = 3) cho mỗi user
                await pool.execute(
                    'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE role_id = role_id',
                    [user.user_id, 3]
                );
                console.log(`✅ Assigned role to user: ${user.email}`);
            } catch (err) {
                console.log(`⚠️ User ${user.email} already has role or error:`, err.message);
            }
        }

        // Verify
        console.log('\n📋 User roles after assignment:');
        const [userRoles] = await pool.execute(`
            SELECT u.user_id, u.email, r.role_name 
            FROM users u
            LEFT JOIN user_roles ur ON u.user_id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.role_id
        `);
        console.table(userRoles);

        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

assignRolesToExistingUsers();
