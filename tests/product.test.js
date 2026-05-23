const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const productController = require('../backend/controllers/productController');
const Product = require('../backend/models/productModel');
const User = require('../backend/models/userModel');

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

describe('Product Controller - Listing and Detail', () => {
  const originalProduct = { ...Product };
  const originalUser = { ...User };

  afterEach(() => {
    Object.keys(Product).forEach((key) => {
      Product[key] = originalProduct[key];
    });
    Object.keys(User).forEach((key) => {
      User[key] = originalUser[key];
    });
  });

  test('Hiển thị danh sách sản phẩm khi truy cập trang sản phẩm', async () => {
    const req = {
      query: { page: '1', limit: '12' },
      user: { user_id: 1, roles: [{ role_name: 'CUSTOMER' }] }
    };

    const expectedProducts = [
      { product_id: 1, product_name: 'Laptop ABC', min_price: 20000000 }
    ];

    Product.getAll = async () => expectedProducts;
    Product.getTotalCount = async () => 1;

    const res = createRes();
    await productController.getAllProducts(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.length, 1);
    assert.equal(res._body.pagination.total, 1);
    assert.equal(res._body.data[0].product_name, 'Laptop ABC');
  });

  test('Tìm kiếm và lọc sản phẩm có kết quả phù hợp', async () => {
    const req = {
      query: {
        page: '1',
        limit: '12',
        search: 'laptop gaming',
        minPrice: '15000000',
        maxPrice: '25000000',
        brandId: '1',
        deviceType: 'LAPTOP'
      },
      user: { user_id: 1, roles: [{ role_name: 'CUSTOMER' }] }
    };

    let capturedOptions = null;
    Product.getAll = async (options) => {
      capturedOptions = options;
      return [
        { product_id: 2, product_name: 'ASUS ROG Strix', min_price: 22000000 }
      ];
    };
    Product.getTotalCount = async () => 1;

    const res = createRes();
    await productController.getAllProducts(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.length, 1);
    assert.equal(res._body.pagination.total, 1);
    assert.equal(res._body.data[0].product_name, 'ASUS ROG Strix');
    assert.equal(capturedOptions.search, 'laptop gaming');
    assert.equal(capturedOptions.brandId, 1);
    assert.equal(capturedOptions.minPrice, 15000000);
    assert.equal(capturedOptions.maxPrice, 25000000);
    assert.equal(capturedOptions.deviceType, 'LAPTOP');
  });

  test('Tìm kiếm/lọc không có sản phẩm phù hợp', async () => {
    const req = {
      query: {
        page: '1',
        limit: '12',
        search: 'sản phẩm không tồn tại',
        minPrice: '1000000',
        maxPrice: '2000000'
      },
      user: { user_id: 1, roles: [{ role_name: 'CUSTOMER' }] }
    };

    Product.getAll = async () => [];
    Product.getTotalCount = async () => 0;

    const res = createRes();
    await productController.getAllProducts(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.data.length, 0);
    assert.equal(res._body.pagination.total, 0);
  });

  test('Lỗi tải dữ liệu sản phẩm', async () => {
    const req = {
      query: { page: '1', limit: '12' },
      user: { user_id: 1, roles: [{ role_name: 'CUSTOMER' }] }
    };

    Product.getAll = async () => {
      throw new Error('Database connection lost');
    };
    Product.getTotalCount = async () => 0;

    const res = createRes();
    await productController.getAllProducts(req, res);

    assert.equal(res._status, 500);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Lỗi máy chủ nội bộ');
  });

  test('Xem chi tiết sản phẩm tồn tại', async () => {
    const req = {
      params: { productId: '10' },
      headers: {},
      user: null
    };

    Product.getById = async () => ({
      product_id: 10,
      product_name: 'Laptop ABC',
      description_html: '<p>Mô tả</p>',
      variants: [],
      reviews: [],
      average_rating: 0,
      total_visible_reviews: 0
    });

    const res = createRes();
    await productController.getProductById(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.product_name, 'Laptop ABC');
  });

  test('Xem chi tiết sản phẩm không tồn tại/đã bị xóa', async () => {
    const req = {
      params: { productId: '999999' },
      headers: {},
      user: null
    };

    Product.getById = async () => null;

    const res = createRes();
    await productController.getProductById(req, res);

    assert.equal(res._status, 404);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Sản phẩm không tồn tại!');
  });

  test('Sản phẩm hợp lệ nhưng chưa có đánh giá', async () => {
    const req = {
      params: { productId: '11' },
      headers: {},
      user: null
    };

    Product.getById = async () => ({
      product_id: 11,
      product_name: 'Laptop No Review',
      description_html: '<p>Mô tả</p>',
      variants: [],
      reviews: [],
      average_rating: 0,
      total_visible_reviews: 0
    });

    const res = createRes();
    await productController.getProductById(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.data.reviews.length, 0);
    assert.equal(res._body.data.average_rating, 0);
    assert.equal(res._body.data.total_visible_reviews, 0);
  });
});
