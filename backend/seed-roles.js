// Script để insert roles vào database
const pool = require('./config/db');

async function seedRoles() {
    try {
        console.log('🌱 Seeding roles...\n');

        // Insert roles
        await pool.execute(`
            INSERT INTO roles (role_id, role_name) VALUES 
            (1, 'ADMIN'),
            (2, 'STAFF'),
            (3, 'CUSTOMER')
            ON DUPLICATE KEY UPDATE role_name = VALUES(role_name)
        `);

        console.log('✅ Roles inserted successfully');

        // Verify
        const [roles] = await pool.execute('SELECT * FROM roles');
        console.log('\nRoles in database:');
        console.table(roles);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding roles:', error.message);
        process.exit(1);
    }
}

seedRoles();
