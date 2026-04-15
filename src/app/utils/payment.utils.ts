export const PaymentUtils = {
    simulateDelay: () => new Promise((resolve) => setTimeout(resolve, 2000)),

    generateTransactionId: (pId: string) => `PLANORA-TXN-${Date.now()}-${pId.slice(0, 4)}`
};