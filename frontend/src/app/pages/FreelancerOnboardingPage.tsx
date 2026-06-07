import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { ArrowLeft, Film, ImagePlus, LocateFixed, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DraggableLocationMap from '../components/dashboard/DraggableLocationMap';
import SearchableRegionSelect from '../components/dashboard/SearchableRegionSelect';
import { useAuth } from '../context/AuthContext';
import {
  fetchRegionOptions,
  fallbackPostalCodeForCity,
  findExactRegionByName,
  findRegionByName,
  geocodeIndonesianAddress,
  getCurrentPosition,
  RegionOption,
} from '../lib/indonesiaRegions';
import {
  PORTFOLIO_MAX_IMAGES_PER_ITEM,
  PORTFOLIO_MAX_VIDEOS_PER_ITEM,
  validatePortfolioFile,
} from '../lib/uploadLimits';
import { uploadFileToS3 } from '../lib/s3Upload';
import { serviceCatalog } from '../lib/serviceCatalog';
import { useLanguage } from '../context/LanguageContext';

const categoryOptions = serviceCatalog.map((item) => item.category);

export default function FreelancerOnboardingPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, registerFreelancer } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    bio: user?.bio || '',
    categories: [] as string[],
    experienceYears: '',
    startingPrice: user?.startingPrice ? String(user.startingPrice) : '',
    province: user?.province || '',
    city: user?.city || '',
    district: user?.district || '',
    village: user?.village || '',
    postalCode: user?.postalCode || '',
    addressDetail: user?.addressDetail || '',
    latitude: user?.latitude ? String(user.latitude) : '',
    longitude: user?.longitude ? String(user.longitude) : '',
    locationSource: user?.locationSource || 'manual',
    agreed: false,
  });
  const [portfolioFiles, setPortfolioFiles] = useState<Array<{
    fileUrl: string;
    previewUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }>>([]);
  const [error, setError] = useState('');
  const [locationWarning, setLocationWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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

  useEffect(() => {
    let active = true;
    setRegionLoading((current) => ({ ...current, provinces: true }));
    fetchRegionOptions('/provinces.json')
      .then((items) => {
        if (!active) return;
        setProvinces(items);
        const match = findRegionByName(items, form.province);
        if (match) setSelectedProvinceId(match.id);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data provinsi gagal dimuat. Coba refresh halaman.', 'Province data failed to load. Try refreshing the page.'));
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
        if (!active) return;
        setCities(items);
        const match = findRegionByName(items, form.city);
        if (match) setSelectedCityId(match.id);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data kota/kabupaten gagal dimuat.', 'City/regency data failed to load.'));
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
        if (!active) return;
        setDistricts(items);
        const match = findRegionByName(items, form.district);
        if (match) setSelectedDistrictId(match.id);
      })
      .catch(() => {
        if (active) setLocationWarning('Data kecamatan gagal dimuat.');
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
        if (active) setLocationWarning('Data desa/kelurahan gagal dimuat.');
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, villages: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedDistrictId]);

  useEffect(() => {
    if (form.locationSource === 'share-location' || form.locationSource === 'manual-map') return undefined;
    const query = [
      form.addressDetail,
      form.village,
      form.district,
      form.city,
      form.province,
    ].filter(Boolean).join(', ');

    if (!query || query.length < 3) return undefined;

    const timeout = window.setTimeout(async () => {
      try {
        const result = await geocodeIndonesianAddress(`${query}, Indonesia`);
        const fallbackPostal = fallbackPostalCodeForCity(form.city);
        setForm((current) => {
          if (current.locationSource === 'share-location' || current.locationSource === 'manual-map') return current;
          return {
            ...current,
            latitude: result?.latitude || current.latitude,
            longitude: result?.longitude || current.longitude,
            postalCode: current.postalCode || result?.postalCode || fallbackPostal,
          };
        });
      } catch {
        const fallbackPostal = fallbackPostalCodeForCity(form.city);
        if (fallbackPostal) {
          setForm((current) => current.postalCode ? current : { ...current, postalCode: fallbackPostal });
        }
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [form.addressDetail, form.city, form.district, form.locationSource, form.province, form.village]);

  const toggleCategory = (category: string) => {
    setForm((current) => {
      const selected = current.categories.includes(category);
      setError('');
      return {
        ...current,
        categories: selected
          ? current.categories.filter((item) => item !== category)
          : [...current.categories, category],
      };
    });
  };

  const validate = () => {
    if (!form.fullName.trim()) return t('Nama lengkap wajib diisi.', 'Full name is required.');
    if (!form.bio.trim()) return t('Bio/deskripsi wajib diisi.', 'Bio/description is required.');
    if (form.categories.length === 0) return t('Pilih minimal satu kategori keahlian.', 'Choose at least one skill category.');
    if (form.experienceYears === '' || Number(form.experienceYears) < 0) return t('Pengalaman tahun wajib diisi.', 'Years of experience is required.');
    if (!form.startingPrice || Number(form.startingPrice) < 1) return t('Harga mulai wajib diisi.', 'Starting price is required.');
    if (!form.province || !form.city || !form.district || !form.village || !form.addressDetail) {
      return t('Alamat lengkap freelancer wajib diisi.', 'Complete freelancer address is required.');
    }
    if (!form.agreed) return t('Persetujuan syarat & ketentuan freelancer wajib dicentang.', 'Freelancer terms and conditions agreement must be checked.');
    return '';
  };

  const selectProvince = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedProvinceId(option?.id || '');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
    setForm((current) => ({
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
    setForm((current) => ({
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
    setForm((current) => ({
      ...current,
      district: name,
      village: '',
      postalCode: '',
      locationSource: 'manual',
    }));
  };

  const selectVillage = (option: RegionOption | null, name = option?.name || '') => {
    setForm((current) => ({
      ...current,
      village: name,
      locationSource: 'manual',
    }));
  };

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung fitur lokasi.');
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
      let province = form.province;
      let city = form.city;
      let district = form.district;
      let village = form.village;
      let postalCode = form.postalCode;
      let addressDetail = form.addressDetail;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
          { headers: { Accept: 'application/json' } }
        );
        const payload = await response.json();
        const address = payload.address || {};
        const provinceName = address.state || address.region || province;
        const cityName = address.city || address.town || address.county || address.city_district || city;
        const districtName = address.suburb || address.city_district || address.municipality || district;
        const villageName = address.village || address.neighbourhood || address.hamlet || address.suburb || village;
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
        postalCode = address.postcode || postalCode;
        addressDetail = [address.road, address.house_number, address.building].filter(Boolean).join(' ')
          || payload.display_name
          || addressDetail
          || `Koordinat: ${latitude}, ${longitude}`;

        if (!provinceMatch || !cityMatch || !districtMatch || !villageMatch) {
          setLocationWarning('Lokasi berhasil diambil, tapi sebagian wilayah tidak match persis. Mohon verifikasi manual.');
        }
      } catch {
        addressDetail = addressDetail || `Koordinat: ${latitude}, ${longitude}`;
        setLocationWarning('Koordinat berhasil diambil, tetapi detail alamat perlu dilengkapi manual.');
      }

      setForm((current) => ({
        ...current,
        latitude,
        longitude,
        province,
        city,
        district,
        village,
        postalCode,
        addressDetail,
        locationSource: 'share-location',
      }));
    } catch (geoError) {
      const code = Number((geoError as GeolocationPositionError)?.code || 0);
      setError(code === 1
        ? t('Izin lokasi ditolak. Aktifkan izin lokasi browser atau isi manual.', 'Location permission was denied. Enable browser location permission or fill it manually.')
        : t('Gagal mengambil lokasi. Coba lagi atau isi alamat manual.', 'Failed to get location. Try again or fill the address manually.'));
    } finally {
      setLocating(false);
    }
  };

  const attachPortfolio = async (fileList?: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const currentImages = portfolioFiles.filter((file) => file.fileType.startsWith('image/')).length;
    const currentVideos = portfolioFiles.filter((file) => file.fileType.startsWith('video/')).length;
    const incomingImages = files.filter((file) => file.type.startsWith('image/')).length;
    const incomingVideos = files.filter((file) => file.type.startsWith('video/')).length;

    if (currentImages + incomingImages > PORTFOLIO_MAX_IMAGES_PER_ITEM) {
      setError(t(`Maksimal ${PORTFOLIO_MAX_IMAGES_PER_ITEM} gambar untuk portofolio awal.`, `Maximum ${PORTFOLIO_MAX_IMAGES_PER_ITEM} images for the initial portfolio.`));
      return;
    }

    if (currentVideos + incomingVideos > PORTFOLIO_MAX_VIDEOS_PER_ITEM) {
      setError(t('Maksimal 1 video untuk portofolio awal.', 'Maximum 1 video for the initial portfolio.'));
      return;
    }

    const validationError = files.map(validatePortfolioFile).find(Boolean);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      const uploadedFiles = await Promise.all(files.map((file) => uploadFileToS3(file, 'portfolio')));
      setPortfolioFiles((current) => [
        ...current,
        ...uploadedFiles.map((uploaded) => ({
          fileUrl: uploaded.key,
          previewUrl: uploaded.url,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
        })),
      ]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal upload portofolio', 'Failed to upload portfolio'));
    } finally {
      setUploading(false);
    }
  };

  const removePortfolioFile = (index: number) => {
    setPortfolioFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      await registerFreelancer({
        ...form,
        portfolio: portfolioFiles.length ? {
          title: `Portfolio ${form.categories[0]}`,
          fileUrl: portfolioFiles[0].fileUrl,
          fileName: portfolioFiles[0].fileName,
          fileType: portfolioFiles[0].fileType,
          fileSize: portfolioFiles[0].fileSize,
          files: portfolioFiles.map((file) => ({
            fileUrl: file.fileUrl,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
          })),
        } : null,
      });
      navigate('/dashboard/freelancer', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mendaftar freelancer', 'Failed to register as freelancer'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userType="client" greeting={t('Pendaftaran Freelancer', 'Freelancer Registration')}>
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard/client')}
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Batal dan kembali ke Klien', 'Cancel and return to Client')}
        </button>

        <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Lengkapi Data Freelancer Anda', 'Complete Your Freelancer Data')}
          </h1>
          <p className="text-[#888888] mb-8">{t('Agar klien dapat menemukan dan memesan jasa Anda', 'So clients can find and order your services')}</p>

          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <Field label={t('Nama Lengkap *', 'Full Name *')}>
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              />
            </Field>

            <Field label={t('Bio / Deskripsi *', 'Bio / Description *')}>
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={5}
                placeholder={t('Ceritakan keahlian, gaya kerja, dan layanan yang Anda tawarkan.', 'Tell clients about your skills, work style, and services.')}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              />
            </Field>

            <Field label={t('Kategori Keahlian *', 'Skill Categories *')}>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map((category) => {
                  const active = form.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
                        active
                          ? 'bg-[#F5C800] border-[#F5C800] text-black'
                          : 'bg-[#141414] border-[#2A2A2A] text-[#888888] hover:text-white'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#888888] mt-2">{t('Pilih semua kategori yang relevan dengan jasa Anda.', 'Select all categories relevant to your services.')}</p>
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label={t('Pengalaman (tahun) *', 'Experience (years) *')}>
                <input
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(event) => setForm({ ...form, experienceYears: event.target.value })}
                  className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                />
              </Field>
              <Field label={t('Harga Mulai (Rp) *', 'Starting Price (Rp) *')}>
                <input
                  type="number"
                  min="1"
                  value={form.startingPrice}
                  onChange={(event) => setForm({ ...form, startingPrice: event.target.value })}
                  className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                />
              </Field>
            </div>

            <section className="rounded-xl border border-[#2A2A2A] bg-[#141414] p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-2xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {t('Alamat Freelancer *', 'Freelancer Address *')}
                  </h2>
                  <p className="text-sm text-[#888888]">{t('Dipakai untuk kalkulasi transportasi dan ditampilkan di profil.', 'Used for transport calculation and displayed on your profile.')}</p>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] disabled:opacity-60"
                >
                  <LocateFixed className="w-4 h-4" />
                  {locating ? t('Mengambil Lokasi...', 'Getting Location...') : t('Gunakan Lokasi Saya', 'Use My Location')}
                </button>
              </div>

              {locationWarning && (
                <div className="mb-4 p-3 bg-[#F5C800]/10 border border-[#F5C800]/40 rounded-lg text-[#F5C800] text-sm">
                  {locationWarning}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <SearchableRegionSelect
                  label={t('Provinsi', 'Province')}
                  placeholder={regionLoading.provinces ? t('Memuat provinsi...', 'Loading provinces...') : t('Ketik nama provinsi', 'Type province name')}
                  value={form.province}
                  options={provinces}
                  disabled={regionLoading.provinces}
                  onChange={(value) => selectProvince(findExactRegionByName(provinces, value), value)}
                  onSelect={selectProvince}
                />
                <SearchableRegionSelect
                  label={t('Kota / Kabupaten', 'City / Regency')}
                  placeholder={!selectedProvinceId ? t('Pilih provinsi dulu', 'Select a province first') : regionLoading.cities ? t('Memuat kota/kabupaten...', 'Loading cities/regencies...') : t('Ketik kota/kabupaten', 'Type city/regency')}
                  value={form.city}
                  options={cities}
                  disabled={!selectedProvinceId || regionLoading.cities}
                  onChange={(value) => selectCity(findExactRegionByName(cities, value), value)}
                  onSelect={selectCity}
                />
                <SearchableRegionSelect
                  label={t('Kecamatan', 'District')}
                  placeholder={!selectedCityId ? t('Pilih kota/kabupaten dulu', 'Select a city/regency first') : regionLoading.districts ? t('Memuat kecamatan...', 'Loading districts...') : t('Ketik kecamatan', 'Type district')}
                  value={form.district}
                  options={districts}
                  disabled={!selectedCityId || regionLoading.districts}
                  onChange={(value) => selectDistrict(findExactRegionByName(districts, value), value)}
                  onSelect={selectDistrict}
                />
                <SearchableRegionSelect
                  label={t('Desa / Kelurahan', 'Village / Subdistrict')}
                  placeholder={!selectedDistrictId ? t('Pilih kecamatan dulu', 'Select a district first') : regionLoading.villages ? t('Memuat desa/kelurahan...', 'Loading villages/subdistricts...') : t('Ketik desa/kelurahan', 'Type village/subdistrict')}
                  value={form.village}
                  options={villages}
                  disabled={!selectedDistrictId || regionLoading.villages}
                  onChange={(value) => selectVillage(findExactRegionByName(villages, value), value)}
                  onSelect={selectVillage}
                />
                <Field label={t('Kode Pos', 'Postal Code')}>
                  <input
                    type="number"
                    value={form.postalCode}
                    onChange={(event) => setForm({ ...form, postalCode: event.target.value, locationSource: 'manual' })}
                    className="w-full bg-[#101010] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  />
                </Field>
                <Field label={t('Koordinat', 'Coordinates')}>
                  <input
                    value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : ''}
                    readOnly
                    placeholder={t('Terisi otomatis dari lokasi', 'Filled automatically from location')}
                    className="w-full bg-[#101010] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#888888] placeholder-[#888888] focus:outline-none"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label={t('Detail Alamat *', 'Address Detail *')}>
                    <textarea
                      value={form.addressDetail}
                      onChange={(event) => setForm({ ...form, addressDetail: event.target.value, locationSource: 'manual' })}
                      rows={3}
                      placeholder={t('Nama jalan, nomor, gedung, patokan', 'Street name, number, building, landmark')}
                      className="w-full bg-[#101010] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <DraggableLocationMap
                    latitude={form.latitude}
                    longitude={form.longitude}
                    fallbackQuery={[form.addressDetail, form.village, form.district, form.city, form.province, form.postalCode].filter(Boolean).join(', ')}
                    onChange={(latitude, longitude) => setForm((current) => ({
                      ...current,
                      latitude,
                      longitude,
                      locationSource: 'manual-map',
                    }))}
                  />
                </div>
              </div>
            </section>

            <Field label={t('Portofolio', 'Portfolio')}>
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {uploading ? t('Mengupload...', 'Uploading...') : t('Tambah Gambar / Video', 'Add Image / Video')}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,video/mp4,video/quicktime,video/webm"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      attachPortfolio(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
                <span className="text-sm text-[#888888]">{t('Opsional, maksimal 5 gambar (1MB/gambar) dan 1 video (100MB).', 'Optional, maximum 5 images (1MB/image) and 1 video (100MB).')}</span>
              </div>
              {portfolioFiles.length > 0 && (
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {portfolioFiles.map((file, index) => (
                    <div key={`${file.fileUrl}-${index}`} className="relative overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
                      {file.fileType.startsWith('video/') ? (
                        <video src={file.previewUrl} controls className="h-36 w-full object-cover" />
                      ) : (
                        <img src={file.previewUrl} alt={file.fileName} className="h-36 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => removePortfolioFile(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-[#EF4444]"
                        aria-label={t('Hapus media portofolio', 'Remove portfolio media')}
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 px-3 py-2 text-xs text-[#888888]">
                        {file.fileType.startsWith('video/') ? <Film className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                        <span className="truncate">{file.fileName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(event) => setForm({ ...form, agreed: event.target.checked })}
                className="mt-1 w-4 h-4 rounded border-[#2A2A2A] bg-[#141414] text-[#F5C800] focus:ring-[#F5C800]"
              />
              <span className="text-sm text-[#888888]">
                {t('Saya setuju dengan', 'I agree to the')}{' '}
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setTermsOpen(true);
                  }}
                  className="text-[#F5C800] hover:underline"
                >
                  {t('syarat & ketentuan freelancer', 'freelancer terms and conditions')}
                </button>
              </span>
            </label>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/client')}
                className="px-5 py-3 border border-[#888888] text-white rounded-lg font-bold hover:border-[#F5C800] hover:text-[#F5C800]"
              >
                {t('Batal', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
              >
                {saving ? t('Menyimpan...', 'Saving...') : t('Daftar Sekarang', 'Register Now')}
              </button>
            </div>
          </form>
        </section>
      </div>

      {termsOpen && createPortal((
        <div className="fixed inset-y-0 left-0 right-0 z-[120] flex items-center justify-center px-4 md:left-60">
          <button
            type="button"
            aria-label={t('Tutup syarat dan ketentuan', 'Close terms and conditions')}
            onClick={() => setTermsOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/75"
          />
          <div className="relative w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-xl border border-[#D8DEE8] bg-white p-6 text-[#111827] shadow-2xl dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-white">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-4xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Syarat & Ketentuan Freelancer', 'Freelancer Terms & Conditions')}
                </h2>
                  <p className="text-sm text-[#667085] dark:text-[#888888] mt-1">
                  {t('Ringkasan aturan kerja di MediaVault untuk menjaga transaksi tetap jelas, aman, dan profesional.', 'A summary of MediaVault work rules to keep transactions clear, safe, and professional.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="p-2 border border-[#D8DEE8] rounded-lg text-[#667085] hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#888888] dark:text-white dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-[#667085] leading-relaxed dark:text-[#D1D1D1]">
              <TermsBlock
                title={t('1. Profil dan Keahlian', '1. Profile and Skills')}
                body={t('Freelancer wajib mengisi data profil secara benar, termasuk bio, kategori keahlian, domisili, dan harga mulai. Informasi ini dipakai klien untuk menilai kecocokan jasa sebelum memesan.', 'Freelancers must fill in profile data correctly, including bio, skill categories, location, and starting price. This information helps clients assess service fit before ordering.')}
              />
              <TermsBlock
                title={t('2. Penerimaan Pesanan', '2. Order Acceptance')}
                body={t('Setelah klien membayar, freelancer harus memilih Terima atau Tolak pesanan. Jika diterima, freelancer berkomitmen mengerjakan sesuai detail pesanan, tanggal, lokasi, dan kesepakatan yang tercatat di MediaVault.', 'After the client pays, freelancers must accept or reject the order. If accepted, freelancers commit to working according to the order details, dates, location, and agreement recorded in MediaVault.')}
              />
              <TermsBlock
                title={t('3. Penolakan dan Refund', '3. Rejection and Refund')}
                body={t('Jika freelancer menolak pesanan yang sudah dibayar, dana akan dikembalikan ke saldo internal klien di MediaVault. Untuk versi produksi, pengembalian ke rekening atau e-wallet asli membutuhkan proses penarikan/pencairan terpisah sesuai kebijakan platform.', 'If a freelancer rejects a paid order, funds are returned to the client internal MediaVault balance. In production, refunds to bank accounts or real e-wallets require a separate withdrawal or payout process according to platform policy.')}
              />
              <TermsBlock
                title={t('4. Escrow dan Pencairan Dana', '4. Escrow and Fund Release')}
                body={t('Pembayaran klien ditahan sebagai escrow MediaVault sampai pekerjaan selesai. Dana freelancer masuk ke saldo setelah klien mengonfirmasi pekerjaan selesai atau setelah mekanisme auto-release berjalan sesuai aturan platform.', 'Client payments are held in MediaVault escrow until the work is completed. Freelancer funds are added to the balance after the client confirms completion or after the platform auto-release mechanism runs.')}
              />
              <TermsBlock
                title={t('5. Komunikasi dan Update Progress', '5. Communication and Progress Updates')}
                body={t('Freelancer wajib menjaga komunikasi melalui fitur chat dan memberi update progres yang wajar, seperti tahap persiapan, proses pengerjaan, revisi, atau pengiriman hasil.', 'Freelancers must maintain communication through chat and provide reasonable progress updates, such as preparation, work process, revisions, or result delivery.')}
              />
              <TermsBlock
                title={t('6. Kualitas Pekerjaan', '6. Work Quality')}
                body={t('Freelancer bertanggung jawab memberikan hasil sesuai deskripsi layanan, brief klien, dan standar profesional bidang kreatif seperti fotografi, videografi, editing, event, product shoot, dan layanan terkait.', 'Freelancers are responsible for delivering work according to the service description, client brief, and professional creative standards such as photography, videography, editing, events, product shoots, and related services.')}
              />
              <TermsBlock
                title={t('7. Penarikan Saldo', '7. Balance Withdrawal')}
                body={t('Saldo freelancer dapat diajukan untuk penarikan melalui metode e-wallet yang tersedia. Status pencairan mengikuti proses dan ketentuan operasional MediaVault.', 'Freelancer balances can be submitted for withdrawal through available e-wallet methods. Payout status follows MediaVault operational processes and terms.')}
              />
              <TermsBlock
                title={t('8. Penyalahgunaan', '8. Misuse')}
                body={t('MediaVault dapat membatasi akses freelancer jika ditemukan data palsu, spam, penipuan, komunikasi tidak pantas, atau upaya memproses transaksi di luar alur platform tanpa persetujuan klien.', 'MediaVault may restrict freelancer access if false data, spam, fraud, inappropriate communication, or attempts to process transactions outside the platform flow without client approval are found.')}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#D8DEE8] pt-5 dark:border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="px-5 py-3 border border-[#D8DEE8] text-[#111827] rounded-lg font-bold hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#888888] dark:text-white dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
              >
                {t('Tutup', 'Close')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, agreed: true }));
                  setTermsOpen(false);
                }}
                className="px-5 py-3 bg-[#D9A900] text-[#111827] rounded-lg font-bold dark:bg-[#F5C800] dark:text-black"
              >
                {t('Saya Setuju', 'I Agree')}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </DashboardLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm text-[#888888] mb-2">{label}</span>
      {children}
    </label>
  );
}

function TermsBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-[#D8DEE8] bg-[#F7F9FC] p-4 dark:border-[#2A2A2A] dark:bg-[#141414]">
      <h3 className="font-bold text-[#111827] mb-1 dark:text-white">{title}</h3>
      <p className="text-[#667085] dark:text-[#AFAFAF]">{body}</p>
    </div>
  );
}
