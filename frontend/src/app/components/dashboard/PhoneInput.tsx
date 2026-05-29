interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Normalise raw input → always stored as +62xxxxxxxxx
const toE164 = (raw: string): string => {
  // Strip everything except digits and leading +
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  // 08xx → +628xx
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  // 628xx → +628xx
  if (digits.startsWith('62')) return `+${digits}`;
  // already stripped local number
  return `+62${digits}`;
};

// Display value: strip +62 prefix so user sees local number
const toDisplay = (stored: string): string => {
  if (!stored) return '';
  if (stored.startsWith('+62')) return stored.slice(3);
  if (stored.startsWith('62')) return stored.slice(2);
  if (stored.startsWith('0')) return stored.slice(1);
  return stored;
};

export default function PhoneInput({
  value,
  onChange,
  error,
  placeholder = '812 3456 7890',
  className = '',
  disabled = false,
}: PhoneInputProps) {
  const displayValue = toDisplay(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    onChange(raw ? `+62${raw}` : '');
  };

  return (
    <div className="w-full">
      <div
        className={`flex items-center bg-[#1A1A1A] border ${
          error ? 'border-[#EF4444]' : 'border-[#2A2A2A]'
        } rounded-lg overflow-hidden focus-within:border-[#F5C800] focus-within:ring-2 focus-within:ring-[#F5C800]/20 transition-all ${className}`}
      >
        {/* Flag + prefix */}
        <div className="flex items-center gap-1.5 px-3 py-3 border-r border-[#2A2A2A] shrink-0 select-none">
          <span className="text-lg leading-none">🇮🇩</span>
          <span className="text-white text-sm font-medium">+62</span>
        </div>

        {/* Input */}
        <input
          type="tel"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-3 text-white placeholder-[#888888] focus:outline-none disabled:opacity-60"
        />
      </div>
      {error && <p className="text-[#EF4444] text-sm mt-1">{error}</p>}
    </div>
  );
}
