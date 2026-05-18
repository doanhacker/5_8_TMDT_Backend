const test = require('node:test');
const assert = require('node:assert/strict');

const authController = require('../controllers/authController');
const User = require('../models/userModel');
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const originalFns = {
    dbGetConnection: db.getConnection,
    userFindByEmail: User.findByEmail,
    userCreate: User.create,
    userAssignRole: User.assignRole,
    userFindById: User.findById,
    bcryptGenSalt: bcrypt.genSalt,
    bcryptHash: bcrypt.hash,
    jwtSign: jwt.sign
};

const restoreAll = () => {
    db.getConnection = originalFns.dbGetConnection;
    User.findByEmail = originalFns.userFindByEmail;
    User.create = originalFns.userCreate;
    User.assignRole = originalFns.userAssignRole;
    User.findById = originalFns.userFindById;
    bcrypt.genSalt = originalFns.bcryptGenSalt;
    bcrypt.hash = originalFns.bcryptHash;
    jwt.sign = originalFns.jwtSign;
};

const createMockResponse = () => {
    const result = {
        statusCode: null,
        payload: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.payload = body;
            return this;
        }
    };

    return result;
};

const createMockConnection = () => {
    const state = {
        beginCount: 0,
        commitCount: 0,
        rollbackCount: 0,
        releaseCount: 0
    };

    return {
        state,
        async beginTransaction() {
            state.beginCount += 1;
        },
        async commit() {
            state.commitCount += 1;
        },
        async rollback() {
            state.rollbackCount += 1;
        },
        release() {
            state.releaseCount += 1;
        },
        async execute() {
            return [];
        }
    };
};

test.afterEach(() => {
    restoreAll();
});

test.after(async () => {
    // authController loads the shared DB pool module; close it so node --test can exit.
    if (typeof db.end === 'function') {
        await db.end();
    }
});

test('register rolls back when role assignment fails', async () => {
    const connection = createMockConnection();

    db.getConnection = async () => connection;
    User.findByEmail = async () => null;
    bcrypt.genSalt = async () => 'salt';
    bcrypt.hash = async () => 'hashed-password';
    User.create = async () => 999;
    User.assignRole = async () => {
        throw new Error('Role insert failed');
    };
    User.findById = async () => ({
        user_id: 999,
        email: 'new@example.com',
        token_version: 1
    });
    jwt.sign = () => 'fake-token';

    const req = {
        body: {
            email: 'new@example.com',
            password: '123456',
            full_name: 'New User',
            phone_number: '0900000000'
        }
    };
    const res = createMockResponse();

    await authController.register(req, res);

    assert.equal(res.statusCode, 500);
    assert.equal(connection.state.beginCount, 1);
    assert.equal(connection.state.commitCount, 0);
    assert.equal(connection.state.rollbackCount, 1);
    assert.equal(connection.state.releaseCount, 1);
    assert.equal(res.payload.success, false);
});

test('register commits and returns 201 on success', async () => {
    const connection = createMockConnection();

    db.getConnection = async () => connection;
    User.findByEmail = async () => null;
    bcrypt.genSalt = async () => 'salt';
    bcrypt.hash = async () => 'hashed-password';
    User.create = async () => 1000;
    User.assignRole = async () => undefined;
    User.findById = async () => ({
        user_id: 1000,
        email: 'ok@example.com',
        full_name: 'OK User',
        phone_number: '0900000001',
        status: 'ACTIVE',
        token_version: 1,
        created_at: new Date().toISOString()
    });
    jwt.sign = () => 'fake-token';

    const req = {
        body: {
            email: 'ok@example.com',
            password: '123456',
            full_name: 'OK User',
            phone_number: '0900000001'
        }
    };
    const res = createMockResponse();

    await authController.register(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(connection.state.beginCount, 1);
    assert.equal(connection.state.commitCount, 1);
    assert.equal(connection.state.rollbackCount, 0);
    assert.equal(connection.state.releaseCount, 1);
    assert.equal(res.payload.success, true);
    assert.equal(res.payload.data.token, 'fake-token');
});
