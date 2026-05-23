const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const orderController = require('../backend/controllers/orderController');
const User = require('../backend/models/userModel');
const UserAddress = require('../backend/models/userAddressModel');
const Product = require('../backend/models/productModel');
const Order = require('../backend/models/orderModel');
const Voucher = require('../backend/models/voucherModel');
const notificationService = require('../backend/services/notificationService');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res.status = function (code) { this._status = code; return this; };
  res.json = function (obj) { this._body = obj; return this; };
  return res;
}

describe('Order Controller - Create Order', () => {
  const origUser = { ...User };
  const origUserAddress = { ...UserAddress };
  const origProduct = { ...Product };
  const origOrder = { ...Order };
  const origVoucher = { ...Voucher };
  const origNotification = { ...notificationService };

  afterEach(() => {
    Object.keys(User).forEach(k => User[k] = origUser[k]);
    Object.keys(UserAddress).forEach(k => UserAddress[k] = origUserAddress[k]);
    Object.keys(Product).forEach(k => Product[k] = origProduct[k]);
    Object.keys(Order).forEach(k => Order[k] = origOrder[k]);
    Object.keys(Voucher).forEach(k => Voucher[k] = origVoucher[k]);
    Object.keys(notificationService).forEach(k => notificationService[k] = origNotification[k]);
  });

  test('Đặt hàng thành công với thông tin hợp lệ', async () => {
    const req = {
      body: {
        user_id: 10,
        address_id: 55,
        order_type: 'NORMAL',
        items: [{ variant_id: 501, quantity: 1 }]
      }
    };

    User.findById = async (id) => ({ user_id: id, email: 'a@example.com' });
    UserAddress.getById = async (id) => ({ address_id: id, user_id: 10, name: 'Nguyễn Văn A' });
    Voucher.getById = async (id) => null;
    Product.variantExists = async (variantId) => true;
    Order.createOrder = async (orderData, items) => 7777;
    notificationService.notifyByTemplate = async () => {};

    const res = createRes();
    await orderController.createOrder(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.order_id, 7777);
  });

  test('Đặt trước sản phẩm (PRE_ORDER) hợp lệ', async () => {
    const req = {
      body: {
        user_id: 11,
        order_type: 'PRE_ORDER',
        estimated_delivery_date: '2026-06-01',
        items: [{ variant_id: 600, quantity: 1 }]
      }
    };

    User.findById = async (id) => ({ user_id: id });
    Product.variantExists = async (variantId) => true;
    Order.createOrder = async () => 8888;
    notificationService.notifyByTemplate = async () => {};

    const res = createRes();
    await orderController.createOrder(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.order_id, 8888);
  });

  test('Thông tin giao hàng không hợp lệ (address_id không hợp lệ)', async () => {
    const req = {
      body: {
        user_id: 12,
        address_id: 9999,
        items: [{ variant_id: 700, quantity: 1 }]
      }
    };

    User.findById = async (id) => ({ user_id: id });
    UserAddress.getById = async (id) => null; // address not found
    Product.variantExists = async () => true;

    const res = createRes();
    await orderController.createOrder(req, res);

    assert.equal(res._status, 404);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Địa chỉ giao hàng không tồn tại hoặc không thuộc về người dùng này.');
  });

  test('Sản phẩm trong giỏ không còn đủ số lượng khi đặt hàng', async () => {
    const req = {
      body: {
        user_id: 20,
        items: [{ variant_id: 501, quantity: 3 }]
      }
    };

    User.findById = async (id) => ({ user_id: id });
    Product.variantExists = async () => true;
    // Simulate model throwing insufficient stock error
    Order.createOrder = async () => { throw new Error('Số lượng tồn kho của phiên bản ID 501 không đủ. Chỉ còn 1 sản phẩm.'); };

    const res = createRes();
    await orderController.createOrder(req, res);

    assert.equal(res._status, 500);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Số lượng tồn kho của phiên bản ID 501 không đủ. Chỉ còn 1 sản phẩm.');
  });
});
