const db = require('../config/db');

let tableReadyPromise = null;

const ensureTable = async () => {
  if (!tableReadyPromise) {
    tableReadyPromise = db.query(`
      CREATE TABLE IF NOT EXISTS community_qa (
        qa_id INT AUTO_INCREMENT PRIMARY KEY,
        user_name VARCHAR(120) NOT NULL,
        question_content TEXT NOT NULL,
        answer_content TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }

  await tableReadyPromise;
};

const mapRow = (row) => ({
  qa_id: row.qa_id,
  user_name: row.user_name,
  question_content: row.question_content,
  answer_content: row.answer_content,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const CommunityQa = {
  getById: async (qaId) => {
    await ensureTable();
    const [rows] = await db.query(
      `SELECT qa_id, user_name, question_content, answer_content, created_at, updated_at
       FROM community_qa
       WHERE qa_id = ?
       LIMIT 1`,
      [qaId]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  getRecent: async (limit = 20) => {
    await ensureTable();
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const [rows] = await db.query(
      `SELECT qa_id, user_name, question_content, answer_content, created_at, updated_at
       FROM community_qa
       ORDER BY created_at DESC
       LIMIT ?`,
      [safeLimit]
    );

    return rows.map(mapRow);
  },

  createQuestion: async ({ userName, questionContent }) => {
    await ensureTable();

    const [result] = await db.query(
      `INSERT INTO community_qa (user_name, question_content)
       VALUES (?, ?)`,
      [userName, questionContent]
    );

    const [rows] = await db.query(
      `SELECT qa_id, user_name, question_content, answer_content, created_at, updated_at
       FROM community_qa
       WHERE qa_id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return rows[0] ? mapRow(rows[0]) : null;
  },

  answerQuestion: async ({ qaId, answerContent }) => {
    await ensureTable();

    await db.query(
      `UPDATE community_qa
       SET answer_content = ?
       WHERE qa_id = ?`,
      [answerContent, qaId]
    );

    return CommunityQa.getById(qaId);
  },
};

module.exports = CommunityQa;
