import express from 'express';
import { Role } from '../../../generated/prisma/client';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { NotificationController } from './notification.controller';
import { NotificationValidations } from './notification.validation';

const router = express.Router();


router.get(
    '/',
    auth(Role.USER, Role.ADMIN),
    NotificationController.getMyNotifications
);


router.get(
    '/unread-count',
    auth(Role.USER, Role.ADMIN),
    NotificationController.getUnreadCount
);


router.patch(
    '/mark-all-read',
    auth(Role.USER, Role.ADMIN),
    NotificationController.markAllAsRead
);


router.delete(
    '/clear-all',
    auth(Role.USER, Role.ADMIN),
    NotificationController.clearAllNotifications
);


router.delete(
    '/cleanup',
    auth(Role.ADMIN),
    NotificationController.deleteOldNotifications
);

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