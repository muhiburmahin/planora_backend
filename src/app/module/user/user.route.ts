import express from 'express';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { Role } from '../../../generated/prisma';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';

const router = express.Router();

router.get('/me',
    auth(Role.USER, Role.ADMIN),
    UserController.getMyProfile
);

router.patch('/update-me',
    auth(Role.USER, Role.ADMIN),
    validateRequest(UserValidation.updateProfileSchema),
    UserController.updateMyProfile
);

router.get('/dashboard-summary',
    auth(Role.USER, Role.ADMIN),
    UserController.getDashboardStats
);

router.get('/',
    auth(Role.ADMIN),
    UserController.getAllUsers
);

router.patch('/:id/status',
    auth(Role.ADMIN),
    validateRequest(UserValidation.updateStatusSchema),
    UserController.changeUserStatus
);

router.get('/notifications',
    auth(Role.USER, Role.ADMIN),
    UserController.getMyNotifications
);

export const UserRoutes = router;