import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, FileUp, MapPin, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DraggableLocationMap from '../components/dashboard/DraggableLocationMap';
import { apiRequest } from '../lib/api';
import { getServicesForCategory, serviceCatalog } from '../lib/serviceCatalog';
import { formatBytes, REFERENCE_FILE_MAX_BYTES, S3_TOTAL_LIMIT_BYTES, validateReferenceFile } from '../lib/uploadLimits';
import { uploadFileToS3 } from '../lib/s3Upload';
import { useLanguage } from '../context/LanguageContext';

interface ReferenceFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

interface RegionOption {
  id: string;
  name: string;
}

const REGION_API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

const normalizeRegionName = (value: string) => value
  .toLowerCase()
  .replace(/\b(kabupaten|kab\.|kota|city|regency|provinsi|province|administrative)\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const findRegionByName = (options: RegionOption[], rawName: string) => {
  const normalized = normalizeRegionName(rawName);
  if (!normalized) return null;

  return options.find((option) => normalizeRegionName(option.name) === normalized)
    || options.find((option) => {
      const optionName = normalizeRegionName(option.name);
      return optionName.includes(normalized) || normalized.includes(optionName);
    })
    || null;
};

const findExactRegionByName = (options: RegionOption[], rawName: string) => {
  const normalized = normalizeRegionName(rawName);
  return options.find((option) => normalizeRegionName(option.name) === normalized) || null;
};

const fetchRegionOptions = async (path: string): Promise<RegionOption[]> => {
  const response = await fetch(`${REGION_API_BASE}${path}`);
  if (!response.ok) throw new Error('Failed to load Indonesian region data');
  const payload = await response.json();
  return Array.isArray(payload)
    ? payload.map((item) => ({ id: String(item.id), name: String(item.name) }))
    : [];
};

const getCurrentPosition = (options: PositionOptions) => new Promise<GeolocationPosition>((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, options);
});

const TITLE_MAX_LENGTH = 64;
const DESCRIPTION_MAX_LENGTH = 1000;
const countCharacters = (value = '') => value.length;
const sanitizeCurrencyInput = (value: string) => value.replace(/[^\d]/g, '');

const geocodeAddress = async (query: string, signal?: AbortSignal) => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 8) return null;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=id&accept-language=id&q=${encodeURIComponent(normalizedQuery)}`,
    { headers: { Accept: 'application/json' }, signal }
  );

  if (!response.ok) return null;

  const payload = await response.json();
  const first = Array.isArray(payload) ? payload[0] : null;
  if (!first?.lat || !first?.lon) return null;

  return {
    latitude: Number(first.lat).toFixed(6),
    longitude: Number(first.lon).toFixed(6),
    displayName: first.display_name || normalizedQuery,
  };
};

export default function PostJobPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const requestedCategory = searchParams.get('category') || '';
  const requestedService = searchParams.get('service') || '';
  const categoryFromQuery = serviceCatalog.find((item) => (
    item.category.toLowerCase() === requestedCategory.toLowerCase()
    || item.services.some((service) => service.toLowerCase() === requestedService.toLowerCase())
  ))?.category || '';
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: requestedService ? `Pesan jasa ${requestedService}` : '',
    category: categoryFromQuery,
    customCategory: '',
    serviceType: requestedService,
    customServiceType: '',
    description: '',
    budget: '',
    eventDate: '',
    deadline: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    address: '',
    addressDetail: '',
    latitude: '',
    longitude: '',
    locationSource: 'manual',
    referenceFiles: [] as ReferenceFile[],
  });
  const [error, setError] = useState('');
  const [locationWarning, setLocationWarning] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [regionLoading, setRegionLoading] = useState({
    provinces: false,
    cities: false,
    districts: false,
    villages: false,
  });
  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [cities, setCities] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [villages, setVillages] = useState<RegionOption[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const navigate = useNavigate();

  const categoryOptions = serviceCatalog.map((item) => item.category);
  const serviceOptions = getServicesForCategory(formData.category);
  const titleCharacterCount = countCharacters(formData.title);
  const descriptionCharacterCount = countCharacters(formData.description);

  const mapQuery = formData.latitude && formData.longitude
    ? `${formData.latitude},${formData.longitude}`
    : [formData.addressDetail, formData.village, formData.district, formData.city, formData.province].filter(Boolean).join(', ');

  useEffect(() => {
    let active = true;
    setRegionLoading((current) => ({ ...current, provinces: true }));
    fetchRegionOptions('/provinces.json')
      .then((items) => {
        if (active) setProvinces(items);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data provinsi gagal dimuat. Coba refresh halaman atau isi nama wilayah lalu verifikasi manual.', 'Province data failed to load. Refresh the page or type the region name and verify it manually.'));
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, provinces: false }));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      setCities([]);
      return;
    }

    let active = true;
    setRegionLoading((current) => ({ ...current, cities: true }));
    fetchRegionOptions(`/regencies/${selectedProvinceId}.json`)
      .then((items) => {
        if (active) setCities(items);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data kota/kabupaten gagal dimuat. Silakan coba lagi atau isi manual.', 'City/regency data failed to load. Please try again or enter it manually.'));
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, cities: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedCityId) {
      setDistricts([]);
      return;
    }

    let active = true;
    setRegionLoading((current) => ({ ...current, districts: true }));
    fetchRegionOptions(`/districts/${selectedCityId}.json`)
      .then((items) => {
        if (active) setDistricts(items);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data kecamatan gagal dimuat. Silakan coba lagi atau isi manual.', 'District data failed to load. Please try again or enter it manually.'));
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, districts: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedCityId]);

  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }

    let active = true;
    setRegionLoading((current) => ({ ...current, villages: true }));
    fetchRegionOptions(`/villages/${selectedDistrictId}.json`)
      .then((items) => {
        if (active) setVillages(items);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data desa/kelurahan gagal dimuat. Silakan coba lagi atau isi manual.', 'Village/subdistrict data failed to load. Please try again or enter it manually.'));
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, villages: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedDistrictId]);

  useEffect(() => {
    if (formData.locationSource !== 'manual') return undefined;

    const query = [
      formData.addressDetail,
      formData.village,
      formData.district,
      formData.city,
      formData.province,
      formData.postalCode,
    ].filter(Boolean).join(', ');

    if (query.trim().length < 8) return undefined;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const result = await geocodeAddress(query, controller.signal);
        if (!result) return;

        setFormData((current) => {
          const latestQuery = [
            current.addressDetail,
            current.village,
            current.district,
            current.city,
            current.province,
            current.postalCode,
          ].filter(Boolean).join(', ');

          if (latestQuery !== query || current.locationSource !== 'manual') return current;

          return {
            ...current,
            latitude: result.latitude,
            longitude: result.longitude,
            address: result.displayName,
          };
        });
      } catch {
        // Geocoding only syncs the map preview; typed address remains the source of truth.
      }
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [
    formData.addressDetail,
    formData.city,
    formData.district,
    formData.locationSource,
    formData.postalCode,
    formData.province,
    formData.village,
  ]);

  const attachReferenceFiles = async (files?: FileList | null) => {
    if (!files?.length) return;

    setError('');
    const nextFiles: ReferenceFile[] = [];

    for (const file of Array.from(files)) {
      const validationError = validateReferenceFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const uploaded = await uploadFileToS3(file, 'project-reference');
      nextFiles.push({
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        fileSize: uploaded.fileSize,
        fileUrl: uploaded.key,
      });
    }

    const totalSize = [...formData.referenceFiles, ...nextFiles]
      .reduce((total, file) => total + file.fileSize, 0);

    if (totalSize > S3_TOTAL_LIMIT_BYTES) {
      setError(t('Total ukuran file terlalu besar. Kurangi beberapa file lalu coba lagi.', 'Total file size is too large. Remove a few files and try again.'));
      return;
    }

    setFormData((current) => ({
      ...current,
      referenceFiles: [...current.referenceFiles, ...nextFiles],
    }));
  };

  const removeReferenceFile = (index: number) => {
    setFormData((current) => ({
      ...current,
      referenceFiles: current.referenceFiles.filter((_, fileIndex) => fileIndex !== index),
    }));
  };

  const handleNext = () => {
    setError('');
    const categoryReady = formData.category && (formData.category !== 'other' || formData.customCategory.trim());
    const serviceReady = formData.serviceType && (formData.serviceType !== 'other' || formData.customServiceType.trim());
    if (step === 1 && (!formData.title || !categoryReady || !serviceReady || !formData.description)) {
      setError(t('Judul, kategori, jasa, dan deskripsi wajib diisi', 'Title, category, service, and description are required'));
      return;
    }
    if (step === 1 && titleCharacterCount > TITLE_MAX_LENGTH) {
      setError(t(`Judul pekerjaan maksimal ${TITLE_MAX_LENGTH} karakter`, `Job title can be up to ${TITLE_MAX_LENGTH} characters`));
      return;
    }
    if (step === 1 && descriptionCharacterCount > DESCRIPTION_MAX_LENGTH) {
      setError(t(`Deskripsi maksimal ${DESCRIPTION_MAX_LENGTH} karakter`, `Description can be up to ${DESCRIPTION_MAX_LENGTH} characters`));
      return;
    }
    if (step === 2 && (!formData.eventDate || !formData.deadline || !formData.province || !formData.city || !formData.district || !formData.village || !formData.addressDetail)) {
      setError(t('Tanggal pelaksanaan, deadline, provinsi, kota, kecamatan, desa, dan detail alamat wajib diisi', 'Event date, deadline, province, city, district, village, and address details are required'));
      return;
    }
    if (step === 2 && formData.budget) {
      const parsedBudget = Number(formData.budget.replace(/[^\d]/g, ''));
      if (parsedBudget < 10000) {
        setError(t('Budget minimal Rp 10.000', 'Minimum budget is Rp 10.000'));
        return;
      }
      if (parsedBudget > 100_000_000) {
        setError(t('Budget maksimal Rp 100.000.000', 'Maximum budget is Rp 100.000.000'));
        return;
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const selectProvince = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedProvinceId(option?.id || '');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
    setFormData((current) => ({
      ...current,
      province: name,
      city: '',
      district: '',
      village: '',
      postalCode: '',
      locationSource: 'manual',
    }));
  };

  const selectCity = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedCityId(option?.id || '');
    setSelectedDistrictId('');
    setDistricts([]);
    setVillages([]);
    setFormData((current) => ({
      ...current,
      city: name,
      district: '',
      village: '',
      postalCode: '',
      locationSource: 'manual',
    }));
  };

  const selectDistrict = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedDistrictId(option?.id || '');
    setVillages([]);
    setFormData((current) => ({
      ...current,
      district: name,
      village: '',
      postalCode: '',
      locationSource: 'manual',
    }));
  };

  const selectVillage = (option: RegionOption | null, name = option?.name || '') => {
    setFormData((current) => ({
      ...current,
      village: name,
      locationSource: 'manual',
    }));
  };

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError(t('Browser tidak mendukung share location', 'Your browser does not support location sharing'));
      return;
    }

    setLocating(true);
    setError('');
    setLocationWarning('');

    try {
      let position: GeolocationPosition;
      try {
        position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      } catch {
        position = await getCurrentPosition({ enableHighAccuracy: false, timeout: 25000, maximumAge: 60000 });
      }

      const latitude = String(position.coords.latitude);
      const longitude = String(position.coords.longitude);
      let province = formData.province;
      let city = formData.city;
      let district = formData.district;
      let village = formData.village;
      let postalCode = formData.postalCode;
      let address = formData.address;
      let addressDetail = formData.addressDetail;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
          { headers: { Accept: 'application/json' } }
        );
        const payload = await response.json();
        const addressParts = payload.address || {};
        const provinceName = addressParts.state || addressParts.region || province;
        const cityName = addressParts.city || addressParts.town || addressParts.county || addressParts.city_district || city;
        const districtName = addressParts.suburb || addressParts.city_district || addressParts.municipality || district;
        const villageName = addressParts.village || addressParts.neighbourhood || addressParts.hamlet || addressParts.suburb || village;

        const provinceMatch = findRegionByName(provinces, provinceName);
        let cityOptions: RegionOption[] = [];
        let districtOptions: RegionOption[] = [];
        let villageOptions: RegionOption[] = [];
        let cityMatch: RegionOption | null = null;
        let districtMatch: RegionOption | null = null;
        let villageMatch: RegionOption | null = null;

        if (provinceMatch) {
          cityOptions = await fetchRegionOptions(`/regencies/${provinceMatch.id}.json`);
          cityMatch = findRegionByName(cityOptions, cityName);
        }

        if (cityMatch) {
          districtOptions = await fetchRegionOptions(`/districts/${cityMatch.id}.json`);
          districtMatch = findRegionByName(districtOptions, districtName);
        }

        if (districtMatch) {
          villageOptions = await fetchRegionOptions(`/villages/${districtMatch.id}.json`);
          villageMatch = findRegionByName(villageOptions, villageName);
        }

        if (provinceMatch) {
          setSelectedProvinceId(provinceMatch.id);
          setCities(cityOptions);
          province = provinceMatch.name;
        } else {
          province = provinceName;
        }

        if (cityMatch) {
          setSelectedCityId(cityMatch.id);
          setDistricts(districtOptions);
          city = cityMatch.name;
        } else {
          setSelectedCityId('');
          city = cityName;
        }

        if (districtMatch) {
          setSelectedDistrictId(districtMatch.id);
          setVillages(villageOptions);
          district = districtMatch.name;
        } else {
          setSelectedDistrictId('');
          district = districtName;
        }

        village = villageMatch?.name || villageName;
        postalCode = addressParts.postcode || postalCode;
        address = payload.display_name || address;
        addressDetail = [
          addressParts.road,
          addressParts.house_number,
          addressParts.building,
        ].filter(Boolean).join(' ') || addressDetail || payload.display_name || `Koordinat: ${latitude}, ${longitude}`;

        if (!provinceMatch || !cityMatch || !districtMatch || !villageMatch) {
          setLocationWarning(t('Lokasi GPS berhasil diambil, tapi sebagian wilayah tidak cocok persis dengan data Indonesia. Mohon verifikasi pilihan wilayah secara manual.', 'GPS location was captured, but some region fields did not exactly match Indonesian region data. Please verify the region fields manually.'));
        }
      } catch {
        address = address || `Koordinat: ${latitude}, ${longitude}`;
        addressDetail = addressDetail || address;
        setLocationWarning(t('Koordinat berhasil diambil, tetapi pencarian alamat gagal. Lengkapi wilayah secara manual.', 'Coordinates were captured, but address lookup failed. Please complete the region fields manually.'));
      }

      setFormData((current) => ({
        ...current,
        latitude,
        longitude,
        province,
        city,
        district,
        village,
        postalCode,
        address,
        addressDetail,
        locationSource: 'share-location',
      }));
    } catch (geoError) {
      const code = Number((geoError as GeolocationPositionError)?.code || 0);
      const message = code === 1
        ? t('Izin lokasi ditolak. Silakan aktifkan izin lokasi browser atau isi alamat manual.', 'Location permission was denied. Enable browser location permission or enter the address manually.')
        : code === 2
          ? t('Lokasi tidak tersedia dari perangkat/jaringan saat ini. Coba aktifkan GPS/Wi-Fi atau isi manual.', 'Location is unavailable from the current device/network. Enable GPS/Wi-Fi or enter it manually.')
          : t('Gagal mengambil lokasi karena timeout. Coba lagi di area sinyal lebih stabil atau isi manual.', 'Location request timed out. Try again with a more stable signal or enter it manually.');
      setError(message);
    } finally {
      setLocating(false);
    }
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);
      setError('');
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          category: formData.category === 'other' ? formData.customCategory.trim() : formData.category,
          serviceType: formData.serviceType === 'other' ? formData.customServiceType.trim() : formData.serviceType,
        }),
      });
      navigate('/dashboard/client/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mempublikasikan job', 'Failed to publish job'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard/client" className="flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">{t('Kembali ke Dashboard', 'Back to Dashboard')}</span>
        </Link>

        <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          {t('Buat Pekerjaan Baru', 'Post a New Job')}
        </h1>

        <div className="flex items-center justify-between mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
                step >= num ? 'bg-[#F5C800] text-black' : 'bg-[#141414] text-[#888888]'
              }`}>
                {step > num ? <Check className="w-6 h-6" /> : num}
              </div>
              {num < 3 && (
                <div className={`flex-1 h-1 mx-4 ${
                  step > num ? 'bg-[#F5C800]' : 'bg-[#2A2A2A]'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
              {error}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Detail Pekerjaan', 'Job Details')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Judul Pekerjaan', 'Job Title')}</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('Contoh: Dokumentasi wedding di Bali', 'Example: Wedding documentation in Bali')}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                  <div className={`mt-2 text-xs ${titleCharacterCount > TITLE_MAX_LENGTH ? 'text-[#EF4444]' : 'text-[#888888]'}`}>
                    {titleCharacterCount}/{TITLE_MAX_LENGTH} {t('karakter', 'characters')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Kategori', 'Category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({
                      ...formData,
                      category: e.target.value,
                      serviceType: '',
                      customServiceType: '',
                    })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">{t('Pilih kategori', 'Select category')}</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="other">{t('Lainnya', 'Other')}</option>
                  </select>
                </div>
                {formData.category === 'other' && (
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">{t('Tuliskan kategori yang Anda butuhkan:', 'Write the category you need:')}</label>
                    <input
                      type="text"
                      value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                      placeholder={t('Contoh: Wisuda, company profile, interior', 'Example: Graduation, company profile, interior')}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Jasa yang Dibutuhkan', 'Service Needed')}</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    disabled={!formData.category}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">{formData.category ? t('Pilih jasa', 'Select service') : t('Pilih kategori dulu', 'Select a category first')}</option>
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                    <option value="other">{t('Lainnya', 'Other')}</option>
                  </select>
                </div>
                {formData.serviceType === 'other' && (
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">{t('Tuliskan jenis jasa yang Anda butuhkan:', 'Write the service type you need:')}</label>
                    <input
                      type="text"
                      value={formData.customServiceType}
                      onChange={(e) => setFormData({ ...formData, customServiceType: e.target.value })}
                      placeholder={t('Contoh: Live streaming, pilot drone, retouching', 'Example: Live streaming, drone pilot, retouching')}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Deskripsi Kebutuhan', 'Requirement Description')}</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('Jelaskan kebutuhan, konsep, output yang diharapkan, dan detail penting lainnya.', 'Explain your needs, concept, expected output, and other important details.')}
                    rows={8}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                  <div className={`mt-2 text-xs ${descriptionCharacterCount > DESCRIPTION_MAX_LENGTH ? 'text-[#EF4444]' : 'text-[#888888]'}`}>
                    {descriptionCharacterCount}/{DESCRIPTION_MAX_LENGTH} {t('karakter', 'characters')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('File Referensi (Opsional)', 'Reference Files (Optional)')}</label>
                  <label className="block border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 text-center hover:border-[#F5C800] transition-colors cursor-pointer">
                    <FileUp className="w-8 h-8 text-[#F5C800] mx-auto mb-3" />
                    <p className="text-[#888888]">{t('Klik untuk upload file referensi', 'Click to upload reference files')}</p>
                    <p className="text-sm text-[#888888] mt-2">
                      {t('Maksimal', 'Maximum')} {formatBytes(REFERENCE_FILE_MAX_BYTES)} {t('per file.', 'per file.')}
                    </p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(event) => attachReferenceFiles(event.target.files)}
                    />
                  </label>
                  {formData.referenceFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.referenceFiles.map((file, index) => (
                        <div key={`${file.fileName}-${index}`} className="flex items-center justify-between gap-3 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3">
                          <div>
                            <div className="text-white text-sm font-bold">{file.fileName}</div>
                            <div className="text-xs text-[#888888]">{formatBytes(file.fileSize)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeReferenceFile(index)}
                            className="p-2 text-[#888888] hover:text-[#EF4444] transition-colors"
                            aria-label={`Remove ${file.fileName}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Budget dan Jadwal', 'Budget and Schedule')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Budget/Harga (Rp)', 'Budget/Price (Rp)')}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: sanitizeCurrencyInput(e.target.value) })}
                    placeholder={t('Contoh: 1500000', 'Example: 1500000')}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Tanggal Pelaksanaan', 'Event Date')}</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Deadline Pengerjaan', 'Work Deadline')}</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="font-bold text-white">{t('Lokasi Pekerjaan', 'Job Location')}</h3>
                    <p className="text-sm text-[#888888]">{t('Pilih manual seperti checkout, atau isi otomatis dari lokasi Anda.', 'Choose manually like checkout, or autofill from your location.')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#F5C800] text-black rounded-lg text-sm font-bold hover:shadow-[0_0_10px_rgba(245,200,0,0.35)] transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    {locating ? t('Mengambil lokasi...', 'Getting location...') : t('Gunakan Lokasi Saya', 'Use My Location')}
                  </button>
                </div>
                {locationWarning && (
                  <div className="p-4 bg-[#F5C800]/10 border border-[#F5C800]/40 rounded-lg text-[#F5C800] text-sm">
                    {locationWarning}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <SearchableRegionSelect
                    label={t('Provinsi', 'Province')}
                    placeholder={regionLoading.provinces ? t('Memuat provinsi...', 'Loading provinces...') : t('Ketik nama provinsi', 'Type province name')}
                    noResultsText={t('Tidak ada hasil. Coba ejaan lain atau ketik manual lalu verifikasi alamat.', 'No results. Try another spelling or type it manually and verify the address.')}
                    value={formData.province}
                    options={provinces}
                    disabled={regionLoading.provinces}
                    onChange={(value) => selectProvince(findExactRegionByName(provinces, value), value)}
                    onSelect={selectProvince}
                  />
                  <SearchableRegionSelect
                    label={t('Kota / Kabupaten', 'City / Regency')}
                    placeholder={!selectedProvinceId ? t('Pilih provinsi dulu', 'Select a province first') : regionLoading.cities ? t('Memuat kota/kabupaten...', 'Loading cities/regencies...') : t('Ketik kota/kabupaten', 'Type city/regency')}
                    noResultsText={t('Tidak ada hasil. Coba ejaan lain atau ketik manual lalu verifikasi alamat.', 'No results. Try another spelling or type it manually and verify the address.')}
                    value={formData.city}
                    options={cities}
                    disabled={!selectedProvinceId || regionLoading.cities}
                    onChange={(value) => selectCity(findExactRegionByName(cities, value), value)}
                    onSelect={selectCity}
                  />
                  <SearchableRegionSelect
                    label={t('Kecamatan', 'District')}
                    placeholder={!selectedCityId ? t('Pilih kota/kabupaten dulu', 'Select a city/regency first') : regionLoading.districts ? t('Memuat kecamatan...', 'Loading districts...') : t('Ketik kecamatan', 'Type district')}
                    noResultsText={t('Tidak ada hasil. Coba ejaan lain atau ketik manual lalu verifikasi alamat.', 'No results. Try another spelling or type it manually and verify the address.')}
                    value={formData.district}
                    options={districts}
                    disabled={!selectedCityId || regionLoading.districts}
                    onChange={(value) => selectDistrict(findExactRegionByName(districts, value), value)}
                    onSelect={selectDistrict}
                  />
                  <SearchableRegionSelect
                    label={t('Desa / Kelurahan', 'Village / Subdistrict')}
                    placeholder={!selectedDistrictId ? t('Pilih kecamatan dulu', 'Select a district first') : regionLoading.villages ? t('Memuat desa/kelurahan...', 'Loading villages/subdistricts...') : t('Ketik desa/kelurahan', 'Type village/subdistrict')}
                    noResultsText={t('Tidak ada hasil. Coba ejaan lain atau ketik manual lalu verifikasi alamat.', 'No results. Try another spelling or type it manually and verify the address.')}
                    value={formData.village}
                    options={villages}
                    disabled={!selectedDistrictId || regionLoading.villages}
                    onChange={(value) => selectVillage(findExactRegionByName(villages, value), value)}
                    onSelect={selectVillage}
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Kode Pos', 'Postal Code')}</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value, locationSource: 'manual' })}
                    placeholder={t('Otomatis dari wilayah atau isi manual', 'Autofilled from region or entered manually')}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888888] mb-2">{t('Detail Alamat', 'Address Details')}</label>
                  <textarea
                    value={formData.addressDetail}
                    onChange={(e) => {
                      const addressDetail = e.target.value;
                      const address = [
                        addressDetail,
                        formData.village,
                        formData.district,
                        formData.city,
                        formData.province,
                        formData.postalCode,
                      ].filter(Boolean).join(', ');
                      setFormData({ ...formData, addressDetail, address, locationSource: 'manual' });
                    }}
                    placeholder={t('Nama venue, jalan, nomor rumah/gedung, patokan, instruksi masuk', 'Venue name, street, house/building number, landmark, entry instructions')}
                    rows={4}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                  <p className="text-xs text-[#888888] mt-2">
                    {t('Alamat tersimpan:', 'Saved address:')} {[formData.addressDetail, formData.village, formData.district, formData.city, formData.province, formData.postalCode].filter(Boolean).join(', ') || '-'}
                  </p>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-[#888888] mt-1">
                      {t('Koordinat tersimpan:', 'Saved coordinates:')} {formData.latitude}, {formData.longitude}
                    </p>
                  )}
                </div>

                <DraggableLocationMap
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  fallbackQuery={mapQuery}
                  onChange={(latitude, longitude) => setFormData((current) => ({
                    ...current,
                    latitude,
                    longitude,
                    locationSource: 'map-pin',
                  }))}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Review dan Publikasikan', 'Review and Publish')}
              </h2>
              <div className="space-y-6">
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-4">{t('Ringkasan Pekerjaan', 'Job Summary')}</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[#888888]">{t('Judul Pekerjaan:', 'Job Title:')} </span>
                      <span className="text-white">{formData.title || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Kategori:', 'Category:')} </span>
                      <span className="text-white capitalize">{formData.category || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Jasa:', 'Service:')} </span>
                      <span className="text-white">{formData.serviceType || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Budget/Harga:', 'Budget/Price:')} </span>
                      <span className="text-[#F5C800] font-bold">Rp {formData.budget || '0'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Tanggal Pelaksanaan:', 'Event Date:')} </span>
                      <span className="text-white">{formData.eventDate || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Deadline: </span>
                      <span className="text-white">{formData.deadline || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Provinsi:', 'Province:')} </span>
                      <span className="text-white">{formData.province || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Kota/Kabupaten:', 'City/Regency:')} </span>
                      <span className="text-white">{formData.city || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Kecamatan:', 'District:')} </span>
                      <span className="text-white">{formData.district || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Desa/Kelurahan:', 'Village/Subdistrict:')} </span>
                      <span className="text-white">{formData.village || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('Detail Alamat:', 'Address Details:')} </span>
                      <span className="text-white">{formData.addressDetail || t('Belum diisi', 'Not filled yet')}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">{t('File Referensi:', 'Reference Files:')} </span>
                      <span className="text-white">{formData.referenceFiles.length} {t('file', 'files')}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-2">{t('Deskripsi Kebutuhan', 'Requirement Description')}</h3>
                  <p className="text-[#888888]">{formData.description || t('Belum ada deskripsi', 'No description yet')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2A2A2A]">
            {step > 1 ? (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-6 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('Kembali', 'Back')}
              </button>
            ) : <div></div>}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                {t('Lanjut', 'Next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                {submitting ? t('Mempublikasikan...', 'Publishing...') : t('Publikasikan Pekerjaan', 'Publish Job')}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SearchableRegionSelect({
  label,
  placeholder,
  noResultsText,
  value,
  options,
  disabled,
  onChange,
  onSelect,
}: {
  label: string;
  placeholder: string;
  noResultsText: string;
  value: string;
  options: RegionOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
  onSelect: (option: RegionOption) => void;
}) {
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
              {noResultsText}
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
