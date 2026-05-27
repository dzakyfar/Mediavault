import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, ImagePlus, LocateFixed, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DraggableLocationMap from '../components/dashboard/DraggableLocationMap';
import SearchableRegionSelect from '../components/dashboard/SearchableRegionSelect';
import { useAuth } from '../context/AuthContext';
import {
  fetchRegionOptions,
  findExactRegionByName,
  findRegionByName,
  getCurrentPosition,
  RegionOption,
} from '../lib/indonesiaRegions';
import { MESSAGE_IMAGE_MAX_BYTES, validateImageFile } from '../lib/uploadLimits';
import { uploadFileToS3 } from '../lib/s3Upload';
import { serviceCatalog } from '../lib/serviceCatalog';

const categoryOptions = serviceCatalog.map((item) => item.category);

export default function FreelancerOnboardingPage() {
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
  const [portfolio, setPortfolio] = useState<{
    fileUrl: string;
    previewUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  } | null>(null);
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
        if (active) setLocationWarning('Data provinsi gagal dimuat. Coba refresh halaman.');
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
        if (active) setLocationWarning('Data kota/kabupaten gagal dimuat.');
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
    if (!form.fullName.trim()) return 'Nama lengkap wajib diisi.';
    if (!form.bio.trim()) return 'Bio/deskripsi wajib diisi.';
    if (form.categories.length === 0) return 'Pilih minimal satu kategori keahlian.';
    if (form.experienceYears === '' || Number(form.experienceYears) < 0) return 'Pengalaman tahun wajib diisi.';
    if (!form.startingPrice || Number(form.startingPrice) < 1) return 'Harga mulai wajib diisi.';
    if (!form.province || !form.city || !form.district || !form.village || !form.addressDetail) {
      return 'Alamat lengkap freelancer wajib diisi.';
    }
    if (!form.agreed) return 'Persetujuan syarat & ketentuan freelancer wajib dicentang.';
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
        ? 'Izin lokasi ditolak. Aktifkan permission lokasi browser atau isi manual.'
        : 'Gagal mengambil lokasi. Coba lagi atau isi alamat manual.');
    } finally {
      setLocating(false);
    }
  };

  const attachPortfolio = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file, MESSAGE_IMAGE_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setUploading(true);
      const uploaded = await uploadFileToS3(file, 'portfolio');
      setPortfolio({
        fileUrl: uploaded.key,
        previewUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        fileSize: uploaded.fileSize,
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal upload portfolio');
    } finally {
      setUploading(false);
    }
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
        portfolio: portfolio ? {
          title: `Portfolio ${form.categories[0]}`,
          fileUrl: portfolio.fileUrl,
          fileName: portfolio.fileName,
          fileType: portfolio.fileType,
          fileSize: portfolio.fileSize,
        } : null,
      });
      navigate('/dashboard/freelancer', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mendaftar freelancer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout userType="client" greeting="Freelancer Registration">
      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => navigate('/dashboard/client')}
          className="inline-flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Batal dan kembali ke Client
        </button>

        <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Lengkapi Data Freelancer Anda
          </h1>
          <p className="text-[#888888] mb-8">Agar klien dapat menemukan dan memesan jasa Anda</p>

          {error && (
            <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <Field label="Nama Lengkap *">
              <input
                value={form.fullName}
                onChange={(event) => setForm({ ...form, fullName: event.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              />
            </Field>

            <Field label="Bio / Deskripsi *">
              <textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                rows={5}
                placeholder="Ceritakan keahlian, gaya kerja, dan layanan yang Anda tawarkan."
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              />
            </Field>

            <Field label="Kategori Keahlian *">
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
              <p className="text-xs text-[#888888] mt-2">Pilih semua kategori yang relevan dengan jasa Anda.</p>
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Pengalaman (tahun) *">
                <input
                  type="number"
                  min="0"
                  value={form.experienceYears}
                  onChange={(event) => setForm({ ...form, experienceYears: event.target.value })}
                  className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                />
              </Field>
              <Field label="Harga Mulai (Rp) *">
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
                    Alamat Freelancer *
                  </h2>
                  <p className="text-sm text-[#888888]">Dipakai untuk kalkulasi transportasi dan ditampilkan di profile.</p>
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={locating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] disabled:opacity-60"
                >
                  <LocateFixed className="w-4 h-4" />
                  {locating ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saya'}
                </button>
              </div>

              {locationWarning && (
                <div className="mb-4 p-3 bg-[#F5C800]/10 border border-[#F5C800]/40 rounded-lg text-[#F5C800] text-sm">
                  {locationWarning}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <SearchableRegionSelect
                  label="Provinsi"
                  placeholder={regionLoading.provinces ? 'Memuat provinsi...' : 'Ketik nama provinsi'}
                  value={form.province}
                  options={provinces}
                  disabled={regionLoading.provinces}
                  onChange={(value) => selectProvince(findExactRegionByName(provinces, value), value)}
                  onSelect={selectProvince}
                />
                <SearchableRegionSelect
                  label="Kota / Kabupaten"
                  placeholder={!selectedProvinceId ? 'Pilih provinsi dulu' : regionLoading.cities ? 'Memuat kota/kabupaten...' : 'Ketik kota/kabupaten'}
                  value={form.city}
                  options={cities}
                  disabled={!selectedProvinceId || regionLoading.cities}
                  onChange={(value) => selectCity(findExactRegionByName(cities, value), value)}
                  onSelect={selectCity}
                />
                <SearchableRegionSelect
                  label="Kecamatan"
                  placeholder={!selectedCityId ? 'Pilih kota/kabupaten dulu' : regionLoading.districts ? 'Memuat kecamatan...' : 'Ketik kecamatan'}
                  value={form.district}
                  options={districts}
                  disabled={!selectedCityId || regionLoading.districts}
                  onChange={(value) => selectDistrict(findExactRegionByName(districts, value), value)}
                  onSelect={selectDistrict}
                />
                <SearchableRegionSelect
                  label="Desa / Kelurahan"
                  placeholder={!selectedDistrictId ? 'Pilih kecamatan dulu' : regionLoading.villages ? 'Memuat desa/kelurahan...' : 'Ketik desa/kelurahan'}
                  value={form.village}
                  options={villages}
                  disabled={!selectedDistrictId || regionLoading.villages}
                  onChange={(value) => selectVillage(findExactRegionByName(villages, value), value)}
                  onSelect={selectVillage}
                />
                <Field label="Kode Pos">
                  <input
                    type="number"
                    value={form.postalCode}
                    onChange={(event) => setForm({ ...form, postalCode: event.target.value, locationSource: 'manual' })}
                    className="w-full bg-[#101010] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                  />
                </Field>
                <Field label="Koordinat">
                  <input
                    value={form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : ''}
                    readOnly
                    placeholder="Terisi otomatis dari lokasi"
                    className="w-full bg-[#101010] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#888888] placeholder-[#888888] focus:outline-none"
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Detail Alamat *">
                    <textarea
                      value={form.addressDetail}
                      onChange={(event) => setForm({ ...form, addressDetail: event.target.value, locationSource: 'manual' })}
                      rows={3}
                      placeholder="Nama jalan, nomor, gedung, patokan"
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

            <Field label="Portofolio">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload PNG/JPEG'}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => attachPortfolio(event.target.files?.[0])} />
                </label>
                <span className="text-sm text-[#888888]">Opsional, maksimal 1MB. Otomatis tampil di profile.</span>
                {portfolio && (
                  <button type="button" onClick={() => setPortfolio(null)} className="inline-flex items-center gap-1 text-[#EF4444] text-sm">
                    <X className="w-4 h-4" />
                    Hapus file
                  </button>
                )}
              </div>
              {portfolio && <img src={portfolio.previewUrl} alt={portfolio.fileName} className="mt-4 max-h-64 rounded-lg object-contain bg-[#141414]" />}
            </Field>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreed}
                onChange={(event) => setForm({ ...form, agreed: event.target.checked })}
                className="mt-1 w-4 h-4 rounded border-[#2A2A2A] bg-[#141414] text-[#F5C800] focus:ring-[#F5C800]"
              />
              <span className="text-sm text-[#888888]">
                Saya setuju dengan{' '}
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    setTermsOpen(true);
                  }}
                  className="text-[#F5C800] hover:underline"
                >
                  syarat & ketentuan freelancer
                </button>
              </span>
            </label>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard/client')}
                className="px-5 py-3 border border-[#888888] text-white rounded-lg font-bold hover:border-[#F5C800] hover:text-[#F5C800]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
              >
                {saving ? 'Menyimpan...' : 'Daftar Sekarang'}
              </button>
            </div>
          </form>
        </section>
      </div>

      {termsOpen && (
        <div className="fixed inset-y-0 left-0 right-0 z-[120] flex items-center justify-center px-4 md:left-60">
          <button
            type="button"
            aria-label="Tutup syarat dan ketentuan"
            onClick={() => setTermsOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/75"
          />
          <div className="relative w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-xl border border-[#D8DEE8] bg-white p-6 text-[#111827] shadow-2xl dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-white">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-4xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Syarat & Ketentuan Freelancer
                </h2>
                  <p className="text-sm text-[#667085] dark:text-[#888888] mt-1">
                  Ringkasan aturan kerja di MediaVault untuk menjaga transaksi tetap jelas, aman, dan profesional.
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
                title="1. Profil dan Keahlian"
                body="Freelancer wajib mengisi data profil secara benar, termasuk bio, kategori keahlian, domisili, dan harga mulai. Informasi ini dipakai client untuk menilai kecocokan jasa sebelum memesan."
              />
              <TermsBlock
                title="2. Penerimaan Pesanan"
                body="Setelah client membayar, freelancer harus memilih Terima atau Tolak pesanan. Jika diterima, freelancer berkomitmen mengerjakan sesuai detail pesanan, tanggal, lokasi, dan kesepakatan yang tercatat di MediaVault."
              />
              <TermsBlock
                title="3. Penolakan dan Refund"
                body="Jika freelancer menolak pesanan yang sudah dibayar, dana akan dikembalikan ke saldo internal client di MediaVault. Untuk versi production, pengembalian ke rekening atau e-wallet asli membutuhkan proses withdraw/payout terpisah sesuai kebijakan platform."
              />
              <TermsBlock
                title="4. Escrow dan Pencairan Dana"
                body="Pembayaran client ditahan sebagai escrow MediaVault sampai pekerjaan selesai. Dana freelancer baru masuk ke saldo setelah client mengonfirmasi pekerjaan selesai atau setelah mekanisme auto-release berjalan sesuai aturan platform."
              />
              <TermsBlock
                title="5. Komunikasi dan Update Progress"
                body="Freelancer wajib menjaga komunikasi melalui fitur chat dan memberi update progress yang wajar, seperti tahap persiapan, proses pengerjaan, revisi, atau pengiriman hasil."
              />
              <TermsBlock
                title="6. Kualitas Pekerjaan"
                body="Freelancer bertanggung jawab memberikan hasil sesuai deskripsi layanan, brief client, dan standar profesional bidang kreatif seperti fotografi, videografi, editing, event, product shoot, dan layanan terkait."
              />
              <TermsBlock
                title="7. Withdraw Saldo"
                body="Saldo freelancer dapat diajukan untuk withdraw melalui metode e-wallet yang tersedia. Dalam mode sandbox/proyek kuliah, withdraw hanya berupa simulasi status Sedang Diproses dan tidak memindahkan uang sungguhan."
              />
              <TermsBlock
                title="8. Penyalahgunaan"
                body="MediaVault dapat membatasi akses freelancer jika ditemukan data palsu, spam, penipuan, komunikasi tidak pantas, atau upaya memproses transaksi di luar alur platform tanpa persetujuan client."
              />
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#D8DEE8] pt-5 dark:border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setTermsOpen(false)}
                className="px-5 py-3 border border-[#D8DEE8] text-[#111827] rounded-lg font-bold hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#888888] dark:text-white dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((current) => ({ ...current, agreed: true }));
                  setTermsOpen(false);
                }}
                className="px-5 py-3 bg-[#D9A900] text-[#111827] rounded-lg font-bold dark:bg-[#F5C800] dark:text-black"
              >
                Saya Setuju
              </button>
            </div>
          </div>
        </div>
      )}
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
