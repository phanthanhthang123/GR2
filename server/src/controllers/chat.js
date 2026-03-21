import * as services from '../services/chat';
import jwt from 'jsonwebtoken';

const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : req.cookies?.accessToken || null;

  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.id;
  } catch (error) {
    return null;
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { workspaceId } = req.query;
    const response = await services.getConversationsService(userId, workspaceId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT GET CONVERSATIONS: ' + error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { conversationId } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const response = await services.getMessagesService(conversationId, userId, page, limit);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT GET MESSAGES: ' + error.message });
  }
};

export const createDirectConversation = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { targetUserId, workspaceId } = req.body;
    if (!targetUserId) return res.status(400).json({ err: 1, msg: 'MISSING targetUserId' });
    const response = await services.createDirectConversationService(userId, targetUserId, workspaceId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT CREATE DIRECT CONVERSATION: ' + error.message });
  }
};

export const createGroupConversation = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { title, memberIds, workspaceId } = req.body;
    const response = await services.createGroupConversationService(userId, title, memberIds, workspaceId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT CREATE GROUP CONVERSATION: ' + error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { conversationId } = req.params;
    const response = await services.sendMessageService(conversationId, userId, req.body);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT SEND MESSAGE: ' + error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { conversationId } = req.params;
    const response = await services.markAsReadService(conversationId, userId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: 'FAILED AT MARK AS READ: ' + error.message });
  }
};

