import express from 'express';
import { Role } from '../../../generated/prisma/client';
import auth from '../../middleware/auth';
import validateRequest from '../../middleware/validateRequest';
import { InvitationController } from './invitation.controller';
import { InvitationValidations } from './invitation.validation';

const router = express.Router();


router.get(
    '/inbox',
    auth(Role.USER, Role.ADMIN),
    InvitationController.getMyInvitations
);

router.get(
    '/sent',
    auth(Role.USER, Role.ADMIN),
    InvitationController.getSentInvitations
);


router.get(
    '/',
    auth(Role.ADMIN),
    InvitationController.getAllInvitations
);

router.delete(
    '/cleanup',
    auth(Role.ADMIN),
    InvitationController.cleanupInvitations
);


router.post(
    '/send',
    auth(Role.USER, Role.ADMIN),
    validateRequest(InvitationValidations.sendInvitation),
    InvitationController.sendInvitation
);

router.patch(
    '/:id/respond',
    auth(Role.USER, Role.ADMIN),
    validateRequest(InvitationValidations.respondToInvitation),
    InvitationController.respondToInvitation
);

router.delete(
    '/:id/withdraw',
    auth(Role.USER, Role.ADMIN),
    InvitationController.withdrawInvitation
);


router.get(
    '/:id',
    auth(Role.USER, Role.ADMIN),
    InvitationController.getSingleInvitation
);

export const InvitationRoutes = router;