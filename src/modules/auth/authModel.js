const { getPool } = require("../../config/db");

const findUserByEmail = async (email) => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, role_id, full_name, email, phone, status, created_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );

  return rows[0] || null;
};

module.exports = {
  findUserByEmail,
};
