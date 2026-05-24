const db = require('../config/db');
const CommunityQa = require('../models/communityQaModel');
const { emitBroadcast } = require('../socket/realtime');

const normalizeQuestion = (row) => ({
  id: row.qa_id,
  user: row.user_name,
  question: row.question_content,
  answer: row.answer_content || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const resolveUserName = async (req) => {
  const userId = req.user?.user_id;
  if (!userId) return 'Khach hang';

  const [rows] = await db.query(
    'SELECT full_name, email FROM users WHERE user_id = ? LIMIT 1',
    [userId]
  );

  const user = rows[0];
  if (!user) return 'Khach hang';

  const fullName = String(user.full_name || '').trim();
  if (fullName) return fullName;

  const email = String(user.email || '').trim();
  if (email) return email;

  return 'Khach hang';
};

const communityQaController = {
  getRecentQuestions: async (req, res) => {
    try {
      const items = await CommunityQa.getRecent(req.query.limit);
      return res.status(200).json({
        success: true,
        data: items.map(normalizeQuestion),
      });
    } catch (error) {
      console.error('[communityQaController.getRecentQuestions]', error);
      return res.status(500).json({
        success: false,
        message: 'Khong the tai danh sach hoi dap',
      });
    }
  },

  createQuestion: async (req, res) => {
    try {
      const questionContent = String(req.body?.question || req.body?.question_content || '').trim();

      if (!questionContent) {
        return res.status(400).json({
          success: false,
          message: 'Vui long nhap cau hoi',
        });
      }

      if (questionContent.length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Cau hoi toi da 1000 ky tu',
        });
      }

      const userName = await resolveUserName(req);
      const created = await CommunityQa.createQuestion({
        userName,
        questionContent,
      });

      const item = normalizeQuestion(created);

      emitBroadcast('qa:changed', {
        action: 'created',
        item,
        at: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: 'Gui cau hoi thanh cong',
        data: item,
      });
    } catch (error) {
      console.error('[communityQaController.createQuestion]', error);
      return res.status(500).json({
        success: false,
        message: 'Khong the gui cau hoi',
      });
    }
  },

  answerQuestion: async (req, res) => {
    try {
      const qaId = Number(req.params.id);
      const answerContent = String(req.body?.answer || req.body?.answer_content || '').trim();

      if (!Number.isInteger(qaId) || qaId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Ma cau hoi khong hop le',
        });
      }

      if (!answerContent) {
        return res.status(400).json({
          success: false,
          message: 'Vui long nhap cau tra loi',
        });
      }

      if (answerContent.length > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Cau tra loi toi da 2000 ky tu',
        });
      }

      const existing = await CommunityQa.getById(qaId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Khong tim thay cau hoi',
        });
      }

      const updated = await CommunityQa.answerQuestion({
        qaId,
        answerContent,
      });

      const item = normalizeQuestion(updated);

      emitBroadcast('qa:changed', {
        action: 'answered',
        item,
        at: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: 'Tra loi cau hoi thanh cong',
        data: item,
      });
    } catch (error) {
      console.error('[communityQaController.answerQuestion]', error);
      return res.status(500).json({
        success: false,
        message: 'Khong the tra loi cau hoi',
      });
    }
  },
};

module.exports = communityQaController;
