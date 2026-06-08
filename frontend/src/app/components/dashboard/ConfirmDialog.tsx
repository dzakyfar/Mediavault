import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  danger = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return createPortal((
    <div className="fixed inset-y-0 left-0 right-0 z-[100] flex items-center justify-center px-4 md:left-60">
      <button
        type="button"
        aria-label={t('Tutup dialog', 'Close dialog')}
        onClick={onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 shadow-2xl">
        <h2 className={`text-3xl mb-3 ${danger ? 'text-[#EF4444]' : 'text-white'}`} style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          {title}
        </h2>
        <p className="text-[#888888] mb-6">{description}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] transition-colors"
          >
            {cancelLabel || t('Batal', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 font-bold rounded-lg transition-colors ${
              danger
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                : 'bg-[#F5C800] text-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
