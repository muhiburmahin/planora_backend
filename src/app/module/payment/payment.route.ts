import express from 'express';
import { PaymentController } from './payment.controller';

const router = express.Router();

router.post('/init', PaymentController.processPayment);
router.get('/callback/success', PaymentController.paymentSuccess);

export const PaymentRoutes = router;