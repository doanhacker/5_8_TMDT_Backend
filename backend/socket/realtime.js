const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let ioInstance = null;

const getTokenFromHandshake = (socket) => {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) return authToken;

    const header = socket.handshake?.headers?.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7).trim();

    return null;
};

const getUserIdFromToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.user_id || decoded.id || decoded.userId;
};

const initRealtime = (httpServer) => {
    if (ioInstance) return ioInstance;

    ioInstance = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_ORIGIN || '*',
            methods: ['GET', 'POST']
        }
    });

    ioInstance.on('connection', (socket) => {
        try {
            const token = getTokenFromHandshake(socket);
            if (!token) return socket.disconnect(true);

            const userId = getUserIdFromToken(token);
            if (!userId) return socket.disconnect(true);

            socket.join(`user:${userId}`);
        } catch {
            socket.disconnect(true);
        }
    });

    return ioInstance;
};

const getIO = () => ioInstance;

const emitToUser = (userId, event, payload) => {
    if (!ioInstance || !userId) return;
    ioInstance.to(`user:${userId}`).emit(event, payload);
};

const emitToUsers = (userIds, event, payload) => {
    if (!ioInstance || !Array.isArray(userIds) || userIds.length ===0) return;
    for(const userId of userIds) {
        ioInstance.to(`user:${userId}`).emit(event, payload);
    }
};

module.exports = {
    initRealtime,
    getIO,
    emitToUser,
    emitToUsers
};
