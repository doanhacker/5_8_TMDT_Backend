// Script để tạo bảng password_reset_codes
const db = require('./config/db');

async function createPasswordResetTable() {
    try {
        console.log('📝 Creating password_reset_codes table...');
        
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                email VARCHAR(100) NOT NULL,
                reset_code VARCHAR(6) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                INDEX idx_email_code (email, reset_code),
                INDEX idx_expires (expires_at)
            )
        `;
        
        await db.execute(createTableSQL);
        console.log('✅ Table password_reset_codes created successfully!');
        
        // Kiểm tra bảng
        const [tables] = await db.execute("SHOW TABLES LIKE 'password_reset_codes'");
        if (tables.length > 0) {
            console.log('✅ Table verified in database');
            
            // Hiển thị cấu trúc bảng
            const [structure] = await db.execute("DESCRIBE password_reset_codes");
            console.log('\n📋 Table structure:');
            console.table(structure);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating table:', error.message);
        process.exit(1);
    }
}

createPasswordResetTable();
