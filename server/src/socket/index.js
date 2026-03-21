import jwt from 'jsonwebtoken';
import db from '../models';
import * as chatServices from '../services/chat';

const onlineUsers = new Map();
const userSockets = new Map();
const lastSeenAt = new Map();

const getUserIdFromSocket = (socket) => {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers.authorization || '').replace('Bearer ', '');

  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

const emitPresence = (io) => {
  const lastSeenAtByUserId = {};
  lastSeenAt.forEach((value, key) => {
    lastSeenAtByUserId[key] = value;
  });
  io.emit('presence:update', {
    onlineUserIds: Array.from(onlineUsers.keys()),
    lastSeenAtByUserId,
  });
};

export const registerSocketHandlers = (io) => {
  io.use((socket, next) => {
    const userId = getUserIdFromSocket(socket);
    if (!userId) return next(new Error('UNAUTHORIZED'));
    socket.userId = userId;
    return next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    const nowIso = new Date().toISOString();
    onlineUsers.set(userId, socket.id);
    lastSeenAt.set(userId, nowIso);
    const socketsOfUser = userSockets.get(userId) || new Set();
    socketsOfUser.add(socket.id);
    userSockets.set(userId, socketsOfUser);
    socket.join(`user:${userId}`);
    emitPresence(io);

    const memberships = await db.Conversation_Member.findAll({
      where: { user_id: userId },
      attributes: ['conversation_id'],
    });
    memberships.forEach((m) => socket.join(`conversation:${m.conversation_id}`));

    socket.emit('auth:ok', { userId });

    socket.on('conversation:join', async ({ conversationId }) => {
      const member = await db.Conversation_Member.findOne({
        where: { conversation_id: conversationId, user_id: userId },
      });
      if (member) socket.join(`conversation:${conversationId}`);
    });

    socket.on('presence:heartbeat', () => {
      lastSeenAt.set(userId, new Date().toISOString());
    });

    socket.on('presence:sync', () => {
      const lastSeenAtByUserId = {};
      lastSeenAt.forEach((value, key) => {
        lastSeenAtByUserId[key] = value;
      });
      socket.emit('presence:update', {
        onlineUserIds: Array.from(onlineUsers.keys()),
        lastSeenAtByUserId,
      });
    });

    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    socket.on('message:send', async ({ conversationId, content, type, attachment_url, reply_to_id }) => {
      const response = await chatServices.sendMessageService(conversationId, userId, {
        content,
        type,
        attachment_url,
        reply_to_id,
      });

      if (response.err) {
        socket.emit('message:error', { conversationId, msg: response.msg });
        return;
      }

      io.to(`conversation:${conversationId}`).emit('message:new', {
        conversationId,
        message: response.response,
      });

      const members = await db.Conversation_Member.findAll({
        where: { conversation_id: conversationId },
        attributes: ['user_id'],
      });
      members.forEach((member) => {
        io.to(`user:${member.user_id}`).emit('message:new', {
          conversationId,
          message: response.response,
        });
      });
    });

    socket.on('message:read', async ({ conversationId }) => {
      const response = await chatServices.markAsReadService(conversationId, userId);
      if (!response.err) {
        io.to(`conversation:${conversationId}`).emit('message:read:updated', {
          conversationId,
          userId,
          readAt: new Date().toISOString(),
        });
      }
    });

    socket.on('message:edit', async ({ conversationId, messageId, content }) => {
      const response = await chatServices.editMessageService(messageId, userId, content);
      if (response.err) {
        socket.emit('message:error', { conversationId, msg: response.msg });
        return;
      }
      io.to(`conversation:${conversationId}`).emit('message:updated', {
        conversationId,
        message: response.response,
      });
    });

    socket.on('message:delete', async ({ conversationId, messageId }) => {
      const response = await chatServices.deleteMessageService(messageId, userId);
      if (response.err) {
        socket.emit('message:error', { conversationId, msg: response.msg });
        return;
      }
      io.to(`conversation:${conversationId}`).emit('message:deleted', {
        conversationId,
        messageId,
      });
    });

    socket.on('message:pin', async ({ conversationId, messageId, isPinned }) => {
      const response = await chatServices.togglePinMessageService(messageId, userId, isPinned);
      if (response.err) {
        socket.emit('message:error', { conversationId, msg: response.msg });
        return;
      }
      io.to(`conversation:${conversationId}`).emit('message:pinned', {
        conversationId,
        message: response.response,
      });
    });

    socket.on('call:invite', async ({ conversationId, toUserId, mode }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:incoming', {
          conversationId,
          fromUserId: userId,
          mode,
        });
      }
    });

    socket.on('call:accept', ({ conversationId, toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:accepted', { conversationId, byUserId: userId });
      }
    });

    socket.on('call:reject', ({ conversationId, toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:rejected', { conversationId, byUserId: userId });
      }
    });

    socket.on('call:end', ({ conversationId, toUserId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ended', { conversationId, byUserId: userId });
      }
    });

    socket.on('webrtc:offer', ({ toUserId, offer, conversationId, mode }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:offer', { fromUserId: userId, offer, conversationId, mode });
      }
    });

    socket.on('webrtc:answer', ({ toUserId, answer, conversationId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:answer', { fromUserId: userId, answer, conversationId });
      }
    });

    socket.on('webrtc:ice-candidate', ({ toUserId, candidate, conversationId }) => {
      const targetSocketId = onlineUsers.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('webrtc:ice-candidate', {
          fromUserId: userId,
          candidate,
          conversationId,
        });
      }
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          onlineUsers.delete(userId);
          lastSeenAt.set(userId, new Date().toISOString());
        } else {
          userSockets.set(userId, sockets);
          onlineUsers.set(userId, Array.from(sockets)[0]);
          lastSeenAt.set(userId, new Date().toISOString());
        }
      }
      emitPresence(io);
    });
  });
};
