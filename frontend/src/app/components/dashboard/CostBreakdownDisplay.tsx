import { useLanguage } from '../../context/LanguageContext';

interface CostBreakdown {
  serviceFee: number;
  extraPersonFee: number;
  transportFee: number;
  distanceKm: number;
  distanceSource: string;
  transportRatePerKm: number;
  rentalHours: number;
  adminFee: number;
  total: number;
}

interface CostBreakdownDisplayProps {
  data: CostBreakdown | string;
  createdAt?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function CostBreakdownDisplay({ data, createdAt }: CostBreakdownDisplayProps) {
  const { t } = useLanguage();

  let breakdown: CostBreakdown;
  try {
    breakdown = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return <p className="text-[#888888]">{t('Data breakdown biaya tidak valid', 'Invalid cost breakdown data')}</p>;
  }

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[#888888]">{t('Biaya Jasa', 'Service Fee')} ({breakdown.rentalHours} {t('jam', 'hours')})</div>
        <div className="font-bold text-white">{formatCurrency(breakdown.serviceFee)}</div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[#888888]">{t('Biaya Orang Tambahan', 'Additional Person Fee')}</div>
        <div className="font-bold text-white">{formatCurrency(breakdown.extraPersonFee)}</div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[#888888]">
          {t('Transportasi', 'Transport')} ({breakdown.distanceKm} km x {formatCurrency(breakdown.transportRatePerKm)}/km)
        </div>
        <div className="font-bold text-white">{formatCurrency(breakdown.transportFee)}</div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-[#888888]">{t('Admin MediaVault 1%', 'MediaVault Admin 1%')}</div>
        <div className="font-bold text-white">{formatCurrency(breakdown.adminFee)}</div>
      </div>
      <div className="h-px bg-[#2A2A2A]" />
      <div className="flex items-center justify-between gap-4">
        <div className="font-bold text-white">{t('Total', 'Total')}</div>
        <div className="text-lg font-bold text-[#F5C800]">{formatCurrency(breakdown.total)}</div>
      </div>
      {createdAt && (
        <div className="pt-2 text-xs text-[#888888]">
          {t('Sumber jarak:', 'Distance source:')} {breakdown.distanceSource} • {createdAt}
        </div>
      )}
    </div>
  );
}
