const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const cartController = require('../backend/controllers/cartController');
const Cart = require('../backend/models/cartModel');
const db = require('../backend/config/db');

function createRes() {
  const res = {};
  res._status = null;
  res._body = null;
  res.status = function (code) {
    this._status = code;
    return this;
  };
  res.json = function (obj) {
    this._body = obj;
    return this;
  };
  return res;
}

describe('Cart Controller - Add / Update / Remove', () => {
  const originalCart = { ...Cart };
  const originalDbQuery = db.query;
  const originalDbGetConnection = db.getConnection;

  afterEach(() => {
    Object.keys(Cart).forEach((key) => {
      Cart[key] = originalCart[key];
    });
    db.query = originalDbQuery;
    db.getConnection = originalDbGetConnection;
  });

  test('Thêm sản phẩm còn hàng vào giỏ hàng', async () => {
    const req = {
      cartId: 101,
      body: { variant_id: 501, quantity: 1 }
    };

    db.query = async (sql) => {
      if (sql.includes('FROM product_variants')) {
        return [[{ stock_quantity: 10, status: 'IN_STOCK' }]];
      }
      throw new Error('Unexpected query');
    };
    Cart.addItem = async () => 9001;

    const res = createRes();
    await cartController.addItemToCart(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.message, 'Thêm sản phẩm vào giỏ hàng thành công!');
    assert.equal(res._body.data.cart_id, 101);
    assert.equal(res._body.data.variant_id, 501);
    assert.equal(res._body.data.quantity_added, 1);
  });

  test('Chỉnh sửa số lượng sản phẩm trong giỏ hợp lệ', async () => {
    const req = {
      cartId: 101,
      body: { variant_id: 501, quantity: 2 }
    };

    db.query = async (sql) => {
      if (sql.includes('FROM product_variants')) {
        return [[{ stock_quantity: 10, status: 'IN_STOCK' }]];
      }
      throw new Error('Unexpected query');
    };
    Cart.updateItemQuantity = async () => 1;
    Cart.getCartDetails = async () => ([
      { variant_id: 501, quantity: 2, product_name: 'Laptop ABC', total_price: 40000000 }
    ]);

    const res = createRes();
    await cartController.updateCartItemQuantity(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.message, 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công!');
    assert.equal(res._body.data.cart_id, 101);
    assert.equal(res._body.data.items[0].quantity, 2);
  });

  test('Xóa sản phẩm khỏi giỏ hàng', async () => {
    const req = {
      cartId: 101,
      params: { variantId: '501' }
    };

    Cart.removeItem = async () => 1;
    Cart.getCartDetails = async () => ([]);

    const res = createRes();
    await cartController.removeItemFromCart(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.message, 'Xóa sản phẩm khỏi giỏ hàng thành công!');
    assert.equal(res._body.data.cart_id, 101);
    assert.equal(res._body.data.items.length, 0);
  });

  test('Thêm sản phẩm đã hết hàng vào giỏ', async () => {
    const req = {
      cartId: 101,
      body: { variant_id: 777, quantity: 1 }
    };

    db.query = async (sql) => {
      if (sql.includes('FROM product_variants')) {
        return [[{ stock_quantity: 0, status: 'OUT_OF_STOCK' }]];
      }
      throw new Error('Unexpected query');
    };

    const res = createRes();
    await cartController.addItemToCart(req, res);

    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Phiên bản sản phẩm này hiện không có sẵn để thêm vào giỏ hàng.');
  });

  test('Chọn số lượng vượt quá tồn kho', async () => {
    const req = {
      cartId: 101,
      body: { variant_id: 501, quantity: 5 }
    };

    db.query = async (sql) => {
      if (sql.includes('FROM product_variants')) {
        return [[{ stock_quantity: 3, status: 'IN_STOCK' }]];
      }
      throw new Error('Unexpected query');
    };

    const res = createRes();
    await cartController.addItemToCart(req, res);

    assert.equal(res._status, 400);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Số lượng yêu cầu (5) vượt quá số lượng tồn kho (3).');
  });
});
