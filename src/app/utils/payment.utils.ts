import { prisma } from "../lib/prisma";
import { PaymentStatus } from "../../generated/prisma/client";

export const PaymentUtils = {
  createInitialPaymentRecord: async (participationId: string, amount: number) => {
    return await prisma.payment.create({
      data: {
        participationId,
        amount,
        paymentStatus: PaymentStatus.PENDING
      }
    });
  }
};