import express from 'express';
import { Role } from '../../../generated/prisma/client';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { NotificationController } from './notification.controller';
import { NotificationValidations } from './notification.validation';

const router = express.Router();

// Get personal notifications with filters
router.get(
    '/',
    auth(Role.USER, Role.ADMIN),
    NotificationController.getMyNotifications
);

// Get badge count
router.get(
    '/unread-count',
    auth(Role.USER, Role.ADMIN),
    NotificationController.getUnreadCount
);

// Update all to read
router.patch(
    '/mark-all-read',
    auth(Role.USER, Role.ADMIN),
    NotificationController.markAllAsRead
);

// Bulk delete personal notifications
router.delete(
    '/clear-all',
    auth(Role.USER, Role.ADMIN),
    NotificationController.clearAllNotifications
);

// System cleanup (Admin only)
router.delete(
    '/cleanup',
    auth(Role.ADMIN),
    NotificationController.deleteOldNotifications
);

// Single notification actions (Dynamic IDs at the end)
router.patch(
    '/:id',
    auth(Role.USER, Role.ADMIN),
    validateRequest(NotificationValidations.markAsRead),
    NotificationController.markAsRead
);

router.delete(
    '/:id',
    auth(Role.USER, Role.ADMIN),
    NotificationController.deleteNotification
);

export const NotificationRoutes = router;