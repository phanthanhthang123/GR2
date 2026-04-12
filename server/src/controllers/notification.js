import jwt from 'jsonwebtoken';
import * as services from '../services/notification';

const getUserIdFromToken = (req) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : req.cookies?.accessToken || null;

  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id ? String(decoded.id) : null;
  } catch (error) {
    return null;
  }
};

export const getMyNotifications = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { limit } = req.query;
    const response = await services.getMyNotificationsService(userId, limit);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: `FAILED AT GET MY NOTIFICATIONS: ${error.message}` });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const { notificationId } = req.params;
    const response = await services.markNotificationAsReadService(userId, notificationId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: `FAILED AT MARK NOTIFICATION AS READ: ${error.message}` });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    if (!userId) return res.status(401).json({ err: 1, msg: 'UNAUTHORIZED' });
    const response = await services.markAllNotificationsAsReadService(userId);
    return res.status(response.err ? 400 : 200).json(response);
  } catch (error) {
    return res.status(500).json({ err: -1, msg: `FAILED AT MARK ALL NOTIFICATIONS AS READ: ${error.message}` });
  }
};
