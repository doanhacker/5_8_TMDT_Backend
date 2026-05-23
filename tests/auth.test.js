const { describe, test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');

const authController = require('../backend/controllers/authController');
const User = require('../backend/models/userModel');
const db = require('../backend/config/db');

// Helper to create a mock Express `res` object
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

describe('Auth Controller - Register / Login', () => {
  const originalUser = { ...User };
  const originalDbGetConnection = db.getConnection;

  afterEach(() => {
    // restore mocked methods
    Object.keys(User).forEach(k => {
      User[k] = originalUser[k];
    });
    db.getConnection = originalDbGetConnection;
  });

  test('Register succeeds with new Email/SĐT', async () => {
    const req = {
      body: {
        email: 'khachhang01@example.com',
        password: 'P@ssword123',
        full_name: 'Nguyễn Văn A',
        phone_number: '0912345678'
      }
    };

    // Mock DB connection methods used by controller
    db.getConnection = async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {}
    });

    // Mock User model methods
    User.findByEmail = async () => null; // not exists
    User.create = async () => 123; // new id
    User.assignRole = async () => {};
    User.findById = async (id) => ({
      user_id: id,
      email: 'khachhang01@example.com',
      full_name: 'Nguyễn Văn A',
      phone_number: '0912345678',
      status: 'ACTIVE',
      token_version: 1
    });
    User.getUserRoles = async () => [];

    const res = createRes();
    await authController.register(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.success, true);
    assert.equal(res._body.message, 'Đăng ký tài khoản thành công');
    assert.ok(res._body.data.token);
    assert.equal(res._body.data.user.email, 'khachhang01@example.com');
  });

  test('Register fails when Email/SĐT already exists', async () => {
    const req = { body: { email: 'khachhang01@example.com', password: 'P@ssword123', full_name: 'Nguyễn Văn A' } };

    db.getConnection = async () => ({
      beginTransaction: async () => {},
      rollback: async () => {},
      release: () => {}
    });

    User.findByEmail = async () => ({ user_id: 1, email: 'khachhang01@example.com' });

    const res = createRes();
    await authController.register(req, res);

    assert.equal(res._status, 409);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Email đã được đăng ký');
  });

  test('Login succeeds with valid account', async () => {
    const password = 'P@ssword123';
    const password_hash = await bcrypt.hash(password, 10);

    const req = { body: { email: 'khachhang01@example.com', password } };

    User.findByEmail = async () => ({
      user_id: 1,
      email: 'khachhang01@example.com',
      password_hash,
      status: 'ACTIVE',
      token_version: 1,
      full_name: 'Nguyễn Văn A'
    });
    User.getUserRoles = async () => [];

    const res = createRes();
    await authController.login(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.success, true);
    assert.equal(res._body.message, 'Đăng nhập thành công');
    assert.ok(res._body.data.token);
    assert.equal(res._body.data.user.email, 'khachhang01@example.com');
  });

  test('Login fails with wrong password', async () => {
    const correctHash = await bcrypt.hash('P@ssword123', 10);

    const req = { body: { email: 'khachhang01@example.com', password: 'sai123' } };

    User.findByEmail = async () => ({
      user_id: 1,
      email: 'khachhang01@example.com',
      password_hash: correctHash,
      status: 'ACTIVE'
    });

    const res = createRes();
    await authController.login(req, res);

    assert.equal(res._status, 401);
    assert.equal(res._body.success, false);
    assert.equal(res._body.message, 'Email hoặc mật khẩu không đúng');
  });
});
