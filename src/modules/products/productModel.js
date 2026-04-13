const { getPool } = require("../../config/db");

const getFeaturedProducts = async () => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, slug, base_price, sale_price, stock_status, product_type FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT 12"
  );

  return rows;
};

module.exports = {
  getFeaturedProducts,
};
