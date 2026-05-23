const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const paymentController = require('../backend/controllers/paymentController');
const db = require('../backend/config/db');
const { Payment } = require('../backend/models/paymentModel');
const momoHelper = require('../backend/helpers/momoHelper');
const vnpayHelper = require('../backend/helpers/vnpayHelper');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  res.redirect = function (url) { this._status = 302; this._body = { redirect: url }; return this; };
  return res;
}

describe('Payment Controller - processPayment', () => {
  const origDbGetConnection = db.getConnection;
  const origPaymentGetByOrderId = Payment.getByOrderId;
  const origPaymentCreate = Payment.createPayment;
  const origCreateMoMo = momoHelper.createMoMoPaymentRequest;
  const origBuildVnpay = vnpayHelper.buildVnpayUrl;
  const origFetch = global.fetch;

  afterEach(() => {
    db.getConnection = origDbGetConnection;
    Payment.getByOrderId = origPaymentGetByOrderId;
    Payment.createPayment = origPaymentCreate;
    momoHelper.createMoMoPaymentRequest = origCreateMoMo;
    vnpayHelper.buildVnpayUrl = origBuildVnpay;
    global.fetch = origFetch;
    delete process.env.MOMO_PARTNER_CODE;
    delete process.env.MOMO_ACCESS_KEY;
    delete process.env.MOMO_SECRET_KEY;
    delete process.env.MOMO_API_URL;
    delete process.env.MOMO_RETURN_URL;
    delete process.env.MOMO_NOTIFY_URL;
  });

  test('Thanh toán COD thành công', async () => {
    const req = { body: { order_id: 1001, payment_method: 'COD' } };

    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async (sql) => {
        if (sql.includes('FROM orders')) {
          return [[{ order_id: 1001, status: 'PENDING_CONFIRMATION', total_amount: 123000 }]];
        }
        return [[]];
      }
    };

    db.getConnection = async () => mockConn;
    Payment.getByOrderId = async () => null;
    Payment.createPayment = async () => 2001;

    const res = createRes();
    await paymentController.processPayment(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.payment_method, 'COD');
    assert.equal(res._body.data.payment_status, 'UNPAID');
  });

  test('Thanh toán online (MoMo) thành công', async () => {
    const req = { body: { order_id: 1002, payment_method: 'MOMO' } };

    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async (sql) => {
        if (sql.includes('FROM orders')) {
          return [[{ order_id: 1002, status: 'PENDING_CONFIRMATION', total_amount: 50000 }]];
        }
        return [[]];
      }
    };

    // Provide MOMO env vars to avoid `.trim()` on undefined
    process.env.MOMO_PARTNER_CODE = 'pc';
    process.env.MOMO_ACCESS_KEY = 'ak';
    process.env.MOMO_SECRET_KEY = 'sk';
    process.env.MOMO_API_URL = 'https://momo.example';
    process.env.MOMO_RETURN_URL = 'https://app.example/return';
    process.env.MOMO_NOTIFY_URL = 'https://app.example/ipn';

    // Stub fetch used by createMoMoPaymentRequest
    global.fetch = async () => ({ json: async () => ({ resultCode: 0, payUrl: 'https://momo/pay/2002' }) });

    db.getConnection = async () => mockConn;
    Payment.getByOrderId = async () => null;
    Payment.createPayment = async () => 2002;

    const res = createRes();
    await paymentController.processPayment(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.payment_method, 'MOMO');
    assert.equal(res._body.data.payment_url, 'https://momo/pay/2002');
  });

  test('Thanh toán online (MoMo) thất bại', async () => {
    const req = { body: { order_id: 1003, payment_method: 'MOMO' } };

    const mockConn = {
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
      query: async (sql) => {
        if (sql.includes('FROM orders')) {
          return [[{ order_id: 1003, status: 'PENDING_CONFIRMATION', total_amount: 75000 }]];
        }
        return [[]];
      }
    };

    process.env.MOMO_PARTNER_CODE = 'pc';
    process.env.MOMO_ACCESS_KEY = 'ak';
    process.env.MOMO_SECRET_KEY = 'sk';
    process.env.MOMO_API_URL = 'https://momo.example';
    process.env.MOMO_RETURN_URL = 'https://app.example/return';
    process.env.MOMO_NOTIFY_URL = 'https://app.example/ipn';

    global.fetch = async () => ({ json: async () => ({ resultCode: 1, message: 'Insufficient funds' }) });

    db.getConnection = async () => mockConn;
    Payment.getByOrderId = async () => null;
    Payment.createPayment = async () => 2003;

    const res = createRes();
    await paymentController.processPayment(req, res);

    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'MoMo từ chối giao dịch: Insufficient funds');
  });
});
