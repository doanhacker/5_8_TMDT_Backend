const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function cleanupDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laptop_ecommerce_db',
    multipleStatements: true
  });

  try {
    console.log('🧹 Đang xóa dữ liệu từ cơ sở dữ liệu...');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Delete data from all product-related tables
    const tables = [
      'product_variants',
      'product_images',
      'product_specifications',
      'reviews',
      'products',
      'brands',
      'categories',
      'sliders',
      'vouchers',
      'orders',
      'cart_items'
    ];

    for (const table of tables) {
      try {
        const result = await connection.execute(`DELETE FROM ${table}`);
        console.log(`✅ Xóa dữ liệu từ bảng ${table}: ${result[0].affectedRows} dòng`);
      } catch (err) {
        console.log(`⚠️ Bảng ${table} không tìm thấy hoặc rỗng`);
      }
    }

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✨ Hoàn tất! Tất cả dữ liệu đã bị xóa.');
    console.log('📦 Các bảng dữ liệu vẫn còn, chỉ dữ liệu bên trong bị xóa.');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupDatabase();
