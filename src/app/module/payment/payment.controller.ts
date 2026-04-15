import { Request, Response } from 'express';
import { PaymentService } from './payment.service';
import catchAsync from '../../shared/catchAsync';
import { envVars } from '../../config/env';


const processPayment = catchAsync(async (req: Request, res: Response) => {
    const successUrl = await PaymentService.initMockPayment(req.body);

    res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: successUrl
    });
});

const paymentSuccess = catchAsync(async (req: Request, res: Response) => {
    const { tranId, pId } = req.query;

    if (!tranId || !pId) {
        return res.redirect(`${envVars.FRONTEND_URL}/payment/error`);
    }

    await PaymentService.verifyMockPayment(tranId as string, pId as string);

    res.redirect(`${envVars.FRONTEND_URL}/dashboard/my-events?payment=success&tranId=${tranId}`);
});

export const PaymentController = { processPayment, paymentSuccess };