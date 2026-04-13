const { getPool } = require("../../config/db");

const getActiveModels = async () => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, model_name, model_type, version, status FROM recommendation_models ORDER BY updated_at DESC"
  );

  return rows;
};

module.exports = {
  getActiveModels,
};
