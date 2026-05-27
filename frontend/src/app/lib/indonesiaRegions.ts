export interface RegionOption {
  id: string;
  name: string;
}

const REGION_API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export const normalizeRegionName = (value: string) => value
  .toLowerCase()
  .replace(/\b(kabupaten|kab\.|kota|city|regency|provinsi|province|administrative)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const findRegionByName = (options: RegionOption[], rawName: string) => {
  const normalized = normalizeRegionName(rawName);
  if (!normalized) return null;

  return options.find((option) => normalizeRegionName(option.name) === normalized)
    || options.find((option) => {
      const optionName = normalizeRegionName(option.name);
      return optionName.includes(normalized) || normalized.includes(optionName);
    })
    || null;
};

export const findExactRegionByName = (options: RegionOption[], rawName: string) => {
  const normalized = normalizeRegionName(rawName);
  return options.find((option) => normalizeRegionName(option.name) === normalized) || null;
};

export const fetchRegionOptions = async (path: string): Promise<RegionOption[]> => {
  const response = await fetch(`${REGION_API_BASE}${path}`);
  if (!response.ok) throw new Error('Gagal memuat data wilayah Indonesia');
  const payload = await response.json();
  return Array.isArray(payload)
    ? payload.map((item) => ({ id: String(item.id), name: String(item.name) }))
    : [];
};

export const getCurrentPosition = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});
