const KLIKQRIS_BASE_URL = process.env.KLIKQRIS_BASE_URL || 'https://klikqris.com/api/qrisv2';

const parseAmount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
};

const normalizeKlikqrisStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'SUCCESS' || normalized === 'PAID') return 'PAID';
  if (normalized === 'EXPIRED') return 'EXPIRED';
  if (normalized === 'FAILED') return 'FAILED';
  return 'PENDING';
};

const requireCredentials = () => {
  if (!process.env.KLIKQRIS_API_KEY || !process.env.KLIKQRIS_MERCHANT_ID) {
    throw new Error('Kredensial KlikQRIS belum dikonfigurasi di environment backend');
  }
};

const klikqrisHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-key': process.env.KLIKQRIS_API_KEY,
  id_merchant: process.env.KLIKQRIS_MERCHANT_ID,
});

const readKlikqrisResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === false) {
    const message = payload?.message || `KlikQRIS request gagal (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const createKlikqrisTransaction = async ({ orderId, amount, description }) => {
  requireCredentials();

  const response = await fetch(`${KLIKQRIS_BASE_URL}/create`, {
    method: 'POST',
    headers: klikqrisHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      id_merchant: process.env.KLIKQRIS_MERCHANT_ID,
      amount,
      keterangan: description,
    }),
  });
  const payload = await readKlikqrisResponse(response);
  const data = payload.data || {};

  return {
    payload,
    orderId: data.order_id || orderId,
    amount: parseAmount(data.amount),
    totalAmount: parseAmount(data.total_amount),
    status: normalizeKlikqrisStatus(data.status),
    directUrl: data.direct_url || null,
    qrisUrl: data.qris_url || null,
    expiredAt: data.expired_at ? new Date(data.expired_at) : null,
    signature: data.signature,
  };
};

const checkKlikqrisStatus = async (orderId) => {
  requireCredentials();

  const response = await fetch(
    `${KLIKQRIS_BASE_URL}/status/${process.env.KLIKQRIS_MERCHANT_ID}/${encodeURIComponent(orderId)}`,
    {
      method: 'GET',
      headers: klikqrisHeaders(),
    }
  );
  const payload = await readKlikqrisResponse(response);
  const data = payload.data || {};

  return {
    payload,
    orderId: data.order_id || orderId,
    status: normalizeKlikqrisStatus(data.status),
    totalAmount: parseAmount(data.total_amount),
    paidAt: data.paid_at ? new Date(data.paid_at) : null,
    expiredAt: data.expired_at ? new Date(data.expired_at) : null,
  };
};

module.exports = {
  createKlikqrisTransaction,
  checkKlikqrisStatus,
  normalizeKlikqrisStatus,
  parseAmount,
};
