const { getPool } = require("../../config/db");

const getActiveTrainingDocuments = async () => {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, title, document_type, version, updated_at FROM ai_training_documents WHERE is_active = TRUE ORDER BY updated_at DESC LIMIT 20"
  );

  return rows;
};

module.exports = {
  getActiveTrainingDocuments,
};
