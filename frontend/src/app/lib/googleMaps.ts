export interface AddressParts {
  province?: string;
  city?: string;
  district?: string;
  village?: string;
  postalCode?: string;
  addressDetail?: string;
}

export interface AddressLookupResult {
  latitude: string;
  longitude: string;
  label: string;
  postalCode?: string;
  parts?: AddressParts;
  provider: 'google' | 'nominatim';
}

export interface AddressSuggestion {
  id: string;
  label: string;
  mainText?: string;
  secondaryText?: string;
  provider: 'google' | 'nominatim';
}

export interface DistanceResult {
  distanceKm: number;
  provider: 'google-directions' | 'osrm' | 'estimated';
}

declare global {
  interface Window {
    google?: any;
    __mediaVaultGoogleMapsPromise?: Promise<any>;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'mediavault-google-maps-js';
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export const hasGoogleMapsApiKey = () => Boolean(googleMapsApiKey);

const loadGoogleMaps = (): Promise<any> => {
  if (!googleMapsApiKey) return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY belum dikonfigurasi'));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (window.__mediaVaultGoogleMapsPromise) return window.__mediaVaultGoogleMapsPromise;

  window.__mediaVaultGoogleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google!));
      existingScript.addEventListener('error', () => reject(new Error('Gagal memuat Google Maps JavaScript API')));
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&libraries=places&v=weekly`;
    script.onload = () => resolve(window.google!);
    script.onerror = () => reject(new Error('Gagal memuat Google Maps JavaScript API'));
    document.head.appendChild(script);
  });

  return window.__mediaVaultGoogleMapsPromise;
};

const getAddressComponent = (
  components: Array<{ long_name: string; types: string[] }> = [],
  types: string[]
) => components.find((component) => types.some((type) => component.types.includes(type)))?.long_name || '';

const parseGoogleAddressParts = (components: Array<{ long_name: string; types: string[] }> = []): AddressParts => {
  const streetNumber = getAddressComponent(components, ['street_number']);
  const route = getAddressComponent(components, ['route']);
  const premise = getAddressComponent(components, ['premise', 'subpremise']);

  return {
    province: getAddressComponent(components, ['administrative_area_level_1']),
    city: getAddressComponent(components, ['administrative_area_level_2', 'locality']),
    district: getAddressComponent(components, ['administrative_area_level_3', 'sublocality_level_1', 'sublocality']),
    village: getAddressComponent(components, ['administrative_area_level_4', 'sublocality_level_2', 'neighborhood']),
    postalCode: getAddressComponent(components, ['postal_code']),
    addressDetail: [route, streetNumber, premise].filter(Boolean).join(' '),
  };
};

const parseNominatimAddressParts = (address: Record<string, string> = {}): AddressParts => ({
  province: address.state || '',
  city: address.city || address.town || address.county || address.municipality || address.city_district || '',
  district: address.suburb || address.city_district || address.municipality || address.district || '',
  village: address.village || address.neighbourhood || address.hamlet || address.suburb || '',
  postalCode: address.postcode || '',
  addressDetail: [address.road, address.house_number, address.building].filter(Boolean).join(' '),
});

const geocodeWithGoogle = async (query: string): Promise<AddressLookupResult | null> => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.maps.Geocoder();
  const results = await new Promise<any[]>((resolve, reject) => {
    geocoder.geocode({
      address: query,
      componentRestrictions: { country: 'ID' },
    }, (geocodeResults: any[] | null, status: string) => {
      if (status === 'OK') resolve(geocodeResults || []);
      else reject(new Error(`Google geocode gagal: ${status}`));
    });
  });
  const first = results[0];
  if (!first?.geometry?.location) return null;

  const parts = parseGoogleAddressParts(first.address_components);
  return {
    latitude: first.geometry.location.lat().toFixed(6),
    longitude: first.geometry.location.lng().toFixed(6),
    label: first.formatted_address,
    postalCode: parts.postalCode,
    parts,
    provider: 'google',
  };
};

const reverseWithGoogle = async (latitude: string, longitude: string): Promise<AddressLookupResult | null> => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.maps.Geocoder();
  const results = await new Promise<any[]>((resolve, reject) => {
    geocoder.geocode({
      location: { lat: Number(latitude), lng: Number(longitude) },
    }, (geocodeResults: any[] | null, status: string) => {
      if (status === 'OK') resolve(geocodeResults || []);
      else reject(new Error(`Google reverse geocode gagal: ${status}`));
    });
  });
  const first = results[0];
  if (!first) return null;

  const parts = parseGoogleAddressParts(first.address_components);
  return {
    latitude,
    longitude,
    label: first.formatted_address,
    postalCode: parts.postalCode,
    parts,
    provider: 'google',
  };
};

const searchSuggestionsWithGoogle = async (query: string): Promise<AddressSuggestion[]> => {
  const maps = await loadGoogleMaps();
  const service = new maps.maps.places.AutocompleteService();
  const predictions = await new Promise<any[]>((resolve, reject) => {
    service.getPlacePredictions({
      input: query,
      componentRestrictions: { country: 'id' },
      types: ['geocode'],
    }, (placePredictions: any[] | null, status: string) => {
      if (status === 'OK' || status === 'ZERO_RESULTS') resolve(placePredictions || []);
      else reject(new Error(`Google Places autocomplete gagal: ${status}`));
    });
  });

  return predictions.map((prediction) => ({
    id: prediction.place_id,
    label: prediction.description,
    mainText: prediction.structured_formatting?.main_text,
    secondaryText: prediction.structured_formatting?.secondary_text,
    provider: 'google',
  }));
};

const getPlaceWithGoogle = async (placeId: string): Promise<AddressLookupResult | null> => {
  const maps = await loadGoogleMaps();
  const geocoder = new maps.maps.Geocoder();
  const results = await new Promise<any[]>((resolve, reject) => {
    geocoder.geocode({ placeId }, (geocodeResults: any[] | null, status: string) => {
      if (status === 'OK') resolve(geocodeResults || []);
      else reject(new Error(`Google place geocode gagal: ${status}`));
    });
  });
  const first = results[0];
  if (!first?.geometry?.location) return null;

  const parts = parseGoogleAddressParts(first.address_components);
  return {
    latitude: first.geometry.location.lat().toFixed(6),
    longitude: first.geometry.location.lng().toFixed(6),
    label: first.formatted_address,
    postalCode: parts.postalCode,
    parts,
    provider: 'google',
  };
};

const getDistanceWithGoogle = async (
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
): Promise<DistanceResult | null> => {
  const maps = await loadGoogleMaps();
  const directionsService = new maps.maps.DirectionsService();
  const result = await new Promise<any>((resolve, reject) => {
    directionsService.route({
      origin: { lat: originLat, lng: originLon },
      destination: { lat: destinationLat, lng: destinationLon },
      travelMode: maps.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
    }, (directionsResult: any, status: string) => {
      if (status === 'OK') resolve(directionsResult);
      else reject(new Error(`Google Directions gagal: ${status}`));
    });
  });

  const distances = (result.routes || [])
    .map((route) => route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0))
    .filter((meters) => meters > 0);

  if (distances.length === 0) return null;

  return {
    distanceKm: Math.ceil(Math.min(...distances) / 1000),
    provider: 'google-directions',
  };
};

const fetchNominatim = async (url: string) => {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return null;
  return response.json();
};

const geocodeWithNominatim = async (query: string): Promise<AddressLookupResult | null> => {
  const payload = await fetchNominatim(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=id&accept-language=id&q=${encodeURIComponent(query)}`
  );
  const first = Array.isArray(payload) ? payload[0] : null;
  if (!first?.lat || !first?.lon) return null;
  const parts = parseNominatimAddressParts(first.address || {});

  return {
    latitude: Number(first.lat).toFixed(6),
    longitude: Number(first.lon).toFixed(6),
    label: first.display_name || query,
    postalCode: parts.postalCode,
    parts,
    provider: 'nominatim',
  };
};

const reverseWithNominatim = async (latitude: string, longitude: string): Promise<AddressLookupResult | null> => {
  const payload = await fetchNominatim(
    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
  );
  if (!payload) return null;
  const parts = parseNominatimAddressParts(payload.address || {});

  return {
    latitude,
    longitude,
    label: payload.display_name || `${latitude}, ${longitude}`,
    postalCode: parts.postalCode,
    parts,
    provider: 'nominatim',
  };
};

const searchSuggestionsWithNominatim = async (query: string): Promise<AddressSuggestion[]> => {
  const payload = await fetchNominatim(
    `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=id&accept-language=id&q=${encodeURIComponent(query)}`
  );

  return Array.isArray(payload)
    ? payload.filter((item) => item?.lat && item?.lon).map((item) => ({
      id: `${item.osm_type || 'osm'}-${item.osm_id || item.place_id}`,
      label: item.display_name || query,
      mainText: item.name || item.display_name,
      secondaryText: item.display_name,
      provider: 'nominatim' as const,
    }))
    : [];
};

const toRadians = (degree: number) => degree * (Math.PI / 180);

export const straightDistanceKm = (
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
) => {
  const radius = 6371;
  const deltaLat = toRadians(destinationLat - originLat);
  const deltaLon = toRadians(destinationLon - originLon);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(originLat)) * Math.cos(toRadians(destinationLat))
    * Math.sin(deltaLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const estimateRoadDistanceKm = (
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
) => Math.ceil(straightDistanceKm(originLat, originLon, destinationLat, destinationLon) * 1.25);

const getDistanceWithOsrm = async (
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
): Promise<DistanceResult | null> => {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${destinationLon},${destinationLat}?overview=false&alternatives=false&steps=false`,
    { headers: { Accept: 'application/json' } }
  );
  if (!response.ok) return null;
  const payload = await response.json();
  const meters = payload?.routes?.[0]?.distance;
  if (!Number.isFinite(Number(meters))) return null;
  return { distanceKm: Math.ceil(Number(meters) / 1000), provider: 'osrm' };
};

export const geocodeAddress = async (query: string): Promise<AddressLookupResult | null> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return null;
  if (googleMapsApiKey) {
    try {
      const result = await geocodeWithGoogle(normalizedQuery);
      if (result) return result;
    } catch {
      // Keep the ordering flow usable when Google quota/key is not ready.
    }
  }
  return geocodeWithNominatim(normalizedQuery);
};

export const reverseGeocodeCoordinates = async (latitude: string, longitude: string) => {
  if (!latitude || !longitude) return null;
  if (googleMapsApiKey) {
    try {
      const result = await reverseWithGoogle(latitude, longitude);
      if (result) return result;
    } catch {
      // Fallback below.
    }
  }
  return reverseWithNominatim(latitude, longitude);
};

export const searchAddressSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 3) return [];
  if (googleMapsApiKey) {
    try {
      const result = await searchSuggestionsWithGoogle(normalizedQuery);
      if (result.length > 0) return result;
    } catch {
      // Fallback below.
    }
  }
  return searchSuggestionsWithNominatim(normalizedQuery);
};

export const resolveAddressSuggestion = async (suggestion: AddressSuggestion) => {
  if (suggestion.provider === 'google' && googleMapsApiKey) {
    try {
      const result = await getPlaceWithGoogle(suggestion.id);
      if (result) return result;
    } catch {
      // Fallback below.
    }
  }
  return geocodeAddress(suggestion.label);
};

export const getDrivingDistanceKm = async (
  originLat: number,
  originLon: number,
  destinationLat: number,
  destinationLon: number
): Promise<DistanceResult> => {
  if (googleMapsApiKey) {
    try {
      const result = await getDistanceWithGoogle(originLat, originLon, destinationLat, destinationLon);
      if (result) return result;
    } catch {
      // Fallback below.
    }
  }

  try {
    const osrm = await getDistanceWithOsrm(originLat, originLon, destinationLat, destinationLon);
    if (osrm) return osrm;
  } catch {
    // Fallback below.
  }

  return {
    distanceKm: estimateRoadDistanceKm(originLat, originLon, destinationLat, destinationLon),
    provider: 'estimated',
  };
};
