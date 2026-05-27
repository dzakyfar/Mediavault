const prisma = require('../config/prisma');
const { formatCurrency } = require('../utils/formatters');

const formatWalletTransaction = (transaction) => ({
  id: transaction.id,
  type: transaction.type,
  amount: transaction.amount,
  amountFormatted: formatCurrency(transaction.amount),
  balanceAfter: transaction.balanceAfter,
  balanceAfterFormatted: formatCurrency(transaction.balanceAfter),
  description: transaction.description,
  referenceType: transaction.referenceType,
  referenceId: transaction.referenceId,
  createdAt: transaction.createdAt,
});

const getWalletBalance = async (client, userId) => {
  const wallet = await client.wallet.findUnique({ where: { userId } });
  return wallet?.balance || 0;
};

const recordMutation = async (
  client,
  userId,
  type,
  amount,
  description,
  referenceType = null,
  referenceId = null
) => {
  const normalizedAmount = Math.max(0, Math.round(Number(amount) || 0));
  if (normalizedAmount <= 0) {
    throw new Error('Nominal mutasi saldo harus lebih dari Rp 0');
  }

  const currentBalance = await getWalletBalance(client, userId);
  const balanceAfter = type === 'CREDIT'
    ? currentBalance + normalizedAmount
    : currentBalance - normalizedAmount;

  if (balanceAfter < 0) {
    throw new Error('Saldo tidak cukup');
  }

  await client.wallet.upsert({
    where: { userId },
    update: { balance: balanceAfter },
    create: { userId, balance: balanceAfter },
  });

  return client.walletTransaction.create({
    data: {
      userId,
      type,
      amount: normalizedAmount,
      balanceAfter,
      description,
      referenceType,
      referenceId,
    },
  });
};

const creditWallet = (client, userId, amount, description, referenceType = null, referenceId = null) =>
  recordMutation(client, userId, 'CREDIT', amount, description, referenceType, referenceId);

const debitWallet = (client, userId, amount, description, referenceType = null, referenceId = null) =>
  recordMutation(client, userId, 'DEBIT', amount, description, referenceType, referenceId);

const getWalletSummary = async (userId) => {
  const [wallet, transactions, withdrawals] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.withdrawal.findMany({
      where: { freelancerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return {
    balance: wallet?.balance || 0,
    balanceFormatted: formatCurrency(wallet?.balance || 0),
    transactions: transactions.map(formatWalletTransaction),
    withdrawals: withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      amountFormatted: formatCurrency(withdrawal.amount),
      adminFee: withdrawal.adminFee,
      adminFeeFormatted: formatCurrency(withdrawal.adminFee),
      netAmount: withdrawal.netAmount,
      netAmountFormatted: formatCurrency(withdrawal.netAmount),
      method: withdrawal.bankName,
      accountNumber: withdrawal.accountNumber,
      accountName: withdrawal.accountName,
      status: withdrawal.status,
      createdAt: withdrawal.createdAt,
      processedAt: withdrawal.processedAt,
    })),
  };
};

module.exports = {
  creditWallet,
  debitWallet,
  formatWalletTransaction,
  getWalletSummary,
};
