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

const fallbackPostalCodes: Record<string, string> = {
  surabaya: '60271',
  malang: '65111',
  sidoarjo: '61212',
  gresik: '61111',
  bandung: '40111',
  jakarta: '10110',
  'jakarta selatan': '12110',
  'jakarta pusat': '10110',
  'jakarta barat': '11110',
  'jakarta timur': '13110',
  'jakarta utara': '14110',
  yogyakarta: '55211',
  semarang: '50111',
  denpasar: '80227',
  badung: '80351',
  bogor: '16111',
  depok: '16431',
  bekasi: '17111',
  tangerang: '15111',
  medan: '20111',
  makassar: '90111',
};

export const fallbackPostalCodeForCity = (cityName: string) => {
  const normalized = normalizeRegionName(cityName);
  return fallbackPostalCodes[normalized]
    || Object.entries(fallbackPostalCodes).find(([city]) => normalized.includes(city) || city.includes(normalized))?.[1]
    || '';
};

export interface GeocodeAddressResult {
  latitude: string;
  longitude: string;
  postalCode: string;
  displayName: string;
}

export const geocodeIndonesianAddress = async (query: string): Promise<GeocodeAddressResult | null> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=id&accept-language=id&q=${encodeURIComponent(normalizedQuery)}`,
    { headers: { Accept: 'application/json' } }
  );

  if (!response.ok) return null;

  const payload = await response.json();
  const first = Array.isArray(payload) ? payload[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return {
    latitude: Number(first.lat).toFixed(6),
    longitude: Number(first.lon).toFixed(6),
    postalCode: first.address?.postcode || '',
    displayName: first.display_name || normalizedQuery,
  };
};
