import express from 'express';
import * as controllers from '../controllers/notification';

const router = express.Router();

router.get('/my', controllers.getMyNotifications);
router.put('/:notificationId/read', controllers.markNotificationAsRead);
router.put('/read-all', controllers.markAllNotificationsAsRead);

export default router;
