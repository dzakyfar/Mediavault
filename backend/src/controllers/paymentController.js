const prisma = require('../config/prisma');
const { calculateClientCharge, calculateFreelancerNet } = require('../utils/paymentMath');
const { formatCurrency } = require('../utils/formatters');
const { creditWallet, debitWallet } = require('../services/walletService');
const {
  checkKlikqrisStatus,
  createKlikqrisTransaction,
  normalizeKlikqrisStatus,
  parseAmount,
} = require('../services/klikqrisService');
const { notifyTelegramOnly, notifyUser } = require('../services/notificationService');

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
const firstPayloadValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const getWebhookData = (body = {}) => body.data || body.result || body.order || body.transaction || body.payment || body || {};
const getWebhookOrderId = (data = {}) => firstPayloadValue(
  data.order_id,
  data.orderId,
  data.merchant_order_id,
  data.no_ref_merchant,
  data.reference_id,
  data.invoice_id
);
const getWebhookAmount = (data = {}) => parseAmount(firstPayloadValue(
  data.amount_paid,
  data.total_amount,
  data.totalAmount,
  data.amount,
  data.jumlah_dibayar,
  data.paid_amount
));
const getWebhookPaidAt = (data = {}) => parseGatewayDate(firstPayloadValue(
  data.payment_date,
  data.paid_at,
  data.paidAt,
  data.settlement_time,
  data.updated_at
));
const invoiceNumber = (payment) => {
  const date = payment.createdAt || new Date();
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const suffix = String(payment.klikqrisOrderId || payment.id).replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  return `MVT-${ymd}-${suffix || '0000'}`;
};
const isSandboxKlikqris = () => (
  String(process.env.KLIKQRIS_MODE || '').toLowerCase() === 'sandbox'
  || /\/sandbox(?:\/|$)/.test(process.env.KLIKQRIS_BASE_URL || '')
);
const minimumGatewayAmount = () => {
  const configured = Number(process.env.KLIKQRIS_MIN_AMOUNT);
  if (Number.isFinite(configured) && configured >= 1) return Math.round(configured);
  return isSandboxKlikqris() ? 500 : 1;
};

const serializePayment = (payment) => ({
  id: payment.id,
  projectId: payment.projectId,
  klikqrisOrderId: payment.klikqrisOrderId,
  amountRequest: payment.amountRequest,
  amountRequestFormatted: formatCurrency(payment.amountRequest),
  gatewayAdjustment: Math.max(0, (payment.totalAmount || 0) - (payment.amountRequest || 0)),
  gatewayAdjustmentFormatted: formatCurrency(Math.max(0, (payment.totalAmount || 0) - (payment.amountRequest || 0))),
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
  invoiceNumber: invoiceNumber(payment),
  signature: isSandboxKlikqris() ? payment.signature : undefined,
  isSandbox: isSandboxKlikqris(),
  status: payment.status,
  expiredAt: payment.expiredAt,
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
  project: payment.project ? {
    id: payment.project.id,
    title: payment.project.title,
    description: payment.project.description,
    serviceType: payment.project.serviceType,
    address: payment.project.address,
    addressDetail: payment.project.addressDetail,
    province: payment.project.province,
    city: payment.project.city,
    district: payment.project.district,
    village: payment.project.village,
    postalCode: payment.project.postalCode,
    eventDate: payment.project.eventDate,
    deadline: payment.project.deadline,
    status: payment.project.status,
    client: payment.project.client?.fullName || null,
    freelancer: payment.project.freelancer?.fullName || null,
  } : null,
});

const assertPaymentAccess = (payment, user) => {
  if (!payment || !payment.project) return false;
  return payment.project.clientId === user.id || payment.project.freelancerId === user.id || user.role === 'ADMIN';
};

const syncPendingPaymentFromGateway = async (payment) => {
  if (!payment || payment.status !== 'PENDING') return payment;

  const statusResult = await checkKlikqrisStatus(payment.klikqrisOrderId);

  if (statusResult.status === 'PAID') {
    return processSuccessfulPayment(
      payment.id,
      statusResult.totalAmount || payment.totalAmount,
      statusResult.paidAt || new Date(),
      statusResult.payload
    );
  }

  if (statusResult.status === 'EXPIRED') {
    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'EXPIRED',
        expiredAt: statusResult.expiredAt || payment.expiredAt,
        gatewayResponse: statusResult.payload,
      },
      include: paymentInclude,
    });
  }

  if (statusResult.status === 'FAILED') {
    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        gatewayResponse: statusResult.payload,
      },
      include: paymentInclude,
    });
  }

  return prisma.payment.update({
    where: { id: payment.id },
    data: { gatewayResponse: statusResult.payload },
    include: paymentInclude,
  });
};

const processSuccessfulPayment = async (paymentId, amountPaid, paidAt = new Date(), gatewayResponse = null) => {
  const { payment: result, shouldNotify } = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: paymentInclude,
    });

    if (!payment) {
      throw new Error('Payment tidak ditemukan');
    }

    if (payment.status === 'PAID') {
      return { payment, shouldNotify: false };
    }

    const paidAmount = amountPaid || payment.totalAmount;
    const paymentClaim = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: { not: 'PAID' },
      },
      data: {
        status: 'PAID',
        amountPaid: paidAmount,
        paidAt,
        gatewayResponse: gatewayResponse || payment.gatewayResponse,
      },
    });

    if (!paymentClaim.count) {
      const currentPayment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: paymentInclude,
      });
      return { payment: currentPayment || payment, shouldNotify: false };
    }

    const nextProjectStatus = ['WAITING_PAYMENT', 'OPEN', 'IN_PROGRESS', 'CONFIRMED'].includes(payment.project.status)
      ? 'PAID'
      : payment.project.status;

    await Promise.all([
      tx.project.update({
        where: { id: payment.projectId },
        data: {
          status: nextProjectStatus,
          progress: Math.max(payment.project.progress, 30),
        },
      }),
      tx.invoice.updateMany({
        where: { projectId: payment.projectId, status: 'PENDING' },
        data: { status: 'PAID' },
      }),
      // Catat fee admin dari client ke kas platform
      tx.platformRevenue.create({
        data: {
          amount: payment.adminFeeClient,
          sourceType: 'CLIENT_FEE',
          referenceType: 'PROJECT',
          referenceId: payment.projectId,
          description: `Fee admin 1% dari client untuk project ${payment.projectId}. Total dibayar: ${formatCurrency(paidAmount)}.`,
        },
      }),
      tx.projectHistory.create({
        data: {
          projectId: payment.projectId,
          actorId: payment.project.clientId,
          title: 'Pembayaran diterima',
          body: `Pembayaran ${formatCurrency(paidAmount)} berhasil diterima via KlikQRIS. Dana dicatat sebagai escrow internal.`,
          eventType: 'PAYMENT_PAID',
        },
      }),
    ]);

    await notifyUser({
      tx,
      userId: payment.project.clientId,
      type: 'PAYMENT',
      title: 'Pembayaran berhasil',
      body: 'Pembayaran berhasil! Order dikirim ke freelancer untuk diterima.',
      actionPath: `/dashboard/client/projects/${payment.projectId}`,
      sendTelegram: false,
    });

    if (payment.project.freelancerId) {
      await notifyUser({
        tx,
        userId: payment.project.freelancerId,
        type: 'PAYMENT',
        title: 'Order baru sudah dibayar',
        body: 'Client sudah membayar. Terima order di halaman My Projects untuk mulai bekerja, atau tolak agar dana dikembalikan ke saldo client.',
        actionPath: `/dashboard/freelancer/projects/${payment.projectId}`,
        sendTelegram: false,
      });
    } else {
      await tx.projectHistory.create({
        data: {
          projectId: payment.projectId,
          actorId: payment.project.clientId,
          title: 'Pembayaran tanpa freelancer aktif',
          body: 'Payment berhasil, tetapi project belum memiliki freelancer.',
          eventType: 'PAYMENT_PAID_WITHOUT_FREELANCER',
        },
      });
    }

    const updatedPayment = await tx.payment.findUnique({
      where: { id: payment.id },
      include: paymentInclude,
    });

    return { payment: updatedPayment, shouldNotify: true };
  });

  if (shouldNotify) {
    await Promise.all([
      notifyTelegramOnly({
        userId: result.project.clientId,
        title: 'Pembayaran berhasil',
        body: `Pembayaran untuk project ${result.project.title} berhasil. Order dikirim ke freelancer untuk diterima.`,
        actionPath: `/dashboard/client/payments/${result.id}`,
      }),
      result.project.freelancerId ? notifyTelegramOnly({
        userId: result.project.freelancerId,
        title: 'Order baru sudah dibayar',
        body: `Client sudah membayar project ${result.project.title}. Terima order di halaman My Projects untuk mulai bekerja.`,
        actionPath: `/dashboard/freelancer/projects/${result.projectId}`,
      }) : Promise.resolve(false),
    ]);
  }

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

    if (!project.budget || project.budget < 1) {
      res.status(400);
      throw new Error('Budget minimal Rp 1 untuk pembayaran QRIS sandbox');
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
    const gatewayAmountRequest = Math.max(amountRequest, minimumGatewayAmount());
    const klikqrisOrderId = generateOrderId();
    const description = `Pembayaran ${project.title} - ${project.freelancer.fullName}`;
    const transaction = await createKlikqrisTransaction({
      orderId: klikqrisOrderId,
      amount: gatewayAmountRequest,
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
          amountRequest: gatewayAmountRequest,
          baseAmount,
          adminFeeClient,
          totalAmount: transaction.totalAmount || gatewayAmountRequest,
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
          amount: transaction.totalAmount || gatewayAmountRequest,
          status: 'PENDING',
        },
      }),
      prisma.projectHistory.create({
        data: {
          projectId,
          actorId: req.user.id,
          title: 'QRIS pembayaran dibuat',
          body: `Tagihan KlikQRIS ${formatCurrency(transaction.totalAmount || gatewayAmountRequest)} dibuat dan menunggu pembayaran client.`,
          eventType: 'PAYMENT_CREATED',
        },
      }),
    ]);

    res.status(201).json({ payment: serializePayment(payment) });
  } catch (error) {
    next(error);
  }
};

exports.payProjectWithWallet = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, clientId: req.user.id },
      include: {
        freelancer: { select: { fullName: true } },
        payments: {
          where: { status: 'PAID' },
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
      throw new Error('Pilih freelancer terlebih dahulu sebelum membayar');
    }

    if (!project.budget || project.budget < 1) {
      res.status(400);
      throw new Error('Budget project tidak valid');
    }

    if (project.payments.length || ['PAID', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED', 'AUTO_COMPLETED'].includes(project.status)) {
      res.status(400);
      throw new Error('Project ini sudah dibayar atau sedang berjalan');
    }

    const { baseAmount, adminFeeClient, amountRequest } = calculateClientCharge(project.budget);
    const klikqrisOrderId = `WALLET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const payment = await prisma.$transaction(async (tx) => {
      await debitWallet(
        tx,
        req.user.id,
        amountRequest,
        `Pembayaran saldo untuk ${project.title}. Dana masuk escrow MediaVault.`,
        'PROJECT',
        projectId
      );

      const createdPayment = await tx.payment.create({
        data: {
          projectId,
          klikqrisOrderId,
          amountRequest,
          amountPaid: amountRequest,
          baseAmount,
          adminFeeClient,
          totalAmount: amountRequest,
          signature: `WALLET-${klikqrisOrderId}`,
          status: 'PAID',
          paidAt: new Date(),
          gatewayResponse: { mode: 'wallet' },
        },
        include: paymentInclude,
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          status: 'PAID',
          progress: Math.max(project.progress, 30),
        },
      });

      await tx.invoice.create({
        data: {
          projectId,
          number: klikqrisOrderId,
          amount: amountRequest,
          status: 'PAID',
        },
      });

      await tx.projectHistory.create({
        data: {
          projectId,
          actorId: req.user.id,
          title: 'Pembayaran saldo berhasil',
          body: `Client membayar ${formatCurrency(amountRequest)} memakai saldo MediaVault. Dana ditahan di escrow internal.`,
          eventType: 'WALLET_PAYMENT_PAID',
        },
      });

      await tx.notification.create({
        data: {
          userId: project.freelancerId,
          type: 'PAYMENT',
          title: 'Order baru sudah dibayar',
          body: 'Client membayar memakai saldo MediaVault. Terima order di halaman My Projects untuk mulai bekerja.',
        },
      });

      return createdPayment;
    });

    await notifyTelegramOnly({
      userId: payment.project.freelancerId,
      title: 'Order baru sudah dibayar',
      body: `Client membayar project ${payment.project.title} memakai saldo MediaVault. Terima order di halaman My Projects untuk mulai bekerja.`,
      actionPath: `/dashboard/freelancer/projects/${payment.projectId}`,
    });

    res.status(201).json({ payment: serializePayment(payment) });
  } catch (error) {
    next(error);
  }
};

exports.getProjectPayment = async (req, res, next) => {
  try {
    let payment = await prisma.payment.findFirst({
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

    payment = await syncPendingPaymentFromGateway(payment);

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

exports.getPaymentDetail = async (req, res, next) => {
  try {
    let payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        project: {
          include: {
            client: { select: { fullName: true } },
            freelancer: { select: { fullName: true } },
            histories: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            submissions: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!assertPaymentAccess(payment, req.user)) {
      res.status(404);
      throw new Error('Invoice tidak ditemukan');
    }

    if (payment.status === 'PENDING') {
      await syncPendingPaymentFromGateway(payment);
      payment = await prisma.payment.findUnique({
        where: { id: req.params.paymentId },
        include: {
          project: {
            include: {
              client: { select: { fullName: true } },
              freelancer: { select: { fullName: true } },
              histories: {
                orderBy: { createdAt: 'desc' },
                take: 20,
              },
              submissions: {
                orderBy: { createdAt: 'desc' },
                take: 10,
              },
            },
          },
        },
      });
    }

    res.json({
      payment: serializePayment(payment),
      timeline: payment.project.histories.map((history) => ({
        id: history.id,
        title: history.title,
        body: history.body,
        eventType: history.eventType,
        createdAt: history.createdAt,
      })),
      submissions: payment.project.submissions.map((submission) => ({
        id: submission.id,
        comment: submission.comment,
        fileUrl: submission.fileUrl,
        fileName: submission.fileName,
        status: submission.status,
        createdAt: submission.createdAt,
      })),
    });
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

    const nextPayment = await syncPendingPaymentFromGateway(payment);

    res.json({ payment: serializePayment(nextPayment) });
  } catch (error) {
    next(error);
  }
};

exports.handleKlikqrisWebhook = async (req, res, next) => {
  try {
    const data = getWebhookData(req.body);
    const klikqrisOrderId = getWebhookOrderId(data);

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

    const normalizedStatus = normalizeKlikqrisStatus(firstPayloadValue(
      data.status,
      data.transaction_status,
      data.qris_status,
      data.payment_status,
      req.body?.status,
      req.body?.message
    ));
    const signature = firstPayloadValue(
      data.signature,
      data.sign,
      req.headers['x-signature'],
      req.headers['x-callback-signature'],
      req.headers['x-webhook-signature']
    );
    const signatureValid = signature && payment.signature && signature === payment.signature;

    if (normalizedStatus === 'PAID') {
      if (!signatureValid) {
        const verifiedPayment = await syncPendingPaymentFromGateway(payment);
        if (verifiedPayment.status === 'PAID') {
          res.json({ message: 'OK' });
          return;
        }

        res.status(403);
        throw new Error('Signature webhook KlikQRIS tidak valid dan status gateway belum PAID');
      }

      await processSuccessfulPayment(
        payment.id,
        getWebhookAmount(data) || payment.totalAmount,
        getWebhookPaidAt(data) || new Date(),
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
  const updatedProject = await prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
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

    const projectClaim = await tx.project.updateMany({
      where: {
        id: projectId,
        status: { notIn: ['COMPLETED', 'AUTO_COMPLETED'] },
      },
      data: {
        status: completionStatus,
        progress: 100,
        completedAt: new Date(),
      },
    });

    if (!projectClaim.count) {
      return null;
    }

    const { adminFeeWithdraw, freelancerNet } = calculateFreelancerNet(payment.baseAmount);

    await creditWallet(
      tx,
      project.freelancerId,
      freelancerNet,
      `Dana project ${project.title} cair ke saldo freelancer.`,
      'PROJECT',
      projectId
    );

    // Catat fee admin dari freelancer ke kas platform
    await tx.platformRevenue.create({
      data: {
        amount: adminFeeWithdraw,
        sourceType: 'FREELANCER_FEE',
        referenceType: 'PROJECT',
        referenceId: projectId,
        description: `Fee admin 1% dari freelancer untuk project ${projectId}. Dana cair: ${formatCurrency(freelancerNet)}.`,
      },
    });

    await tx.projectHistory.create({
      data: {
        projectId,
        actorId,
        title: completionStatus === 'AUTO_COMPLETED' ? 'Dana auto-release' : 'Dana diteruskan ke freelancer',
        body: `Dana ${formatCurrency(freelancerNet)} masuk ke saldo freelancer. Biaya withdraw internal: ${formatCurrency(adminFeeWithdraw)}.`,
        eventType: completionStatus === 'AUTO_COMPLETED' ? 'AUTO_RELEASED' : 'SETTLEMENT_COMPLETED',
      },
    });

    await notifyUser({
      tx,
      userId: project.freelancerId,
      type: 'PAYMENT',
      title: 'Dana masuk ke saldo',
      body: `Dana ${formatCurrency(freelancerNet)} telah masuk ke saldo kamu.`,
      actionPath: '/dashboard/freelancer/earnings',
    });

    return tx.project.findUnique({
      where: { id: projectId },
      include: paymentInclude.project.include,
    });
  });

  return updatedProject;
};
