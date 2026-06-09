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
  const normalized = String(status || '').trim().toUpperCase();
  if (['SUCCESS', 'SUCCEEDED', 'SUCCESSFUL', 'SETTLEMENT', 'SETTLED', 'PAID', 'PAYMENT_SUCCESS'].includes(normalized)) {
    return 'PAID';
  }
  if (['EXPIRED', 'EXPIRE'].includes(normalized)) return 'EXPIRED';
  if (['FAILED', 'FAIL', 'CANCELLED', 'CANCELED', 'ERROR'].includes(normalized)) return 'FAILED';
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

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');
const getKlikqrisData = (payload) => payload?.data || payload?.result || payload?.order || payload?.transaction || payload?.payment || payload || {};
const getKlikqrisStatus = (payload, data) => {
  const directStatus = firstValue(
    data.status,
    data.transaction_status,
    data.qris_status,
    data.payment_status,
    payload?.status,
    payload?.message
  );

  if (data.is_paid === true || payload?.is_paid === true || data.paid === true || payload?.paid === true) {
    return 'PAID';
  }

  return normalizeKlikqrisStatus(directStatus);
};
const getKlikqrisPaidAt = (data) => {
  const value = firstValue(data.paid_at, data.payment_date, data.paidAt, data.settlement_time, data.updated_at);
  return value ? new Date(value) : null;
};
const getKlikqrisExpiredAt = (data) => {
  const value = firstValue(data.expired_at, data.expires_at, data.expiredAt, data.valid_until);
  return value ? new Date(value) : null;
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
  const data = getKlikqrisData(payload);

  return {
    payload,
    orderId: firstValue(data.order_id, data.orderId, data.merchant_order_id, data.no_ref_merchant, orderId),
    amount: parseAmount(firstValue(data.amount, data.amount_value, data.jumlah_dibayar)),
    totalAmount: parseAmount(firstValue(data.total_amount, data.totalAmount, data.amount, data.jumlah_dibayar)),
    status: getKlikqrisStatus(payload, data),
    directUrl: firstValue(data.direct_url, data.redirect_url, data.payment_url, null),
    qrisUrl: firstValue(data.qris_url, data.qris_image, data.qrImage?.fileUrl, data.qrisUrl, null),
    expiredAt: getKlikqrisExpiredAt(data),
    signature: firstValue(data.signature, data.sign, data.token, data.transaction_id, data.id),
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
  const data = getKlikqrisData(payload);

  return {
    payload,
    orderId: firstValue(data.order_id, data.orderId, data.merchant_order_id, data.no_ref_merchant, orderId),
    status: getKlikqrisStatus(payload, data),
    totalAmount: parseAmount(firstValue(data.total_amount, data.totalAmount, data.amount, data.jumlah_dibayar)),
    paidAt: getKlikqrisPaidAt(data),
    expiredAt: getKlikqrisExpiredAt(data),
  };
};

module.exports = {
  createKlikqrisTransaction,
  checkKlikqrisStatus,
  normalizeKlikqrisStatus,
  parseAmount,
};
