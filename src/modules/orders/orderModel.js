const { getPool } = require("../../config/db");

const getOrdersByUserId = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, order_code, order_type, total_amount, payment_status, order_status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId]
  );

  return rows;
};

module.exports = {
  getOrdersByUserId,
};
