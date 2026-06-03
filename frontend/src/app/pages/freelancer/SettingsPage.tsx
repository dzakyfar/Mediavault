import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, LocateFixed, Plus, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ChangePasswordCard from '../../components/dashboard/ChangePasswordCard';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import DraggableLocationMap from '../../components/dashboard/DraggableLocationMap';
import LanguagePreferenceCard from '../../components/dashboard/LanguagePreferenceCard';
import PhoneInput from '../../components/dashboard/PhoneInput';
import SearchableRegionSelect from '../../components/dashboard/SearchableRegionSelect';
import SmoothToast from '../../components/dashboard/SmoothToast';
import TelegramNotificationCard from '../../components/dashboard/TelegramNotificationCard';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PORTFOLIO_IMAGE_MAX_BYTES, validateImageFile } from '../../lib/uploadLimits';
import { uploadFileToS3 } from '../../lib/s3Upload';
import { apiRequest } from '../../lib/api';
import {
  fetchRegionOptions,
  fallbackPostalCodeForCity,
  findExactRegionByName,
  findRegionByName,
  geocodeIndonesianAddress,
  getCurrentPosition,
  RegionOption,
} from '../../lib/indonesiaRegions';

interface Offering {
  id: string;
  title: string;
  serviceType: string;
  ratePerHour: number;
  ratePerHourFormatted: string;
  ratePerPhoto: number | null;
  ratePerPhotoFormatted: string | null;
  extraPersonFee: number;
  extraPersonFeeFormatted: string;
  estimatedHours: number;
  capacityPersons: number | null;
  relatedSpecs: string[];
  isActive: boolean;
}

interface PortfolioItem {
  id: string;
  title: string;
  category: string | null;
  serviceType: string | null;
  description: string | null;
  fileUrl: string | null;
  fileKey?: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
}

const serviceOptions = ['Fotografi', 'Videografi', 'Editing', 'Photo + Video', 'Drone', 'Commercial'];
const tagOptions = ['Fotografi', 'Videografi', 'Editing', 'Wedding', 'Commercial', 'Event', 'Product Shoot', 'Pre-wedding'];
const offeringTemplates = [
  {
    label: 'Fotografi Event',
    serviceType: 'Fotografi',
    title: 'Fotografi Event',
    ratePerHour: '150000',
    ratePerPhoto: '25000',
    extraPersonFee: '75000',
    estimatedHours: '3',
    capacityPersons: '2',
    relatedSpecs: ['Fotografi', 'Event'],
  },
  {
    label: 'Videografi',
    serviceType: 'Videografi',
    title: 'Videografi Dokumentasi',
    ratePerHour: '200000',
    ratePerPhoto: '',
    extraPersonFee: '100000',
    estimatedHours: '4',
    capacityPersons: '3',
    relatedSpecs: ['Videografi', 'Commercial'],
  },
  {
    label: 'Editing',
    serviceType: 'Editing',
    title: 'Editing Foto / Video',
    ratePerHour: '100000',
    ratePerPhoto: '15000',
    extraPersonFee: '0',
    estimatedHours: '2',
    capacityPersons: '1',
    relatedSpecs: ['Editing'],
  },
];

export default function FreelancerSettings() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    district: '',
    village: '',
    postalCode: '',
    addressDetail: '',
    latitude: '',
    longitude: '',
    locationSource: 'manual',
    avatarUrl: '',
    specialty: '',
    bio: '',
    startingPrice: '',
    isAvailable: true,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [portfolioSaving, setPortfolioSaving] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    category: '',
    serviceType: '',
    description: '',
    fileUrl: '',
    previewUrl: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
  });
  const [offeringSaving, setOfferingSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationWarning, setLocationWarning] = useState('');
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
  const [customTag, setCustomTag] = useState('');
  const [offeringForm, setOfferingForm] = useState({
    serviceType: 'Fotografi',
    customServiceType: '',
    title: '',
    ratePerHour: '',
    ratePerPhoto: '',
    extraPersonFee: '',
    estimatedHours: '2',
    capacityPersons: '1',
    relatedSpecs: [] as string[],
    description: '',
  });
  useEffect(() => {
    if (!user) return;
    setFormData((current) => ({
      ...current,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      city: user.city || '',
      province: user.province || '',
      district: user.district || '',
      village: user.village || '',
      postalCode: user.postalCode || '',
      addressDetail: user.addressDetail || '',
      latitude: user.latitude ? String(user.latitude) : '',
      longitude: user.longitude ? String(user.longitude) : '',
      locationSource: user.locationSource || 'manual',
      avatarUrl: user.avatarKey || user.avatarUrl || '',
      specialty: user.specialty || '',
      bio: user.bio || '',
      startingPrice: user.startingPrice ? String(user.startingPrice) : '',
      isAvailable: user.isAvailable ?? true,
      accountHolder: user.fullName,
    }));
    setOfferingForm((current) => ({
      ...current,
      ratePerHour: current.ratePerHour || (user.startingPrice ? String(user.startingPrice) : ''),
    }));
    setAvatarPreview(user.avatarUrl || '');
  }, [user]);

  useEffect(() => {
    let active = true;
    setRegionLoading((current) => ({ ...current, provinces: true }));
    fetchRegionOptions('/provinces.json')
      .then((items) => {
        if (!active) return;
        setProvinces(items);
        const match = findRegionByName(items, formData.province);
        if (match) setSelectedProvinceId(match.id);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data provinsi gagal dimuat. Coba refresh halaman.', 'Province data failed to load. Please refresh the page.'));
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
        const match = findRegionByName(items, formData.city);
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
        const match = findRegionByName(items, formData.district);
        if (match) setSelectedDistrictId(match.id);
      })
      .catch(() => {
        if (active) setLocationWarning(t('Data kecamatan gagal dimuat.', 'District data failed to load.'));
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
        if (active) setLocationWarning(t('Data desa/kelurahan gagal dimuat.', 'Village data failed to load.'));
      })
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, villages: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedDistrictId]);

  useEffect(() => {
    apiRequest<{ offerings: Offering[] }>('/offerings/mine')
      .then((response) => setOfferings(response.offerings || []))
      .catch(() => undefined);
    apiRequest<{ items: PortfolioItem[] }>('/portfolio/mine')
      .then((response) => setPortfolioItems(response.items || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!formData.province || selectedProvinceId || provinces.length === 0) return;
    const match = findRegionByName(provinces, formData.province);
    if (match) setSelectedProvinceId(match.id);
  }, [formData.province, provinces, selectedProvinceId]);

  useEffect(() => {
    if (!formData.city || selectedCityId || cities.length === 0) return;
    const match = findRegionByName(cities, formData.city);
    if (match) setSelectedCityId(match.id);
  }, [cities, formData.city, selectedCityId]);

  useEffect(() => {
    if (!formData.district || selectedDistrictId || districts.length === 0) return;
    const match = findRegionByName(districts, formData.district);
    if (match) setSelectedDistrictId(match.id);
  }, [districts, formData.district, selectedDistrictId]);

  useEffect(() => {
    if (formData.locationSource === 'share-location' || formData.locationSource === 'manual-map') return undefined;
    const query = [
      formData.addressDetail,
      formData.village,
      formData.district,
      formData.city,
      formData.province,
    ].filter(Boolean).join(', ');

    if (!query || query.length < 3) return undefined;

    const timeout = window.setTimeout(async () => {
      try {
        const result = await geocodeIndonesianAddress(`${query}, Indonesia`);
        const fallbackPostal = fallbackPostalCodeForCity(formData.city);
        setFormData((current) => {
          if (current.locationSource === 'share-location' || current.locationSource === 'manual-map') return current;
          return {
            ...current,
            latitude: result?.latitude || current.latitude,
            longitude: result?.longitude || current.longitude,
            postalCode: current.postalCode || result?.postalCode || fallbackPostal,
          };
        });
      } catch {
        const fallbackPostal = fallbackPostalCodeForCity(formData.city);
        if (fallbackPostal) {
          setFormData((current) => current.postalCode ? current : { ...current, postalCode: fallbackPostal });
        }
      }
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [formData.addressDetail, formData.city, formData.district, formData.locationSource, formData.province, formData.village]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      setStatusMessage('');
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        province: formData.province,
        district: formData.district,
        village: formData.village,
        postalCode: formData.postalCode,
        addressDetail: formData.addressDetail,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        locationSource: formData.locationSource,
        avatarUrl: formData.avatarUrl,
        specialty: formData.specialty,
        bio: formData.bio,
        startingPrice: formData.startingPrice ? Number(formData.startingPrice) : null,
        isAvailable: formData.isAvailable,
      });
      setStatusMessage(t('Profil berhasil disimpan', 'Profile saved successfully'));
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('Gagal menyimpan profil', 'Failed to save profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    navigate('/', { replace: true });
  };

  const uploadProfilePhoto = async (file?: File) => {
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }

    try {
      const uploaded = await uploadFileToS3(file, 'avatar');
      setFormData((current) => ({ ...current, avatarUrl: uploaded.key }));
      setAvatarPreview(uploaded.url);
      setToast({ message: t('Foto profil siap disimpan', 'Profile photo is ready to save'), type: 'success' });
    } catch (uploadError) {
      setToast({
        message: uploadError instanceof Error ? uploadError.message : t('Gagal upload foto profil', 'Failed to upload profile photo'),
        type: 'error',
      });
    }
  };

  const uploadPortfolioFile = async (file?: File) => {
    if (!file) return;

    const error = validateImageFile(file, PORTFOLIO_IMAGE_MAX_BYTES);
    if (error) {
      setToast({ message: error, type: 'error' });
      return;
    }

    try {
      const uploaded = await uploadFileToS3(file, 'portfolio');
      setPortfolioForm((current) => ({
        ...current,
        fileUrl: uploaded.key,
        previewUrl: uploaded.url,
        fileName: uploaded.fileName,
        fileType: uploaded.fileType,
        fileSize: uploaded.fileSize,
      }));
      setToast({ message: t('File portfolio siap disimpan', 'Portfolio file is ready to save'), type: 'success' });
    } catch (uploadError) {
      setToast({
        message: uploadError instanceof Error ? uploadError.message : t('Gagal upload portfolio', 'Failed to upload portfolio'),
        type: 'error',
      });
    }
  };

  const savePortfolioItem = async () => {
    if (!portfolioForm.title.trim()) {
      setStatusMessage(t('Judul portfolio wajib diisi.', 'Portfolio title is required.'));
      return;
    }

    if (!portfolioForm.fileUrl) {
      setStatusMessage(t('Upload file portfolio terlebih dahulu.', 'Upload a portfolio file first.'));
      return;
    }

    try {
      setPortfolioSaving(true);
      setStatusMessage('');
      const response = await apiRequest<{ item: PortfolioItem }>('/portfolio', {
        method: 'POST',
        body: JSON.stringify({
          title: portfolioForm.title,
          category: portfolioForm.category || portfolioForm.serviceType || formData.specialty || 'Portfolio',
          serviceType: portfolioForm.serviceType || portfolioForm.category || formData.specialty || null,
          description: portfolioForm.description,
          fileUrl: portfolioForm.fileUrl,
          fileName: portfolioForm.fileName,
          fileType: portfolioForm.fileType,
          fileSize: portfolioForm.fileSize,
        }),
      });
      setPortfolioItems((current) => [response.item, ...current]);
      setPortfolioForm({
        title: '',
        category: '',
        serviceType: '',
        description: '',
        fileUrl: '',
        previewUrl: '',
        fileName: '',
        fileType: '',
        fileSize: 0,
      });
      setToast({ message: t('Portofolio berhasil ditambahkan dan tampil di profil', 'Portfolio added successfully and now appears on your profile'), type: 'success' });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('Gagal menyimpan portfolio', 'Failed to save portfolio'));
    } finally {
      setPortfolioSaving(false);
    }
  };

  const deletePortfolioItem = async (id: string) => {
    try {
      await apiRequest(`/portfolio/${id}`, { method: 'DELETE' });
      setPortfolioItems((current) => current.filter((item) => item.id !== id));
      setToast({ message: t('Portofolio dihapus dari profil', 'Portfolio removed from profile'), type: 'success' });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('Gagal menghapus portfolio', 'Failed to delete portfolio'));
    }
  };

  useEffect(() => {
    if (!toast.message) return;
    const timeout = window.setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const toggleOfferingTag = (tag: string) => {
    const normalizedTag = tag.trim();
    if (!normalizedTag) return;

    setOfferingForm((current) => ({
      ...current,
      relatedSpecs: current.relatedSpecs.includes(normalizedTag)
        ? current.relatedSpecs.filter((item) => item !== normalizedTag)
        : [...current.relatedSpecs, normalizedTag],
    }));
  };

  const addCustomTag = () => {
    const normalizedTag = customTag.trim().replace(/^#/, '');
    if (!normalizedTag) return;
    setOfferingForm((current) => ({
      ...current,
      relatedSpecs: current.relatedSpecs.includes(normalizedTag)
        ? current.relatedSpecs
        : [...current.relatedSpecs, normalizedTag],
    }));
    setCustomTag('');
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
      setStatusMessage(t('Browser tidak mendukung fitur lokasi.', 'Your browser does not support location access.'));
      return;
    }

    setLocating(true);
    setStatusMessage('');
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
      let addressDetail = formData.addressDetail;

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
          setLocationWarning(t('Lokasi berhasil diambil, tapi sebagian wilayah tidak match persis. Mohon verifikasi manual.', 'Location captured, but some region details did not match exactly. Please verify manually.'));
        }
      } catch {
        addressDetail = addressDetail || `Koordinat: ${latitude}, ${longitude}`;
        setLocationWarning(t('Koordinat berhasil diambil, tetapi detail alamat perlu dilengkapi manual.', 'Coordinates captured, but address details still need to be completed manually.'));
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
        addressDetail,
        locationSource: 'share-location',
      }));
    } catch (geoError) {
      const code = Number((geoError as GeolocationPositionError)?.code || 0);
      setStatusMessage(code === 1
        ? t('Izin lokasi ditolak. Aktifkan permission lokasi browser atau isi manual.', 'Location permission was denied. Enable browser location permission or fill the address manually.')
        : t('Gagal mengambil lokasi. Coba lagi atau isi alamat manual.', 'Failed to get location. Try again or fill the address manually.'));
    } finally {
      setLocating(false);
    }
  };

  const saveOffering = async () => {
    try {
      setOfferingSaving(true);
      setStatusMessage('');
      const serviceType = offeringForm.serviceType === 'Lainnya'
        ? offeringForm.customServiceType.trim()
        : offeringForm.serviceType;
      const parsedRatePerHour = Number(offeringForm.ratePerHour);
      const parsedEstimatedHours = Number(offeringForm.estimatedHours || 1);

      if (!serviceType) {
        setStatusMessage(t('Jenis jasa wajib diisi.', 'Service type is required.'));
        return;
      }

      if (!Number.isFinite(parsedRatePerHour) || parsedRatePerHour < 1) {
        setStatusMessage(t('Isi Harga Per Jam minimal Rp 1.', 'Hourly rate must be at least Rp 1.'));
        return;
      }

      if (!Number.isFinite(parsedEstimatedHours) || parsedEstimatedHours < 1) {
        setStatusMessage(t('Pilih estimasi durasi minimal 1 jam.', 'Estimated duration must be at least 1 hour.'));
        return;
      }

      const response = await apiRequest<{ offering: Offering }>('/offerings', {
        method: 'POST',
        body: JSON.stringify({
          serviceType,
          title: offeringForm.title || serviceType,
          price: parsedRatePerHour,
          ratePerHour: parsedRatePerHour,
          ratePerPhoto: offeringForm.ratePerPhoto ? Number(offeringForm.ratePerPhoto) : null,
          extraPersonFee: Number(offeringForm.extraPersonFee || 0),
          estimatedHours: parsedEstimatedHours,
          capacityPersons: Number(offeringForm.capacityPersons || 1),
          relatedSpecs: offeringForm.relatedSpecs,
          benefits: offeringForm.description,
          description: offeringForm.description,
        }),
      });
      setOfferings((current) => [response.offering, ...current]);
      setOfferingForm({
        serviceType: 'Fotografi',
        customServiceType: '',
        title: '',
        ratePerHour: '',
        ratePerPhoto: '',
        extraPersonFee: '',
        estimatedHours: '2',
        capacityPersons: '1',
        relatedSpecs: [],
        description: '',
      });
      setToast({ message: t('Jasa berhasil ditambahkan', 'Service added successfully'), type: 'success' });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('Gagal menyimpan jasa', 'Failed to save service'));
    } finally {
      setOfferingSaving(false);
    }
  };

  const deleteOffering = async (offeringId: string) => {
    try {
      await apiRequest(`/offerings/${offeringId}`, { method: 'DELETE' });
      setOfferings((current) => current.filter((offering) => offering.id !== offeringId));
      setToast({ message: t('Jasa dinonaktifkan', 'Service disabled'), type: 'success' });
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : t('Gagal menghapus jasa', 'Failed to delete service'));
    }
  };

  return (
    <DashboardLayout userType="freelancer">
      <SmoothToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmDialog
        open={showDeleteDialog}
        title={t('Hapus Akun', 'Delete Account')}
        description={t('Akun freelancer dan data terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.', 'Your freelancer account and related data will be permanently deleted. This action cannot be undone.')}
        confirmLabel={t('Hapus Akun', 'Delete Account')}
        danger
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
      />
      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        {t('Pengaturan Akun', 'Account Settings')}
      </h1>

      <div className="space-y-6 max-w-4xl">
        {statusMessage && (
          <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl text-[#F5C800]">
            {statusMessage}
          </div>
        )}

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Profil', 'Profile')}
          </h2>

          <div className="mb-6">
            <label className="block text-sm text-[#888888] mb-2">{t('Foto Profil', 'Profile Photo')}</label>
            <div className="flex items-center gap-4">
              <UserAvatar name={formData.fullName} src={avatarPreview} className="h-20 w-20 text-2xl" />
              <label className="px-4 py-2 bg-[#141414] border border-[#2A2A2A] rounded-lg hover:border-[#F5C800] transition-colors cursor-pointer inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                {t('Upload Foto', 'Upload Photo')}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(event) => uploadProfilePhoto(event.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Nama Lengkap', 'Full Name')}</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Nomor Telepon', 'Phone Number')}</label>
              <PhoneInput
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Kota', 'City')}</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-60"
          >
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan Perubahan', 'Save Changes')}
          </button>
        </div>

        <LanguagePreferenceCard />

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Alamat Freelancer', 'Freelancer Address')}
              </h2>
              <p className="text-sm text-[#888888]">{t('Dipakai sebagai titik awal estimasi transportasi saat client memesan.', 'Used as the starting point for transport estimation when clients place an order.')}</p>
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors disabled:opacity-60"
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

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <SearchableRegionSelect
              label={t('Provinsi', 'Province')}
              placeholder={regionLoading.provinces ? t('Memuat provinsi...', 'Loading provinces...') : t('Ketik nama provinsi', 'Type province name')}
              value={formData.province}
              options={provinces}
              disabled={regionLoading.provinces}
              onChange={(value) => selectProvince(findExactRegionByName(provinces, value), value)}
              onSelect={selectProvince}
            />
            <SearchableRegionSelect
              label={t('Kabupaten/Kota', 'City/Regency')}
              placeholder={!selectedProvinceId ? t('Pilih provinsi dulu', 'Select a province first') : regionLoading.cities ? t('Memuat kota/kabupaten...', 'Loading cities/regencies...') : t('Ketik kota/kabupaten', 'Type city/regency')}
              value={formData.city}
              options={cities}
              disabled={!selectedProvinceId || regionLoading.cities}
              onChange={(value) => selectCity(findExactRegionByName(cities, value), value)}
              onSelect={selectCity}
            />
            <SearchableRegionSelect
              label={t('Kecamatan', 'District')}
              placeholder={!selectedCityId ? t('Pilih kota/kabupaten dulu', 'Select a city/regency first') : regionLoading.districts ? t('Memuat kecamatan...', 'Loading districts...') : t('Ketik kecamatan', 'Type district')}
              value={formData.district}
              options={districts}
              disabled={!selectedCityId || regionLoading.districts}
              onChange={(value) => selectDistrict(findExactRegionByName(districts, value), value)}
              onSelect={selectDistrict}
            />
            <SearchableRegionSelect
              label={t('Desa/Kelurahan', 'Village/Subdistrict')}
              placeholder={!selectedDistrictId ? t('Pilih kecamatan dulu', 'Select a district first') : regionLoading.villages ? t('Memuat desa/kelurahan...', 'Loading villages/subdistricts...') : t('Ketik desa/kelurahan', 'Type village/subdistrict')}
              value={formData.village}
              options={villages}
              disabled={!selectedDistrictId || regionLoading.villages}
              onChange={(value) => selectVillage(findExactRegionByName(villages, value), value)}
              onSelect={selectVillage}
            />
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Kode Pos', 'Postal Code')}</label>
              <input
                type="number"
                value={formData.postalCode}
                onChange={(event) => setFormData({ ...formData, postalCode: event.target.value, locationSource: 'manual' })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Koordinat', 'Coordinates')}</label>
              <input
                value={formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : ''}
                readOnly
                placeholder={t('Terisi otomatis dari lokasi', 'Filled automatically from location')}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-[#888888] placeholder-[#888888] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#888888] mb-2">{t('Detail Alamat', 'Address Details')}</label>
              <textarea
                value={formData.addressDetail}
                onChange={(event) => setFormData({ ...formData, addressDetail: event.target.value, locationSource: 'manual' })}
                rows={3}
                placeholder={t('Nama jalan, nomor, gedung, patokan', 'Street name, number, building, landmark')}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <DraggableLocationMap
                latitude={formData.latitude}
                longitude={formData.longitude}
                fallbackQuery={[formData.addressDetail, formData.village, formData.district, formData.city, formData.province, formData.postalCode].filter(Boolean).join(', ')}
                onChange={(latitude, longitude) => setFormData((current) => ({
                  ...current,
                  latitude,
                  longitude,
                  locationSource: 'manual-map',
                }))}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-60"
          >
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan Alamat', 'Save Address')}
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Info Profesional', 'Professional Info')}
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Spesialisasi', 'Specialization')}</label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Harga Mulai (Rp)', 'Starting Price (Rp)')}</label>
              <input
                type="number"
                value={formData.startingPrice}
                onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <label className="flex items-center justify-between gap-4 p-4 bg-[#141414] border border-[#2A2A2A] rounded-lg cursor-pointer">
              <div>
                <div className="font-bold text-white">{t('Tersedia untuk job baru', 'Available for new jobs')}</div>
                <div className="text-sm text-[#888888]">{t('Jika dimatikan, profil tidak muncul saat filter hanya yang tersedia aktif.', 'If disabled, your profile will not appear when clients filter for available freelancers only.')}</div>
              </div>
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                className="w-5 h-5 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#F5C800]"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-60"
          >
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan Perubahan', 'Save Changes')}
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Rekening Bank', 'Bank Account')}
          </h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Nama Bank', 'Bank Name')}</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">{t('Nomor Rekening', 'Account Number')}</label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#888888] mb-2">{t('Nama Pemilik Rekening', 'Account Holder Name')}</label>
              <input
                type="text"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
          </div>

          <button className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
            {t('Simpan Perubahan', 'Save Changes')}
          </button>
        </div>

        <ChangePasswordCard onNotify={(message, type) => setToast({ message, type })} />

        <TelegramNotificationCard onNotify={(message, type) => setToast({ message, type })} />

        <div className="bg-[#1A1A1A] border border-[#EF4444]/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-[#EF4444]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Area Berisiko', 'Danger Zone')}
          </h2>
          <p className="text-[#888888] mb-6">
            {t('Jika akun dihapus, data akun tidak bisa dipulihkan. Pastikan keputusan ini sudah benar.', 'If this account is deleted, account data cannot be restored. Make sure this decision is final.')}
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="px-6 py-3 border-2 border-[#EF4444] text-[#EF4444] font-bold rounded-lg hover:bg-[#EF4444] hover:text-white transition-all"
          >
            {t('Hapus Akun', 'Delete Account')}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
