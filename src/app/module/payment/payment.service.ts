import { envVars } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { PaymentUtils } from '../../utils/payment.utils';
import { TPaymentPayload } from './payment.interface';

const initMockPayment = async (payload: TPaymentPayload) => {
    const transactionId = PaymentUtils.generateTransactionId(payload.participationId);

    await prisma.payment.create({
        data: {
            participationId: payload.participationId,
            amount: payload.amount,
            transactionId: transactionId,
            paymentStatus: 'PENDING',
        },
    });

    const successUrl = `${envVars.BACKEND_URL}/api/v1/payments/callback/success?tranId=${transactionId}&pId=${payload.participationId}`;
    return successUrl;
};

const verifyMockPayment = async (tranId: string, pId: string) => {
    await PaymentUtils.simulateDelay();

    try {
        const paymentData = await prisma.payment.findUnique({
            where: { transactionId: tranId }
        });

        if (!paymentData) {
            throw new Error("Payment record not found!");
        }

        await prisma.payment.update({
            where: { transactionId: tranId },
            data: {
                paymentStatus: 'PAID',
                paidAt: new Date(),
                cardType: 'VISA (Demo)',
                bankTranId: `BANK-REF-${Date.now()}`,
                valId: `VAL-${Date.now()}`,
                storeAmount: 0,
            },
        });

        const updatedParticipation = await prisma.participation.update({
            where: { id: pId },
            data: {
                status: 'PENDING',
                ticketNumber: `TIC-DEMO-${Date.now()}`,
            },
        });

        return updatedParticipation;

    } catch (error) {
        console.error("Payment Verification Error:", error);
        throw error;
    }
};

export const PaymentService = { initMockPayment, verifyMockPayment };