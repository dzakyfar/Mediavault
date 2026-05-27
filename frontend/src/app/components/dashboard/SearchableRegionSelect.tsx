import { useMemo, useState } from 'react';
import { normalizeRegionName, RegionOption } from '../../lib/indonesiaRegions';

interface SearchableRegionSelectProps {
  label: string;
  placeholder: string;
  value: string;
  options: RegionOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (option: RegionOption) => void;
}

export default function SearchableRegionSelect({
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
  onSelect,
}: SearchableRegionSelectProps) {
  const [open, setOpen] = useState(false);
  const filteredOptions = useMemo(() => {
    const keyword = normalizeRegionName(value);
    const result = keyword
      ? options.filter((option) => normalizeRegionName(option.name).includes(keyword))
      : options;
    return result.slice(0, 80);
  }, [options, value]);

  return (
    <div className="relative">
      <label className="block text-sm text-[#888888] mb-2">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all disabled:opacity-60"
      />
      {open && !disabled && (
        <div className="absolute z-30 mt-2 w-full max-h-72 overflow-y-auto rounded-lg border border-[#2A2A2A] bg-[#101010] shadow-xl">
          {filteredOptions.length === 0 && (
            <div className="px-4 py-3 text-sm text-[#888888]">
              Tidak ada hasil. Coba ejaan lain atau ketik manual lalu verifikasi alamat.
            </div>
          )}
          {filteredOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onSelect(option);
                setOpen(false);
              }}
              className="block w-full px-4 py-3 text-left text-sm text-white hover:bg-[#F5C800] hover:text-black transition-colors"
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
      {open && (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-transparent"
          aria-label={`Tutup pilihan ${label}`}
        />
      )}
    </div>
  );
}
