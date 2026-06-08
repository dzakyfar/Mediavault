const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, '');

const getKlikqrisConfig = () => {
  const baseUrl = normalizeBaseUrl(process.env.KLIKQRIS_BASE_URL || 'https://klikqris.com/api/qrisv2');
  const explicitMode = String(process.env.KLIKQRIS_MODE || '').toLowerCase();
  const isSandbox = explicitMode === 'sandbox' || /\/sandbox(?:\/|$)/.test(baseUrl);

  return {
    apiKey: process.env.KLIKQRIS_API_KEY || process.env.API_KEY_ADMIN,
    merchantId: process.env.KLIKQRIS_MERCHANT_ID || process.env.ID_MERCHANT_ADMIN,
    baseUrl,
    isSandbox,
  };
};

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
  const { apiKey, merchantId } = getKlikqrisConfig();
  if (!apiKey || !merchantId) {
    throw new Error('Kredensial KlikQRIS belum dikonfigurasi di environment backend');
  }
};

const klikqrisHeaders = () => {
  const { apiKey, merchantId } = getKlikqrisConfig();

  return {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    id_merchant: merchantId,
  };
};

const readKlikqrisResponse = async (response) => {
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.status === false) {
    const validationDetail = payload?.errors
      ? Object.values(payload.errors).flat().join(' ')
      : payload?.error || '';
    const message = [payload?.message || `KlikQRIS request gagal (${response.status})`, validationDetail]
      .filter(Boolean)
      .join(': ');
    throw new Error(message);
  }

  return payload;
};

// URL builder: langsung append /create dan /status ke baseUrl.
// Tidak ada tebak-tebakan — pastikan KLIKQRIS_BASE_URL sudah menunjuk ke
// endpoint yang benar (misal https://klikqris.com/api/sandbox/qris atau
// https://klikqris.com/api/qrisv2).
const buildCreateUrl = ({ baseUrl }) => `${baseUrl}/create`;

const buildStatusUrl = ({ baseUrl, isSandbox, merchantId, orderId }) => {
  // Sandbox biasanya tidak butuh merchantId di path
  if (isSandbox) return `${baseUrl}/status/${encodeURIComponent(orderId)}`;
  return `${baseUrl}/status/${merchantId}/${encodeURIComponent(orderId)}`;
};

const createKlikqrisTransaction = async ({ orderId, amount, description }) => {
  requireCredentials();
  const config = getKlikqrisConfig();
  const { merchantId } = config;

  const createUrl = buildCreateUrl(config);
  console.log(`[KlikQRIS] POST ${createUrl} | mode=${config.isSandbox ? 'sandbox' : 'production'} | orderId=${orderId}`);

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: klikqrisHeaders(),
    body: JSON.stringify({
      order_id: orderId,
      id_merchant: merchantId,
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
    directUrl: data.direct_url || data.redirect_url || null,
    qrisUrl: data.qris_url || (data.qris_image ? data.qris_image : null),
    expiredAt: data.expired_at ? new Date(data.expired_at) : null,
    signature: data.signature,
  };
};

const checkKlikqrisStatus = async (orderId) => {
  requireCredentials();
  const config = getKlikqrisConfig();

  const statusUrl = buildStatusUrl({ ...config, orderId });
  console.log(`[KlikQRIS] GET ${statusUrl} | mode=${config.isSandbox ? 'sandbox' : 'production'}`);

  const response = await fetch(statusUrl, {
    method: 'GET',
    headers: klikqrisHeaders(),
  });
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
