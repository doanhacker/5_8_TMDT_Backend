/**
 * Tạo hoặc cập nhật tài khoản Admin để test trang /admin
 * Chạy: node test/create-admin.js
 */
const path = require('path');
const backendDir = path.join(__dirname, '../backend');
const bcrypt = require(path.join(backendDir, 'node_modules/bcrypt'));
const mysql = require(path.join(backendDir, 'node_modules/mysql2/promise'));

const ADMINS = [
  {
    email: 'admin.test@laptop-shop.com',
    password: 'Admin@123',
    full_name: 'Admin Test',
    phone_number: '0901234567',
  },
  {
    email: 'admin@laptopshop.vn',
    password: 'Admin@123456',
    full_name: 'Admin Demo',
    phone_number: '0900000001',
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'laptop_ecommerce_db',
    port: 3306,
  });

  for (const ADMIN of ADMINS) {
    const hash = await bcrypt.hash(ADMIN.password, 10);
    const [existing] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [ADMIN.email]);
    let userId;
    if (existing.length) {
      userId = existing[0].user_id;
      await conn.execute(
        'UPDATE users SET password_hash = ?, full_name = ?, phone_number = ?, status = ? WHERE user_id = ?',
        [hash, ADMIN.full_name, ADMIN.phone_number, 'ACTIVE', userId]
      );
      console.log('Đã cập nhật admin:', ADMIN.email);
    } else {
      const [result] = await conn.execute(
        'INSERT INTO users (email, password_hash, full_name, phone_number, status) VALUES (?, ?, ?, ?, ?)',
        [ADMIN.email, hash, ADMIN.full_name, ADMIN.phone_number, 'ACTIVE']
      );
      userId = result.insertId;
      console.log('Đã tạo admin:', ADMIN.email, 'user_id=', userId);
    }
    await conn.execute(
      'INSERT INTO user_roles (user_id, role_id) VALUES (?, 1) ON DUPLICATE KEY UPDATE role_id = 1',
      [userId]
    );
  }

  const seedHash = await bcrypt.hash('Admin@123', 10);
  await conn.execute('UPDATE users SET password_hash = ? WHERE email = ?', [seedHash, 'admin@laptop-shop.com']);

  await conn.end();

  console.log('\n========================================');
  console.log('ĐĂNG NHẬP TRANG ADMIN');
  console.log('URL: http://localhost:5173/dang-nhap → /admin');
  console.log('----------------------------------------');
  for (const a of ADMINS) {
    console.log(`  ${a.email} / ${a.password}`);
  }
  console.log('  admin@laptop-shop.com / Admin@123');
  console.log('========================================\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
