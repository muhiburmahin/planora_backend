/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { envVars } from '../../config/env';
import AppError from '../../errorHelpers/appError';
import httpStatus from 'http-status';
import { PaymentStatus } from '../../../generated/prisma/client';

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-01-27' as any,
});

const createPaymentIntent = async (payload: { participationId: string; amount: number }) => {
  const { participationId, amount } = payload;
  
  const participation = await prisma.participation.findUnique({ 
    where: { id: participationId },
    include: { event: true }
  });
  
  if (!participation) throw new AppError(httpStatus.NOT_FOUND, "Participation not found");
  if (!participation.event) throw new AppError(httpStatus.NOT_FOUND, "Event not found");

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    metadata: { participationId },
  });

  // Create or update payment record
  const existingPayment = await prisma.payment.findUnique({
    where: { participationId }
  });

  if (existingPayment) {
    const paymentDetails = (existingPayment.paymentDetails as any) || {};
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        amount,
        paymentIntentId: paymentIntent.id,
        paymentDetails: { ...paymentDetails, clientSecret: paymentIntent.client_secret }
      }
    });
  } else {
    await prisma.payment.create({
      data: {
        participationId,
        amount,
        paymentIntentId: paymentIntent.id,
        paymentDetails: { clientSecret: paymentIntent.client_secret }
      }
    });
  }

  return { clientSecret: paymentIntent.client_secret };
};

const handleWebhook = async (body: Buffer, signature: string) => {
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(body, signature, envVars.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    throw new AppError(httpStatus.BAD_REQUEST, `Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    const participationId = paymentIntent.metadata.participationId;

    // Update payment status
    const payment = await prisma.payment.findUnique({
      where: { participationId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date()
        }
      });
    }

    // Update participation payment status
    await prisma.participation.update({
      where: { id: participationId },
      data: { paymentStatus: PaymentStatus.PAID }
    });
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as any;
    const participationId = paymentIntent.metadata.participationId;

    const payment = await prisma.payment.findUnique({
      where: { participationId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: PaymentStatus.FAILED }
      });
    }

    await prisma.participation.update({
      where: { id: participationId },
      data: { paymentStatus: PaymentStatus.FAILED }
    });
  }
};

export const PaymentService = { createPaymentIntent, handleWebhook };