const prisma = require('../config/prisma');
const { calculateClientCharge, calculateFreelancerNet } = require('../utils/paymentMath');
const { formatCurrency } = require('../utils/formatters');
const {
  checkKlikqrisStatus,
  createKlikqrisTransaction,
  normalizeKlikqrisStatus,
  parseAmount,
} = require('../services/klikqrisService');

const paymentInclude = {
  project: {
    include: {
      client: { select: { fullName: true } },
      freelancer: { select: { fullName: true } },
    },
  },
};

const generateOrderId = () =>
  `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const parseGatewayDate = (value) => (value ? new Date(value) : null);

const serializePayment = (payment) => ({
  id: payment.id,
  projectId: payment.projectId,
  klikqrisOrderId: payment.klikqrisOrderId,
  amountRequest: payment.amountRequest,
  amountRequestFormatted: formatCurrency(payment.amountRequest),
  amountPaid: payment.amountPaid,
  amountPaidFormatted: formatCurrency(payment.amountPaid || payment.totalAmount),
  baseAmount: payment.baseAmount,
  baseAmountFormatted: formatCurrency(payment.baseAmount),
  adminFeeClient: payment.adminFeeClient,
  adminFeeClientFormatted: formatCurrency(payment.adminFeeClient),
  totalAmount: payment.totalAmount,
  totalAmountFormatted: formatCurrency(payment.totalAmount),
  qrisUrl: payment.qrisUrl,
  directUrl: payment.directUrl,
  status: payment.status,
  expiredAt: payment.expiredAt,
  paidAt: payment.paidAt,
  project: payment.project ? {
    id: payment.project.id,
    title: payment.project.title,
    status: payment.project.status,
    client: payment.project.client?.fullName || null,
    freelancer: payment.project.freelancer?.fullName || null,
  } : null,
});

const assertPaymentAccess = (payment, user) => {
  if (!payment || !payment.project) return false;
  return payment.project.clientId === user.id || payment.project.freelancerId === user.id || user.role === 'ADMIN';
};

const processSuccessfulPayment = async (paymentId, amountPaid, paidAt = new Date(), gatewayResponse = null) => {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    if (payment.status === 'PAID') {
      return payment;
    }

    const nextProjectStatus = ['WAITING_PAYMENT', 'OPEN', 'IN_PROGRESS', 'CONFIRMED'].includes(payment.project.status)
      ? 'PAID'
      : payment.project.status;

    const [, updatedPayment] = await Promise.all([
      tx.project.update({
        where: { id: payment.projectId },
        data: {
          status: nextProjectStatus,
          progress: Math.max(payment.project.progress, 30),
        },
      }),
      tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          amountPaid: amountPaid || payment.totalAmount,
          paidAt,
          gatewayResponse: gatewayResponse || payment.gatewayResponse,
        },
        include: paymentInclude,
      }),
      tx.invoice.updateMany({
        where: { projectId: payment.projectId, status: 'PENDING' },
        data: { status: 'PAID' },
      }),
      tx.projectHistory.create({
        data: {
          projectId: payment.projectId,
          actorId: payment.project.clientId,
          title: 'Pembayaran diterima',
          body: `Pembayaran ${formatCurrency(amountPaid || payment.totalAmount)} berhasil diterima via KlikQRIS. Dana dicatat sebagai escrow internal.`,
          eventType: 'PAYMENT_PAID',
        },
      }),
      tx.notification.create({
        data: {
          userId: payment.project.clientId,
          type: 'PAYMENT',
          title: 'Pembayaran berhasil',
          body: 'Pembayaran berhasil! Freelancer sudah diberitahu.',
        },
      }),
      payment.project.freelancerId ? tx.notification.create({
        data: {
          userId: payment.project.freelancerId,
          type: 'PAYMENT',
          title: 'Order dikonfirmasi',
          body: 'Client sudah membayar. Silakan mulai kerjakan.',
        },
      }) : tx.projectHistory.create({
        data: {
          projectId: payment.projectId,
          actorId: payment.project.clientId,
          title: 'Pembayaran tanpa freelancer aktif',
          body: 'Payment berhasil, tetapi project belum memiliki freelancer.',
          eventType: 'PAYMENT_PAID_WITHOUT_FREELANCER',
        },
      }),
    ]);

    return updatedPayment;
  });

  return result;
};

exports.createProjectPayment = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId: req.user.id },
      include: {
        freelancer: { select: { fullName: true } },
        payments: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!project) {
      res.status(404);
      throw new Error('Project tidak ditemukan');
    }

    if (!project.freelancerId) {
      res.status(400);
      throw new Error('Pilih freelancer terlebih dahulu sebelum membuat pembayaran');
    }

    if (!project.budget || project.budget < 10000) {
      res.status(400);
      throw new Error('Budget minimal Rp 10.000 untuk pembayaran QRIS');
    }

    if (['PAID', 'DELIVERED', 'COMPLETED', 'AUTO_COMPLETED'].includes(project.status)) {
      res.status(400);
      throw new Error('Project ini sudah memiliki pembayaran aktif atau selesai');
    }

    const reusablePayment = project.payments.find((payment) =>
      !payment.expiredAt || payment.expiredAt.getTime() > Date.now()
    );

    if (reusablePayment) {
      const payment = await prisma.payment.findUnique({
        where: { id: reusablePayment.id },
        include: paymentInclude,
      });
      res.json({ payment: serializePayment(payment) });
      return;
    }

    const { baseAmount, adminFeeClient, amountRequest } = calculateClientCharge(project.budget);
    const klikqrisOrderId = generateOrderId();
    const description = `Pembayaran ${project.title} - ${project.freelancer.fullName}`;
    const transaction = await createKlikqrisTransaction({
      orderId: klikqrisOrderId,
      amount: amountRequest,
      description,
    });

    if (!transaction.signature) {
      res.status(502);
      throw new Error('Response KlikQRIS tidak menyertakan signature');
    }

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          projectId,
          klikqrisOrderId: transaction.orderId,
          amountRequest,
          baseAmount,
          adminFeeClient,
          totalAmount: transaction.totalAmount || amountRequest,
          qrisUrl: transaction.qrisUrl,
          directUrl: transaction.directUrl,
          signature: transaction.signature,
          status: transaction.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING',
          expiredAt: transaction.expiredAt,
          gatewayResponse: transaction.payload,
        },
        include: paymentInclude,
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'WAITING_PAYMENT',
          progress: Math.max(project.progress, 20),
        },
      }),
      prisma.invoice.create({
        data: {
          projectId,
          number: transaction.orderId,
          amount: transaction.totalAmount || amountRequest,
          status: 'PENDING',
        },
      }),
      prisma.projectHistory.create({
        data: {
          projectId,
          actorId: req.user.id,
          title: 'QRIS pembayaran dibuat',
          body: `Tagihan KlikQRIS ${formatCurrency(transaction.totalAmount || amountRequest)} dibuat dan menunggu pembayaran client.`,
          eventType: 'PAYMENT_CREATED',
        },
      }),
    ]);

    res.status(201).json({ payment: serializePayment(payment) });
  } catch (error) {
    next(error);
  }
};

exports.getProjectPayment = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: {
        projectId: req.params.projectId,
        project: {
          OR: [
            { clientId: req.user.id },
            { freelancerId: req.user.id },
          ],
        },
      },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      res.status(404);
      throw new Error('Payment belum tersedia untuk project ini');
    }

    res.json({ payment: serializePayment(payment) });
  } catch (error) {
    next(error);
  }
};

exports.listMyPayments = async (req, res, next) => {
  try {
    const where = req.user.role === 'FREELANCER'
      ? { project: { freelancerId: req.user.id } }
      : { project: { clientId: req.user.id } };

    const payments = await prisma.payment.findMany({
      where,
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ payments: payments.map(serializePayment) });
  } catch (error) {
    next(error);
  }
};

exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { klikqrisOrderId: req.params.klikqrisOrderId },
      include: paymentInclude,
    });

    if (!assertPaymentAccess(payment, req.user)) {
      res.status(404);
      throw new Error('Payment tidak ditemukan');
    }

    const statusResult = await checkKlikqrisStatus(payment.klikqrisOrderId);
    let nextPayment = payment;

    if (statusResult.status === 'PAID') {
      nextPayment = await processSuccessfulPayment(
        payment.id,
        statusResult.totalAmount || payment.totalAmount,
        statusResult.paidAt || new Date(),
        statusResult.payload
      );
    } else if (statusResult.status === 'EXPIRED' && payment.status !== 'PAID') {
      nextPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'EXPIRED',
          expiredAt: statusResult.expiredAt || payment.expiredAt,
          gatewayResponse: statusResult.payload,
        },
        include: paymentInclude,
      });
    }

    res.json({ payment: serializePayment(nextPayment) });
  } catch (error) {
    next(error);
  }
};

exports.handleKlikqrisWebhook = async (req, res, next) => {
  try {
    const data = req.body?.data || req.body || {};
    const klikqrisOrderId = data.order_id;

    if (!klikqrisOrderId) {
      res.status(400);
      throw new Error('Payload webhook tidak menyertakan order_id');
    }

    const payment = await prisma.payment.findUnique({
      where: { klikqrisOrderId },
      include: paymentInclude,
    });

    if (!payment) {
      res.status(404);
      throw new Error('Payment webhook tidak ditemukan');
    }

    if (!data.signature || data.signature !== payment.signature) {
      res.status(403);
      throw new Error('Signature webhook KlikQRIS tidak valid');
    }

    const normalizedStatus = normalizeKlikqrisStatus(data.status || req.body?.status);

    if (normalizedStatus === 'PAID') {
      await processSuccessfulPayment(
        payment.id,
        parseAmount(data.amount_paid || data.total_amount || data.amount) || payment.totalAmount,
        parseGatewayDate(data.payment_date || data.paid_at) || new Date(),
        req.body
      );
      res.json({ message: 'OK' });
      return;
    }

    if (normalizedStatus === 'EXPIRED' && payment.status !== 'PAID') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'EXPIRED',
          gatewayResponse: req.body,
        },
      });
    }

    res.json({ message: 'OK' });
  } catch (error) {
    next(error);
  }
};

exports.completeProjectSettlement = async (projectId, actorId = null, completionStatus = 'COMPLETED') => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      payments: {
        where: { status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!project || !project.freelancerId || ['COMPLETED', 'AUTO_COMPLETED'].includes(project.status)) {
    return null;
  }

  const payment = project.payments[0];
  if (!payment) {
    throw new Error('Settlement membutuhkan payment yang sudah PAID');
  }

  const { adminFeeWithdraw, freelancerNet } = calculateFreelancerNet(payment.baseAmount);

  const [updatedProject] = await prisma.$transaction([
    prisma.project.update({
      where: { id: projectId },
      data: {
        status: completionStatus,
        progress: 100,
        completedAt: new Date(),
      },
    }),
    prisma.wallet.upsert({
      where: { userId: project.freelancerId },
      update: { balance: { increment: freelancerNet } },
      create: { userId: project.freelancerId, balance: freelancerNet },
    }),
    prisma.projectHistory.create({
      data: {
        projectId,
        actorId,
        title: completionStatus === 'AUTO_COMPLETED' ? 'Dana auto-release' : 'Dana diteruskan ke freelancer',
        body: `Dana ${formatCurrency(freelancerNet)} masuk ke saldo freelancer. Biaya withdraw internal: ${formatCurrency(adminFeeWithdraw)}.`,
        eventType: completionStatus === 'AUTO_COMPLETED' ? 'AUTO_RELEASED' : 'SETTLEMENT_COMPLETED',
      },
    }),
    prisma.notification.create({
      data: {
        userId: project.freelancerId,
        type: 'PAYMENT',
        title: 'Dana masuk ke saldo',
        body: `Dana ${formatCurrency(freelancerNet)} telah masuk ke saldo kamu.`,
      },
    }),
  ]);

  return updatedProject;
};
