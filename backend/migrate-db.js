// Script để chạy file SQL và migrate database
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

async function migrateDatabase() {
    try {
        // Đọc file SQL
        const sqlFile = path.join(__dirname, 'database', 'alter_tables_1.1.sql');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Chia SQL thành các statement riêng biệt
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute...\n`);
        
        // Chạy từng statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`[${i + 1}/${statements.length}] Executing...`);
            console.log(`${statement.substring(0, 80)}...\n`);
            
            try {
                await db.execute(statement);
                console.log(`✅ Statement ${i + 1} completed successfully\n`);
            } catch (error) {
                console.error(`❌ Error in statement ${i + 1}:`, error.message);
                console.error(`Statement: ${statement.substring(0, 100)}...\n`);
                // Tiếp tục với statement tiếp theo thay vì dừng
            }
        }
        
        console.log('\n✅ Database migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration error:', error.message);
        process.exit(1);
    }
}

migrateDatabase();
