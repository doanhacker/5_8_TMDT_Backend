const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const paymentController = require('../backend/controllers/paymentController');
const checkoutService = require('../backend/services/checkoutService');
const db = require('../backend/config/db');
const { Payment } = require('../backend/models/paymentModel');
const Order = require('../backend/models/orderModel');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res._redirect = null;
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  res.redirect = function (url) { this._redirect = url; return this; };
  return res;
}

describe('VNPay Return / IPN and CheckoutService idempotency', () => {
  const vnpayHelper = require('../backend/helpers/vnpayHelper');
  const origVerify = vnpayHelper.verifyVnpaySignature;
  const origHandle = checkoutService.handleSuccessfulPayment;
  const origDbQuery = db.query;
  const origGetConn = db.getConnection;
  const origMark = Payment.markAsPaidIfNeeded;
  const origGetByOrder = Payment.getByOrderId;
  const origOrderUpdatePaymentId = Order.updateOrderPaymentId;
  const origOrderUpdateStatus = Order.updateOrderStatus;
  const origNotify = require('../backend/services/notificationService').notifyOrderPaid;

  afterEach(() => {
    vnpayHelper.verifyVnpaySignature = origVerify;
    checkoutService.handleSuccessfulPayment = origHandle;
    db.query = origDbQuery;
    db.getConnection = origGetConn;
    Payment.markAsPaidIfNeeded = origMark;
    Payment.getByOrderId = origGetByOrder;
    Order.updateOrderPaymentId = origOrderUpdatePaymentId;
    Order.updateOrderStatus = origOrderUpdateStatus;
    require('../backend/services/notificationService').notifyOrderPaid = origNotify;
    delete process.env.FRONTEND_ORIGIN;
  });

  test('vnpayReturn success calls checkoutService and redirects', async () => {
    process.env.FRONTEND_ORIGIN = 'https://app.example';
    // ensure helper verify exists and won't throw
    process.env.VNPAY_HASH_SECRET = 'testsecret';
    vnpayHelper.verifyVnpaySignature = () => true;

    // re-require controller to pick up stubbed helper
    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');

    let called = false;
    checkoutService.handleSuccessfulPayment = async (orderId, method, txnId) => {
      called = true;
      assert.equal(orderId, 123);
      assert.equal(method, 'VNPAY');
      assert.equal(txnId, 'TXN123');
    };

    const req = { query: { vnp_ResponseCode: '00', vnp_TxnRef: '123_20260523', vnp_TransactionNo: 'TXN123' } };
    const res = createRes();
    await paymentControllerFresh.vnpayReturn(req, res);

    assert.equal(called, true);
    assert.equal(res._redirect, 'https://app.example/payment/success?orderId=123');
  });

  test('vnpayReturn invalid signature returns 400', async () => {
    process.env.VNPAY_HASH_SECRET = 'testsecret';
    vnpayHelper.verifyVnpaySignature = () => false;
    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');

    const req = { query: { vnp_ResponseCode: '00', vnp_TxnRef: '1_1', vnp_TransactionNo: 'T' } };
    const res = createRes();
    await paymentControllerFresh.vnpayReturn(req, res);
    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
  });

  test('vnpayIPN invalid signature returns RspCode 97', async () => {
    vnpayHelper.verifyVnpaySignature = (params) => false;
    const req = { query: {} };
    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');
    const res = createRes();
    await paymentControllerFresh.vnpayIPN(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.RspCode, '97');
  });

  test('vnpayIPN order not found returns RspCode 01', async () => {
    process.env.VNPAY_HASH_SECRET = 'testsecret';
    vnpayHelper.verifyVnpaySignature = (params) => true;
    db.query = async () => [[]]; // no orderRows
    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');
    const req = { query: { vnp_TxnRef: '999_1', vnp_Amount: '10000', vnp_TransactionNo: 'T' } };
    const res = createRes();
    await paymentControllerFresh.vnpayIPN(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.RspCode, '01');
  });

  test('vnpayIPN amount mismatch returns RspCode 04', async () => {
    process.env.VNPAY_HASH_SECRET = 'testsecret';
    vnpayHelper.verifyVnpaySignature = (params) => true;
    db.query = async (sql, params) => {
      if (sql.includes('SELECT order_id')) return [[{ order_id: 5, total_amount: 200 }]]; // order total 200
      return [[{ total: 1 }]];
    };
    // vnp_Amount expected in cents in controller -> amount = parseInt(...) /100
    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');
    const req = { query: { vnp_TxnRef: '5_1', vnp_Amount: String(100 * 100), vnp_TransactionNo: 'T' } }; // 10000 => 100
    const res = createRes();
    await paymentControllerFresh.vnpayIPN(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.RspCode, '04');
  });

  test('vnpayIPN success calls checkoutService and returns 00', async () => {
    process.env.VNPAY_HASH_SECRET = 'testsecret';
    vnpayHelper.verifyVnpaySignature = (params) => true;
    db.query = async (sql, params) => {
      if (sql.includes('SELECT order_id')) return [[{ order_id: 7, total_amount: 150 }]];
      return [[{ total: 1 }]];
    };

    let handled = false;
    checkoutService.handleSuccessfulPayment = async (orderId, method, txnId) => {
      handled = true;
      assert.equal(orderId, 7);
      assert.equal(method, 'VNPAY');
      assert.equal(txnId, 'TRANX7');
    };

    delete require.cache[require.resolve('../backend/controllers/paymentController')];
    const paymentControllerFresh = require('../backend/controllers/paymentController');
    const req = { query: { vnp_TxnRef: '7_1', vnp_Amount: String(150 * 100), vnp_TransactionNo: 'TRANX7' } };
    const res = createRes();
    await paymentControllerFresh.vnpayIPN(req, res);
    assert.equal(handled, true);
    assert.equal(res._status, 200);
    assert.equal(res._body.RspCode, '00');
  });

  test('checkoutService idempotent when payment already PAID', async () => {
    // Mock connection
    const mockConn = {
      beginTransaction: async () => { mockConn._bt = true; },
      commit: async () => { mockConn._commit = true; },
      rollback: async () => { mockConn._rb = true; },
      release: () => { mockConn._rel = true; }
    };
    db.getConnection = async () => mockConn;

    Payment.markAsPaidIfNeeded = async () => 0; // already PAID

    // Make update functions throw if called to ensure they are not invoked
    Order.updateOrderPaymentId = async () => { throw new Error('Should not call updateOrderPaymentId'); };
    Order.updateOrderStatus = async () => { throw new Error('Should not call updateOrderStatus'); };
    require('../backend/services/notificationService').notifyOrderPaid = async () => { throw new Error('Should not notify'); };

    // Should not throw
    await checkoutService.handleSuccessfulPayment(42, 'VNPAY', 'TXN42');
  });

  test('checkoutService processes payment when markAsPaidIfNeeded changes row', async () => {
    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => { mockConn._commit = true; },
      rollback: async () => { mockConn._rb = true; },
      release: () => { mockConn._rel = true; }
    };
    db.getConnection = async () => mockConn;

    Payment.markAsPaidIfNeeded = async () => 1;
    Payment.getByOrderId = async () => ({ payment_id: 900 });

    let calledUpdatePaymentId = false;
    let calledUpdateOrderStatus = false;
    let calledNotify = false;

    Order.updateOrderPaymentId = async (orderId, paymentId, connection) => { calledUpdatePaymentId = true; return 1; };
    Order.updateOrderStatus = async (orderId, status, ed, connection) => { calledUpdateOrderStatus = true; return 1; };
    require('../backend/services/notificationService').notifyOrderPaid = async () => { calledNotify = true; };

    await checkoutService.handleSuccessfulPayment(55, 'VNPAY', 'TXN55');

    assert.equal(calledUpdatePaymentId, true);
    assert.equal(calledUpdateOrderStatus, true);
    assert.equal(calledNotify, true);
  });
});
