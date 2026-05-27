const prisma = require('../config/prisma');
const { debitWallet, getWalletSummary } = require('../services/walletService');
const { formatCurrency } = require('../utils/formatters');

exports.getMyWallet = async (req, res, next) => {
  try {
    const wallet = await getWalletSummary(req.user.id);
    res.json({ wallet });
  } catch (error) {
    next(error);
  }
};

exports.createWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, accountNumber, accountName } = req.body;
    const parsedAmount = Math.round(Number(amount) || 0);
    const normalizedMethod = String(method || '').toUpperCase();

    if (!['GOPAY', 'OVO', 'DANA'].includes(normalizedMethod)) {
      res.status(400);
      throw new Error('Pilih metode e-wallet: GoPay, OVO, atau DANA');
    }

    if (parsedAmount < 1) {
      res.status(400);
      throw new Error('Nominal withdraw minimal Rp 1 untuk sandbox');
    }

    if (!accountNumber?.trim() || !accountName?.trim()) {
      res.status(400);
      throw new Error('Nomor e-wallet dan nama pemilik wajib diisi');
    }

    const adminFee = Math.round(parsedAmount * 0.01);
    const netAmount = parsedAmount - adminFee;

    const withdrawal = await prisma.$transaction(async (tx) => {
      const created = await tx.withdrawal.create({
        data: {
          freelancerId: req.user.id,
          amount: parsedAmount,
          adminFee,
          netAmount,
          bankName: normalizedMethod,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          status: 'PROCESSING',
          processedAt: new Date(),
        },
      });

      await debitWallet(
        tx,
        req.user.id,
        parsedAmount,
        `Withdraw sandbox ke ${normalizedMethod} sedang diproses. Diterima: ${formatCurrency(netAmount)}.`,
        'WITHDRAWAL',
        created.id
      );

      await tx.notification.create({
        data: {
          userId: req.user.id,
          type: 'PAYMENT',
          title: 'Withdraw sedang diproses',
          body: `Penarikan saldo ${formatCurrency(parsedAmount)} ke ${normalizedMethod} masuk status Sedang Diproses.`,
        },
      });

      return created;
    });

    const wallet = await getWalletSummary(req.user.id);
    res.status(201).json({ withdrawal, wallet });
  } catch (error) {
    next(error);
  }
};

exports.getEscrowOverview = async (req, res, next) => {
  try {
    const escrowStatuses = ['PAID', 'IN_PROGRESS', 'DELIVERED', 'DISPUTED'];
    const [aggregate, payments] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          status: 'PAID',
          project: { status: { in: escrowStatuses } },
        },
        _sum: { baseAmount: true, totalAmount: true },
        _count: { id: true },
      }),
      prisma.payment.findMany({
        where: {
          status: 'PAID',
          project: { status: { in: escrowStatuses } },
        },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              client: { select: { fullName: true } },
              freelancer: { select: { fullName: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 50,
      }),
    ]);

    res.json({
      escrow: {
        heldBaseAmount: aggregate._sum.baseAmount || 0,
        heldBaseAmountFormatted: formatCurrency(aggregate._sum.baseAmount || 0),
        heldTotalAmount: aggregate._sum.totalAmount || 0,
        heldTotalAmountFormatted: formatCurrency(aggregate._sum.totalAmount || 0),
        count: aggregate._count.id,
        payments: payments.map((payment) => ({
          id: payment.id,
          klikqrisOrderId: payment.klikqrisOrderId,
          totalAmountFormatted: formatCurrency(payment.totalAmount),
          baseAmountFormatted: formatCurrency(payment.baseAmount),
          paidAt: payment.paidAt,
          project: payment.project,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
