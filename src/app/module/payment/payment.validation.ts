import { z } from 'zod';

export const PaymentValidation = {
  createPaymentIntent: z.object({
    body: z.object({
      participationId: z.string({ message: 'Participation ID is required' }),
      amount: z.number({ message: 'Amount is required' }).positive('Amount must be positive')
    })
  })
};