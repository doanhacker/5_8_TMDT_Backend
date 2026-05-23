const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const orderController = require('../backend/controllers/orderController');
const reviewController = require('../backend/controllers/reviewController');

const Order = require('../backend/models/orderModel');
const Review = require('../backend/models/reviewModel');
const db = require('../backend/config/db');
const notificationService = require('../backend/services/notificationService');
const reviewValidationHelper = require('../backend/helpers/reviewValidationHelper');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  res.redirect = function (url) { this._status = 302; this._body = { redirect: url }; return this; };
  return res;
}

describe('Order + Review Controllers (24-29)', () => {
  const origOrder = { ...Order };
  const origReview = { ...Review };
  const origDbGetConn = db.getConnection;
  const origNotify = { ...notificationService };
  const origValidate = reviewValidationHelper.validateReviewData;

  afterEach(() => {
    Object.keys(Order).forEach(k => Order[k] = origOrder[k]);
    Object.keys(Review).forEach(k => Review[k] = origReview[k]);
    db.getConnection = origDbGetConn;
    Object.keys(notificationService).forEach(k => notificationService[k] = origNotify[k]);
    reviewValidationHelper.validateReviewData = origValidate;
  });

  test('24 - Khách hàng xem danh sách và chi tiết đơn hàng', async () => {
    const reqList = { query: { user_id: '10' } };
    const orders = [{ order_id: 111, user_id: 10, total_amount: 100000 }];
    Order.getAllOrders = async (opts) => ({ items: orders, pagination: { total: orders.length } });

    const resList = createRes();
    await orderController.getAllOrders(reqList, resList);

    assert.equal(resList._status, 200);
    assert.ok(Array.isArray(resList._body.items));
    assert.equal(resList._body.items[0].order_id, 111);

    // detail
    Order.getOrderById = async (id) => ({ order_id: parseInt(id), user_id: 10, items: [] });
    const reqDetail = { params: { id: '111' } };
    const resDetail = createRes();
    await orderController.getOrderById(reqDetail, resDetail);

    assert.equal(resDetail._status, 200);
    assert.equal(resDetail._body.data.order_id, 111);
  });

  test('25 - Không tìm thấy đơn hàng', async () => {
    Order.getOrderById = async () => null;
    const req = { params: { id: '9999' } };
    const res = createRes();
    await orderController.getOrderById(req, res);

    assert.equal(res._status, 404);
    assert.equal(res._body.message, 'Đơn hàng không tồn tại!');
  });

  test('26 - Khách hàng hủy đơn hàng chưa giao', async () => {
    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    };
    db.getConnection = async () => mockConn;
    Order.updateOrderStatus = async (id, status, ed, connection) => 1; // affectedRows

    const req = { params: { id: '200' } };
    const res = createRes();
    await orderController.cancelOrder(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.new_status, 'CANCELLED');
  });

  test('27 - Gửi đánh giá hợp lệ sau khi mua hàng', async () => {
    const req = { body: { product_id: 50, variant_id: 501, rating: 5, content: 'Sản phẩm tốt' } };
    req.requestingUser = { userId: 77, isAdmin: false };

    reviewValidationHelper.validateReviewData = async () => [];
    Review.hasUserPurchasedAndReceived = async (userId, variantId) => true;
    Review.create = async (data, imageUrls) => 3001;
    notificationService.adminSendToAllActiveUsers = async () => {};

    const res = createRes();
    await reviewController.createReview(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.data.review_id, 3001);
  });

  test('28 - Khách chưa mua sản phẩm nhưng gửi đánh giá', async () => {
    const req = { body: { product_id: 51, variant_id: 502, rating: 4, content: 'Ok' } };
    req.requestingUser = { userId: 78, isAdmin: false };

    reviewValidationHelper.validateReviewData = async () => [];
    Review.hasUserPurchasedAndReceived = async () => false;

    const res = createRes();
    await reviewController.createReview(req, res);

    assert.equal(res._status, 403);
    assert.equal(res._body.message, 'Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng.');
  });

  test('29 - Gửi đánh giá thiếu số sao hoặc nội dung', async () => {
    const req = { body: { product_id: 60, variant_id: 600 } };
    req.requestingUser = { userId: 79, isAdmin: false };

    reviewValidationHelper.validateReviewData = () => ['Số sao đánh giá không được để trống.'];

    const res = createRes();
    await reviewController.createReview(req, res);

    assert.equal(res._status, 400);
    assert.ok(Array.isArray(res._body.errors));
    assert.equal(res._body.errors[0], 'Số sao đánh giá không được để trống.');
  });
});
