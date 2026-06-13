import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getNotifications)
  .delete(protect, clearNotifications);

router.put('/read-all', protect, markAllAsRead);

router.route('/:id')
  .delete(protect, deleteNotification);

router.put('/:id/read', protect, markAsRead);

export default router;
