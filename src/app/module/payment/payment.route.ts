import express from 'express';
import { PaymentController } from './payment.controller';
import auth from '../../middleware/auth';
import { Role } from '../../../generated/prisma/client';
import validateRequest from '../../middleware/validateRequest';
import { PaymentValidation } from './payment.validation';

const router = express.Router();

router.post(
  '/create-intent',
  auth(Role.USER, Role.ADMIN),
  validateRequest(PaymentValidation.createPaymentIntent),
  PaymentController.createPaymentIntent
);

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

export const PaymentRoutes = router;