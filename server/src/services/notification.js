import db from '../models';
import { v4 } from 'uuid';

const safeParseJson = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeNotification = (row) => ({
  id: row.id,
  user_id: row.user_id,
  message: row.message,
  is_read: row.is_read,
  payload: safeParseJson(row.payload),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createNotificationService = (userId, message, payload = null) =>
  new Promise(async (resolve) => {
    try {
      if (!userId || !message) {
        return resolve({ err: 1, msg: 'MISSING_REQUIRED_FIELDS' });
      }
      const now = new Date();
      const row = await db.Notification.create({
        id: v4(),
        user_id: String(userId),
        message,
        payload: payload ? JSON.stringify(payload) : null,
        is_read: 'FALSE',
        createdAt: now,
        updatedAt: now,
      });
      return resolve({ err: 0, msg: 'OK', response: normalizeNotification(row) });
    } catch (error) {
      return resolve({ err: 1, msg: `FAILED TO CREATE NOTIFICATION: ${error.message}` });
    }
  });

export const getMyNotificationsService = (userId, limit = 20) =>
  new Promise(async (resolve) => {
    try {
      const rows = await db.Notification.findAll({
        where: { user_id: String(userId) },
        order: [['createdAt', 'DESC']],
        limit: Math.max(1, Math.min(Number(limit) || 20, 100)),
      });
      const response = rows.map(normalizeNotification);
      const unreadCount = response.filter((n) => n.is_read === 'FALSE').length;
      return resolve({ err: 0, msg: 'OK', response, unreadCount });
    } catch (error) {
      return resolve({ err: 1, msg: `FAILED TO GET NOTIFICATIONS: ${error.message}`, response: [], unreadCount: 0 });
    }
  });

export const markNotificationAsReadService = (userId, notificationId) =>
  new Promise(async (resolve) => {
    try {
      const row = await db.Notification.findOne({
        where: {
          id: notificationId,
          user_id: String(userId),
        },
      });
      if (!row) return resolve({ err: 1, msg: 'NOTIFICATION_NOT_FOUND' });
      row.is_read = 'TRUE';
      await row.save();
      return resolve({ err: 0, msg: 'OK', response: normalizeNotification(row) });
    } catch (error) {
      return resolve({ err: 1, msg: `FAILED TO MARK NOTIFICATION AS READ: ${error.message}` });
    }
  });

export const markAllNotificationsAsReadService = (userId) =>
  new Promise(async (resolve) => {
    try {
      await db.Notification.update(
        { is_read: 'TRUE' },
        { where: { user_id: String(userId), is_read: 'FALSE' } }
      );
      return resolve({ err: 0, msg: 'OK' });
    } catch (error) {
      return resolve({ err: 1, msg: `FAILED TO MARK ALL NOTIFICATIONS AS READ: ${error.message}` });
    }
  });
