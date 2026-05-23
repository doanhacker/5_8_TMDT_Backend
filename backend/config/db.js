const mysql = require('mysql2/promise');
require('dotenv').config();

// Tạo Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laptop_ecommerce_db',
    port: Number(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chạy test kết nối ngay khi file này được gọi
pool.getConnection()
    .then(connection => {
        console.log(
            `✅ Kết nối thành công đến MySQL (DB: ${process.env.DB_NAME || 'laptop_ecommerce_db'}) trên cổng ${process.env.DB_PORT || 3306}`
        );
        connection.release(); // Trả kết nối lại cho Pool
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database:', err.message);
    });

module.exports = pool;