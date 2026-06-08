import { Bell, CheckCircle2, XCircle } from 'lucide-react';

interface SmoothToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function SmoothToast({ message, type = 'info', onClose }: SmoothToastProps) {
  if (!message) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? XCircle : Bell;

  return (
    <div className="fixed top-5 right-5 z-[110] animate-[toastIn_220ms_ease-out]">
      <div className="flex items-start gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-3 shadow-2xl max-w-sm">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          type === 'success'
            ? 'bg-[#22C55E]/15 text-[#22C55E]'
            : type === 'error'
              ? 'bg-[#EF4444]/15 text-[#EF4444]'
              : 'bg-[#F5C800]/15 text-[#F5C800]'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-white">MediaVault</div>
          <p className="text-sm text-[#888888]">{message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-[#888888] hover:text-white">
          x
        </button>
      </div>
    </div>
  );
}
