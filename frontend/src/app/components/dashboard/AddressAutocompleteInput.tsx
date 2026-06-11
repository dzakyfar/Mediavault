import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, X } from 'lucide-react';
import { searchAddressSuggestions, resolveAddressSuggestion, type AddressSuggestion, type AddressLookupResult } from '../../lib/googleMaps';

interface AddressAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onResolved?: (result: AddressLookupResult) => void;
  /** Additional context like selected province/city/district to improve search accuracy */
  regionContext?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onResolved,
  regionContext = '',
  placeholder = 'Ketik alamat lengkap...',
  label,
  disabled = false,
  className = '',
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const skipSearchRef = useRef(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // Combine typed text with region context for better results (like Shopee/Google Maps)
    const searchQuery = regionContext.trim()
      ? `${query.trim()}, ${regionContext.trim()}`
      : query.trim();

    setLoading(true);
    try {
      const results = await searchAddressSuggestions(searchQuery);
      setSuggestions(results);
      setShowDropdown(results.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [regionContext]);

  const handleInputChange = (newValue: string) => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      onChange(newValue);
      return;
    }

    onChange(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 350);
  };

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    skipSearchRef.current = true;
    onChange(suggestion.label);
    setShowDropdown(false);
    setSuggestions([]);
    setResolving(true);

    try {
      const result = await resolveAddressSuggestion(suggestion);
      if (result && onResolved) {
        onResolved(result);
      }
    } catch {
      // Address text remains; user can still edit manually.
    } finally {
      setResolving(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm text-[#888888] mb-2">{label}</label>
      )}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setShowDropdown(true);
            else if (value.trim().length >= 3) fetchSuggestions(value);
          }}
          placeholder={placeholder}
          rows={3}
          disabled={disabled}
          className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 pr-20 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all resize-none"
        />
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {resolving && (
            <Loader2 className="w-4 h-4 text-[#F5C800] animate-spin" />
          )}
          {loading && !resolving && (
            <Loader2 className="w-4 h-4 text-[#888888] animate-spin" />
          )}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-[#888888] hover:text-white transition-colors"
              aria-label="Clear address"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl max-h-64 overflow-y-auto overscroll-contain">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-[#2A2A2A] active:bg-[#F5C800] active:text-black transition-colors border-b border-[#2A2A2A] last:border-b-0 flex items-start gap-3"
            >
              <MapPin className="w-4 h-4 text-[#F5C800] mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {suggestion.mainText || suggestion.label.split(',')[0]}
                </div>
                {suggestion.secondaryText && suggestion.secondaryText !== suggestion.mainText && (
                  <div className="text-[#888888] text-xs truncate mt-0.5">
                    {suggestion.secondaryText}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results hint */}
      {showDropdown && suggestions.length === 0 && !loading && value.trim().length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1E1E1E] border border-[#2A2A2A] rounded-lg shadow-2xl px-4 py-3 text-[#888888] text-sm">
          Tidak ada saran ditemukan. Ketik alamat manual lalu pilih wilayah di bawah.
        </div>
      )}
    </div>
  );
}
