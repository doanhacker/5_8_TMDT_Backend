const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const aiController = require('../backend/controllers/aiController');
const productController = require('../backend/controllers/productController');
const Product = require('../backend/models/productModel');
const AiChatLog = require('../backend/models/aiChatLogModel');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  return res;
}

describe('AI Chat & Product Suggestions (30-33,34-36)', () => {
  const origProduct = { ...Product };
  const origAiLog = { ...AiChatLog };
  const origFetch = global.fetch;

  afterEach(() => {
    Object.keys(Product).forEach(k => Product[k] = origProduct[k]);
    Object.keys(AiChatLog).forEach(k => AiChatLog[k] = origAiLog[k]);
    global.fetch = origFetch;
  });

  test('30 - Khách gửi câu hỏi, AI trả lời và lưu lịch sử', async () => {
    const req = { body: { message: 'Laptop nào phù hợp học IT tầm 20 triệu?' }, user: { user_id: 5 } };

    Product.getAll = async () => [{ product_id: 1, product_name: 'Laptop A' }];
    global.fetch = async () => ({ ok: true, json: async () => ({ answer: 'Gợi ý: Laptop A' }) });

    let created = [];
    AiChatLog.create = async (obj) => { created.push(obj); return 1; };

    const res = createRes();
    await aiController.chat(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.answer, 'Gợi ý: Laptop A');
    // two log entries: user and bot
    assert.equal(created.length, 2);
    assert.equal(created[0].senderType, 'USER');
    assert.equal(created[1].senderType, 'BOT');
  });

  test('31 - AI không hiểu câu hỏi và controller vẫn lưu lịch sử', async () => {
    const req = { body: { message: 'Cái kia còn không?' }, user: { user_id: 6 } };
    Product.getAll = async () => [];
    global.fetch = async () => ({ ok: true, json: async () => ({ answer: 'Xin lỗi, tôi không hiểu câu hỏi này.' }) });

    let created = [];
    AiChatLog.create = async (obj) => { created.push(obj); return 1; };

    const res = createRes();
    await aiController.chat(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.answer.includes('không hiểu'), true);
    assert.equal(created.length, 2);
  });

  test('32 - Hiển thị gợi ý sản phẩm dựa trên tìm kiếm/hành vi (search suggest)', async () => {
    const req = { query: { q: 'laptop', limit: '5' }, user: { user_id: 7 } };
    const suggestionData = { products: [{ product_id: 10, product_name: 'Laptop Suggest' }], categories: [] };
    Product.getSearchSuggestions = async (q, l, c) => suggestionData;

    const res = createRes();
    await productController.getSearchSuggestions(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.products.length, 1);
    assert.equal(res._body.data.products[0].product_name, 'Laptop Suggest');
  });

  test('33 - Người dùng chưa đăng nhập vẫn xem gợi ý (empty q returns empty lists)', async () => {
    const req = { query: { q: '' }, user: null };
    const res = createRes();
    await productController.getSearchSuggestions(req, res);

    assert.equal(res._status, 200);
    assert.deepEqual(res._body.data, { categories: [], products: [] });
  });

  test('34-36 - Các kịch bản chuyển human / không đủ thông tin / không hài lòng: controller lưu logs và trả lời', async () => {
    const req = { body: { message: 'Chi tiết hơn về pin?' }, user: { user_id: 8 } };
    Product.getAll = async () => [{ product_id: 2, product_name: 'Laptop B' }];
    // Simulate AI indicating escalate or asking for more info
    global.fetch = async () => ({ ok: true, json: async () => ({ answer: 'Tôi cần thêm thông tin. Chuyển sang nhân viên.', action: 'escalate' }) });

    let created = [];
    AiChatLog.create = async (obj) => { created.push(obj); return 1; };

    const res = createRes();
    await aiController.chat(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.answer.includes('Chuyển sang nhân viên'), true);
    assert.equal(created.length, 2);
  });
});
