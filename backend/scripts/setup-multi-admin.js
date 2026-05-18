const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function setupMultiAdminSystem() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'laptop_ecommerce_db',
    multipleStatements: true
  });

  try {
    console.log('🔧 Bắt đầu setup Multi-Admin System...\n');

    // ====== STEP 1: Chạy migration ======
    console.log('📝 STEP 1: Thêm cột created_by vào bảng products...');
    const migrationSQL = `
      ALTER TABLE products ADD COLUMN created_by INT DEFAULT NULL AFTER created_at;
      ALTER TABLE products ADD CONSTRAINT fk_products_created_by 
      FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL;
      CREATE INDEX idx_products_created_by ON products(created_by);
    `;
    
    try {
      await connection.query(migrationSQL);
      console.log('✅ Migration thành công\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Cột created_by đã tồn tại\n');
      } else {
        throw err;
      }
    }

    // ====== STEP 2: Kiểm tra và tạo admin users ======
    console.log('👤 STEP 2: Tạo các admin users...');

    const adminUsers = [
      {
        email: 'admin.laptop@shop.com',
        name: 'Admin Laptop',
        phone: '0901111111',
        password: 'AdminLaptop@123'
      },
      {
        email: 'admin.dienthoai@shop.com',
        name: 'Admin Điện Thoại',
        phone: '0902222222',
        password: 'AdminPhone@123'
      },
      {
        email: 'admin.tablet@shop.com',
        name: 'Admin Tablet',
        phone: '0903333333',
        password: 'AdminTablet@123'
      },
      {
        email: 'admin.accessory@shop.com',
        name: 'Admin Phụ Kiện',
        phone: '0904444444',
        password: 'AdminAccessory@123'
      },
      {
        email: 'admin.smartwatch@shop.com',
        name: 'Admin Smartwatch',
        phone: '0905555555',
        password: 'AdminWatch@123'
      }
    ];

    for (const admin of adminUsers) {
      // Kiểm tra xem email đã tồn tại chưa
      const [existingUsers] = await connection.query(
        'SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)',
        [admin.email]
      );

      if (existingUsers.length > 0) {
        console.log(`⚠️  ${admin.name} (${admin.email}) - Đã tồn tại`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(admin.password, 10);

      // Tạo user mới
      const [insertResult] = await connection.query(
        'INSERT INTO users (email, password_hash, full_name, phone_number, status) VALUES (?, ?, ?, ?, ?)',
        [admin.email, hashedPassword, admin.name, admin.phone, 'ACTIVE']
      );

      const userId = insertResult.insertId;

      // Assign role admin (role_id = 1)
      await connection.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)',
        [userId, 1] // 1 = admin role
      );

      console.log(`✅ ${admin.name}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔐 Password: ${admin.password}`);
      console.log(`   📱 Phone: ${admin.phone}\n`);
    }

    console.log('✨ Setup hoàn tất! Multi-Admin System đã sẵn sàng.\n');
    console.log('📋 Hướng dẫn sử dụng:');
    console.log('   1. Mỗi admin có thể đăng nhập bằng email/password của họ');
    console.log('   2. Khi tạo sản phẩm, hệ thống sẽ tự động ghi nhận admin là creator');
    console.log('   3. Admin chỉ có thể chỉnh sửa sản phẩm của chính họ (trừ super admin)\n');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

setupMultiAdminSystem().catch(err => {
  console.error('Setup thất bại:', err);
  process.exit(1);
});
