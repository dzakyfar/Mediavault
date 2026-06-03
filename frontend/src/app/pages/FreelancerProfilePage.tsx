import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useParams } from 'react-router';
import { Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, Film, Images, LocateFixed, MapPin, MessageCircle, RefreshCcw, Star, Users, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import UserAvatar from '../components/UserAvatar';
import DraggableLocationMap from '../components/dashboard/DraggableLocationMap';
import SearchableRegionSelect from '../components/dashboard/SearchableRegionSelect';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiRequest } from '../lib/api';
import {
  fallbackPostalCodeForCity,
  fetchRegionOptions,
  findExactRegionByName,
  findRegionByName,
  getCurrentPosition,
  RegionOption,
} from '../lib/indonesiaRegions';

interface Offering {
  id: string;
  title: string;
  serviceType: string;
  price: number;
  priceFormatted: string;
  ratePerHour: number;
  ratePerHourFormatted: string;
  ratePerPhoto: number | null;
  ratePerPhotoFormatted: string | null;
  extraPersonFee: number;
  extraPersonFeeFormatted: string;
  estimatedHours: number;
  description: string | null;
  benefits: string[];
  toolsSpec: string | null;
  capacityPersons: number | null;
  relatedSpecs: string[];
}

interface PaymentDetail {
  id: string;
  projectId: string;
  klikqrisOrderId: string;
  amountRequestFormatted: string;
  gatewayAdjustment: number;
  gatewayAdjustmentFormatted: string;
  baseAmountFormatted: string;
  adminFeeClientFormatted: string;
  totalAmountFormatted: string;
  qrisUrl: string | null;
  directUrl: string | null;
  signature?: string;
  isSandbox?: boolean;
  status: string;
  expiredAt: string | null;
}

interface WalletSummary {
  balance: number;
  balanceFormatted: string;
}

interface FreelancerProfile {
  id: string;
  name: string;
  fullName: string;
  avatarUrl?: string | null;
  specialty: string;
  services: string[];
  serviceTags: string[];
  maxTeamCapacity: number;
  bio: string;
  rating: string | null;
  reviewCount: number;
  price: string;
  city: string;
  province: string | null;
  district: string | null;
  village: string | null;
  postalCode: string | null;
  addressDetail: string | null;
  latitude: number | null;
  longitude: number | null;
  available: boolean;
  portfolioItems: Array<{
    id: string;
    title: string;
    category: string | null;
    serviceType: string | null;
    description: string | null;
    fileUrl: string | null;
    fileType?: string | null;
    media?: Array<{
      id?: string;
      fileUrl: string;
      fileKey?: string | null;
      fileName?: string | null;
      fileType?: string | null;
      fileSize?: number | null;
    }>;
    images?: Array<{
      id?: string;
      fileUrl: string;
      fileName?: string | null;
    }>;
  }>;
  offerings: Offering[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

type PortfolioItem = FreelancerProfile['portfolioItems'][number];

const getPortfolioMedia = (item: PortfolioItem) => {
  if (item.media?.length) return item.media;
  if (item.images?.length) return item.images.map((image) => ({ ...image, fileType: 'image/jpeg' }));
  return item.fileUrl ? [{
    fileUrl: item.fileUrl,
    fileName: item.title,
    fileType: item.fileType || 'image/jpeg',
  }] : [];
};

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => currency.format(amount || 0).replace(/\s/g, ' ');

const describeOffering = (offering: Offering) => [
  offering.description,
  ...(offering.benefits || []).map((benefit) => `- ${benefit}`),
].filter(Boolean).join('\n');

const normalizeFreelancerProfile = (freelancer: Partial<FreelancerProfile>): FreelancerProfile => {
  const offerings = freelancer.offerings || [];
  const offeringServices = offerings.map((offering) => offering.serviceType || offering.title).filter(Boolean);
  const derivedTags = [
    ...offeringServices,
    ...offerings.flatMap((offering) => offering.relatedSpecs || []),
  ].filter(Boolean);

  return {
    ...freelancer,
    id: freelancer.id || '',
    name: freelancer.name || freelancer.fullName || 'Freelancer',
    fullName: freelancer.fullName || freelancer.name || 'Freelancer',
    avatarUrl: freelancer.avatarUrl || null,
    specialty: freelancer.specialty || 'Jasa kreatif',
    services: (freelancer.services?.length ? freelancer.services : [...new Set(offeringServices)]) || [],
    serviceTags: [...new Set(freelancer.serviceTags?.length ? freelancer.serviceTags : derivedTags)],
    maxTeamCapacity: freelancer.maxTeamCapacity || 1,
    bio: freelancer.bio || 'Profile freelancer belum dilengkapi.',
    rating: freelancer.rating ?? null,
    reviewCount: freelancer.reviewCount || 0,
    price: freelancer.price || 'Rp 0',
    city: freelancer.city || '-',
    province: freelancer.province || null,
    district: freelancer.district || null,
    village: freelancer.village || null,
    postalCode: freelancer.postalCode || null,
    addressDetail: freelancer.addressDetail || null,
    latitude: freelancer.latitude ?? null,
    longitude: freelancer.longitude ?? null,
    available: freelancer.available ?? true,
    portfolioItems: freelancer.portfolioItems || [],
    offerings,
    reviews: freelancer.reviews || [],
  };
};

const distanceInKm = (originLat: number, originLon: number, destinationLat: number, destinationLon: number) => {
  const radius = 6371;
  const toRadians = (degree: number) => degree * (Math.PI / 180);
  const deltaLat = toRadians(destinationLat - originLat);
  const deltaLon = toRadians(destinationLon - originLon);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(originLat)) * Math.cos(toRadians(destinationLat))
    * Math.sin(deltaLon / 2) ** 2;

  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function FreelancerProfilePage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orderError, setOrderError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [selectedPortfolioImageIndex, setSelectedPortfolioImageIndex] = useState(0);
  const [selectedOfferingId, setSelectedOfferingId] = useState('');
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
  const [orderData, setOrderData] = useState({
    serviceType: '',
    needType: '',
    description: '',
    personsCount: '1',
    rentalHours: '',
    eventDate: '',
    deadline: '',
    province: '',
    city: '',
    district: '',
    village: '',
    postalCode: '',
    addressDetail: '',
    latitude: '',
    longitude: '',
    locationSource: 'manual',
  });

  const isOwnProfile = Boolean(user && freelancer && user.id === freelancer.id);

  const currentOffering = useMemo(() => {
    if (!freelancer) return null;
    return freelancer.offerings.find((offering) => offering.id === selectedOfferingId)
      || freelancer.offerings.find((offering) => offering.serviceType === orderData.serviceType)
      || freelancer.offerings[0]
      || null;
  }, [freelancer, orderData.serviceType, selectedOfferingId]);
  const maxPersons = currentOffering?.capacityPersons || freelancer?.maxTeamCapacity || 1;
  const selectedPortfolioMedia = useMemo(() => {
    if (!selectedPortfolio) return [];
    return getPortfolioMedia(selectedPortfolio);
  }, [selectedPortfolio]);
  const selectedPortfolioMediaItem = selectedPortfolioMedia[selectedPortfolioImageIndex] || null;

  useEffect(() => {
    if (!currentOffering) return;
    setOrderData((current) => ({
      ...current,
      serviceType: current.serviceType || currentOffering.serviceType || currentOffering.title,
      needType: current.needType || currentOffering.title,
      description: current.description || describeOffering(currentOffering),
      rentalHours: current.rentalHours || String(currentOffering.estimatedHours || 1),
    }));
  }, [currentOffering]);

  useEffect(() => {
    setSelectedPortfolioImageIndex(0);
  }, [selectedPortfolio]);

  useEffect(() => {
    if (!selectedPortfolio) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPortfolio(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedPortfolio]);

  useEffect(() => {
    let active = true;
    setRegionLoading((current) => ({ ...current, provinces: true }));
    fetchRegionOptions('/provinces.json')
      .then((items) => {
        if (active) setProvinces(items);
      })
      .catch(() => setOrderError('Data wilayah Indonesia gagal dimuat. Coba refresh halaman.'))
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
      .catch(() => setOrderError('Data kota/kabupaten gagal dimuat.'))
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, cities: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!orderData.province || selectedProvinceId || provinces.length === 0) return;
    const match = findRegionByName(provinces, orderData.province);
    if (match) setSelectedProvinceId(match.id);
  }, [orderData.province, provinces, selectedProvinceId]);

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
      .catch(() => setOrderError('Data kecamatan gagal dimuat.'))
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, districts: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedCityId]);

  useEffect(() => {
    if (!orderData.city || selectedCityId || cities.length === 0) return;
    const match = findRegionByName(cities, orderData.city);
    if (match) setSelectedCityId(match.id);
  }, [cities, orderData.city, selectedCityId]);

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
      .catch(() => setOrderError('Data desa/kelurahan gagal dimuat.'))
      .finally(() => {
        if (active) setRegionLoading((current) => ({ ...current, villages: false }));
      });
    return () => {
      active = false;
    };
  }, [selectedDistrictId]);

  useEffect(() => {
    if (!orderData.district || selectedDistrictId || districts.length === 0) return;
    const match = findRegionByName(districts, orderData.district);
    if (match) setSelectedDistrictId(match.id);
  }, [districts, orderData.district, selectedDistrictId]);

  const applyOfferingToOrder = (offering: Offering) => {
    setSelectedOfferingId(offering.id);
    setOrderError('');
    setOrderData((current) => ({
      ...current,
      serviceType: offering.serviceType || offering.title,
      needType: offering.title,
      description: describeOffering(offering) || current.description,
      personsCount: String(Math.min(Number(current.personsCount) || 1, offering.capacityPersons || freelancer?.maxTeamCapacity || 1)),
      rentalHours: String(offering.estimatedHours || 1),
    }));
  };

  const selectProvince = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedProvinceId(option?.id || '');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setCities([]);
    setDistricts([]);
    setVillages([]);
    setOrderData((current) => ({
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
    setOrderData((current) => ({
      ...current,
      city: name,
      district: '',
      village: '',
      postalCode: fallbackPostalCodeForCity(name),
      locationSource: 'manual',
    }));
  };

  const selectDistrict = (option: RegionOption | null, name = option?.name || '') => {
    setSelectedDistrictId(option?.id || '');
    setVillages([]);
    setOrderData((current) => ({
      ...current,
      district: name,
      village: '',
      locationSource: 'manual',
    }));
  };

  const selectVillage = (option: RegionOption | null, name = option?.name || '') => {
    setOrderData((current) => ({
      ...current,
      village: name,
      locationSource: 'manual',
    }));
  };

  const useProfileAddress = () => {
    if (!user?.province || !user?.city || !user?.district || !user?.village || !user?.addressDetail) {
      setOrderError('Alamat profile belum lengkap. Lengkapi di Settings atau isi manual di form ini.');
      return;
    }

    const provinceMatch = findRegionByName(provinces, user.province);
    setSelectedProvinceId(provinceMatch?.id || '');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setOrderData((current) => ({
      ...current,
      province: user.province || '',
      city: user.city || '',
      district: user.district || '',
      village: user.village || '',
      postalCode: user.postalCode || fallbackPostalCodeForCity(user.city || ''),
      addressDetail: user.addressDetail || '',
      latitude: user.latitude != null ? String(user.latitude) : current.latitude,
      longitude: user.longitude != null ? String(user.longitude) : current.longitude,
      locationSource: 'profile',
    }));
    setOrderError('');
  };

  const costSummary = useMemo(() => {
    const persons = Math.max(1, Number(orderData.personsCount) || 1);
    const ratePerHour = currentOffering?.ratePerHour || 0;
    const rentalHours = Math.max(1, Number(orderData.rentalHours) || currentOffering?.estimatedHours || 1);
    const serviceFee = ratePerHour * rentalHours;
    const extraPersonFee = Math.max(0, persons - 1) * (currentOffering?.extraPersonFee || 0);
    const clientLat = Number(orderData.latitude);
    const clientLon = Number(orderData.longitude);
    const freelancerLat = Number(freelancer?.latitude);
    const freelancerLon = Number(freelancer?.longitude);
    const hasCoordinateDistance = freelancer?.latitude != null && freelancer.longitude != null
      && orderData.latitude !== '' && orderData.longitude !== ''
      && Number.isFinite(freelancerLat) && Number.isFinite(freelancerLon)
      && Number.isFinite(clientLat) && Number.isFinite(clientLon);
    const distanceKm = hasCoordinateDistance
      ? Math.ceil(distanceInKm(freelancerLat, freelancerLon, clientLat, clientLon))
      : orderData.city && freelancer?.city && freelancer.city !== '-'
        ? (orderData.city.toLowerCase() === freelancer.city.toLowerCase() ? 8 : 18)
        : 10;
    const transportFee = Math.max(0, Math.ceil(distanceKm - 10)) * 1;
    const subtotal = serviceFee + extraPersonFee + transportFee;
    const adminFee = Math.round(subtotal * 0.01);
    const total = subtotal + adminFee;

    return {
      persons,
      rentalHours,
      distanceKm,
      serviceFee,
      extraPersonFee,
      transportFee,
      adminFee,
      subtotal,
      total,
      ready: Boolean(
        orderData.serviceType &&
        orderData.needType &&
        orderData.description &&
        orderData.rentalHours &&
        orderData.eventDate &&
        orderData.deadline &&
        orderData.province &&
        orderData.city &&
        orderData.district &&
        orderData.village &&
        orderData.postalCode &&
        orderData.addressDetail &&
        subtotal > 0 &&
        persons <= maxPersons
      ),
    };
  }, [currentOffering, freelancer?.city, freelancer?.latitude, freelancer?.longitude, maxPersons, orderData]);

  const orderBlockingReason = useMemo(() => {
    if (isOwnProfile) return 'Profile sendiri tidak bisa dipesan.';
    if (costSummary.persons > maxPersons) return `Jumlah orang melebihi kapasitas maksimal ${maxPersons} orang.`;
    if (!orderData.serviceType) return 'Pilih jenis jasa.';
    if (!orderData.needType) return 'Isi jenis kebutuhan.';
    if (!orderData.description) return 'Isi deskripsi kebutuhan.';
    if (!orderData.rentalHours) return 'Pilih berapa jam jasa akan disewa.';
    if (!orderData.eventDate || !orderData.deadline) return 'Isi tanggal pemesanan dan deadline.';
    if (!orderData.province || !orderData.city || !orderData.district || !orderData.village || !orderData.postalCode || !orderData.addressDetail) {
      return 'Lengkapi alamat client.';
    }
    if (costSummary.subtotal <= 0) return 'Biaya belum bisa dihitung. Cek rate jasa freelancer.';
    return '';
  }, [costSummary.persons, costSummary.subtotal, isOwnProfile, maxPersons, orderData]);

  useEffect(() => {
    if (!id) return;
    apiRequest<{ freelancer: FreelancerProfile }>(`/freelancers/${id}`, { auth: false })
      .then((response) => {
        const nextFreelancer = normalizeFreelancerProfile(response.freelancer);
        const initialOffering = nextFreelancer.offerings[0] || null;
        setFreelancer(nextFreelancer);
        setSelectedOfferingId(initialOffering?.id || '');
        setOrderData((current) => ({
          ...current,
          serviceType: initialOffering?.serviceType || nextFreelancer.services[0] || '',
          needType: initialOffering?.title || '',
          description: initialOffering ? describeOffering(initialOffering) : current.description,
          rentalHours: initialOffering?.estimatedHours ? String(initialOffering.estimatedHours) : current.rentalHours,
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat profile freelancer'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!paymentOpen || !payment || payment.status !== 'PENDING') return undefined;
    const interval = window.setInterval(async () => {
      try {
        const response = await apiRequest<{ payment: PaymentDetail }>(`/payments/${payment.klikqrisOrderId}/status`);
        setPayment(response.payment);
      } catch (err) {
        setOrderError(err instanceof Error ? err.message : 'Gagal memperbarui status pembayaran');
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [payment, paymentOpen]);

  useEffect(() => {
    if (!paymentOpen || payment?.status !== 'PAID') return;
    const timeout = window.setTimeout(() => {
      navigate(`/dashboard/client/payments/${payment.id}`);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [navigate, payment, paymentOpen]);

  const useCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setOrderError('Browser tidak mendukung fitur lokasi.');
      return;
    }

    setLocating(true);
    setOrderError('');

    try {
      const position = await getCurrentPosition({ enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
      const latitude = String(position.coords.latitude);
      const longitude = String(position.coords.longitude);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`,
          { headers: { Accept: 'application/json' } }
        );
        const payload = await response.json();
        const address = payload.address || {};
        const provinceName = address.state || address.region || '';
        const cityName = address.city || address.town || address.county || address.city_district || '';
        const districtName = address.suburb || address.city_district || address.municipality || '';
        const villageName = address.village || address.neighbourhood || address.hamlet || address.suburb || '';

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

        setSelectedProvinceId(provinceMatch?.id || '');
        setSelectedCityId(cityMatch?.id || '');
        setSelectedDistrictId(districtMatch?.id || '');
        setCities(cityOptions);
        setDistricts(districtOptions);
        setVillages(villageOptions);

        setOrderData((current) => ({
          ...current,
          latitude,
          longitude,
          province: provinceMatch?.name || provinceName || current.province,
          city: cityMatch?.name || cityName || current.city,
          district: districtMatch?.name || districtName || current.district,
          village: villageMatch?.name || villageName || current.village,
          postalCode: address.postcode || current.postalCode,
          addressDetail: [address.road, address.house_number, address.building].filter(Boolean).join(' ')
            || payload.display_name
            || current.addressDetail,
          locationSource: 'share-location',
        }));
      } catch {
        setOrderData((current) => ({
          ...current,
          latitude,
          longitude,
          addressDetail: current.addressDetail || `Koordinat: ${latitude}, ${longitude}`,
          locationSource: 'share-location',
        }));
      }
    } catch {
      setOrderError('Izin lokasi ditolak atau lokasi tidak tersedia. Silakan isi manual.');
    } finally {
      setLocating(false);
    }
  };

  const openOrderReview = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isOwnProfile) {
      setOrderError('Tidak bisa memesan jasa dari profile sendiri');
      return;
    }

    if (!costSummary.ready) {
      setOrderError('Lengkapi semua field sebelum memesan.');
      return;
    }

    setOrderError('');
    setReviewOpen(true);
    apiRequest<{ wallet: WalletSummary }>('/wallet/me')
      .then((response) => setWalletSummary(response.wallet))
      .catch(() => setWalletSummary(null));
  };

  const createOrderProject = async () => {
    if (!id) return;
    const address = [
      orderData.addressDetail,
      orderData.village,
      orderData.district,
      orderData.city,
      orderData.province,
      orderData.postalCode,
    ].filter(Boolean).join(', ');

    return apiRequest<{ projectId: string }>(`/freelancers/${id}/order`, {
      method: 'POST',
      body: JSON.stringify({
        ...orderData,
        offeringId: currentOffering?.id || selectedOfferingId || undefined,
        title: `${orderData.serviceType} - ${orderData.needType}`,
        budget: costSummary.subtotal,
        address,
      }),
    });
  };

  const submitOrder = async (method: 'qris' | 'wallet' = 'qris') => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isOwnProfile) {
      setOrderError('Tidak bisa memesan jasa dari profile sendiri');
      return;
    }

    if (!costSummary.ready) {
      setOrderError('Lengkapi semua field sebelum memesan.');
      return;
    }

    if (method === 'qris' && payment?.status === 'PENDING') {
      setOrderError('');
      setReviewOpen(false);
      setPaymentOpen(true);
      return;
    }

    try {
      setSubmitting(true);
      setOrderError('');
      const orderResponse = await createOrderProject();
      if (!orderResponse?.projectId) throw new Error('Project gagal dibuat');
      const paymentResponse = await apiRequest<{ payment: PaymentDetail }>(
        method === 'wallet'
          ? `/payments/projects/${orderResponse.projectId}/pay-with-wallet`
          : `/payments/projects/${orderResponse.projectId}/create`,
        { method: 'POST' }
      );
      setPayment(paymentResponse.payment);
      setReviewOpen(false);
      if (method === 'wallet') {
        navigate(`/dashboard/client/payments/${paymentResponse.payment.id}`);
      } else {
        setPaymentOpen(true);
      }
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Gagal memesan jasa');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mv-no-page-transform min-h-screen bg-[#0A0A0A] text-white mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/explore" className="text-[#888888] hover:text-[#F5C800] transition-colors">
          {t('Kembali ke explore', 'Back to explore')}
        </Link>

        {loading && (
          <div className="mt-8">
            <EmptyState title={t('Memuat profil', 'Loading profile')} description={t('Menyiapkan detail freelancer untuk Anda.', 'Preparing freelancer details for you.')} />
          </div>
        )}

        {error && !freelancer && (
          <div className="mt-8">
            <EmptyState title="Profile tidak ditemukan" description={error} />
          </div>
        )}

        {freelancer && (
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <div className="flex items-start gap-6">
                  <UserAvatar name={freelancer.fullName} src={freelancer.avatarUrl} className="h-28 w-28 text-4xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{freelancer.fullName}</h1>
                        <p className="text-[#888888]">{freelancer.specialty}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${freelancer.available ? 'bg-[#22C55E] text-white' : 'bg-[#888888] text-white'}`}>
                        {freelancer.available ? t('Tersedia', 'Available') : t('Sibuk', 'Busy')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#888888]">
                      <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{freelancer.city}</span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                        {freelancer.rating ?? 'Baru'}
                        {freelancer.reviewCount > 0 && <span>({freelancer.reviewCount} ulasan)</span>}
                      </span>
                      <span className="text-[#F5C800] font-bold">{t('Mulai dari', 'From')} {freelancer.price}</span>
                    </div>
                    <div className="mt-3 rounded-lg border border-[#2A2A2A] bg-[#141414] px-4 py-3 text-sm text-[#BDBDBD]">
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#F5C800]" />
                        <div>
                          <p className="font-bold text-white">{t('Alamat Freelancer', 'Freelancer Address')}</p>
                          <p>{[freelancer.addressDetail, freelancer.village, freelancer.district, freelancer.city, freelancer.province, freelancer.postalCode].filter(Boolean).join(', ') || t('Alamat detail belum dilengkapi.', 'Detailed address has not been completed yet.')}</p>
                          {freelancer.latitude != null && freelancer.longitude != null && (
                            <a
                              href={`https://www.google.com/maps?q=${freelancer.latitude},${freelancer.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-block text-[#F5C800] hover:underline"
                            >
                              {t('Lihat titik lokasi freelancer', 'View freelancer location')}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Tentang', 'About')}</h2>
                <p className="text-[#888888] leading-relaxed">{freelancer.bio}</p>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Tag Jasa</h2>
                {freelancer.serviceTags.length === 0 ? (
                  <EmptyState title={t('Belum ada tag jasa', 'No service tags yet')} description={t('Freelancer perlu menambahkan katalog jasa di halaman akun.', 'This freelancer needs to add service catalog items from their account page.')} />
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {freelancer.serviceTags.map((tag) => (
                      <span key={tag} className="shrink-0 px-4 py-2 rounded-full bg-[#F5C800]/10 border border-[#F5C800]/40 text-[#F5C800] text-sm font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Pricelist Jasa</h2>
                    <p className="text-sm text-[#888888]">Klik salah satu paket untuk mengisi form pemesanan otomatis.</p>
                  </div>
                  {freelancer.offerings.length > 0 && (
                    <span className="w-fit px-3 py-1 rounded-full bg-[#F5C800]/10 border border-[#F5C800]/40 text-[#F5C800] text-xs font-bold">
                      {freelancer.offerings.length} paket aktif
                    </span>
                  )}
                </div>

                {freelancer.offerings.length === 0 ? (
                  <EmptyState title="Pricelist belum tersedia" description="Freelancer ini belum menambahkan paket jasa dan rate." />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {freelancer.offerings.map((offering) => {
                      const isSelected = currentOffering?.id === offering.id;
                      return (
                        <button
                          key={offering.id}
                          type="button"
                          onClick={() => applyOfferingToOrder(offering)}
                          className={`group text-left rounded-xl p-5 border transition-all hover:-translate-y-1 hover:border-[#F5C800] hover:shadow-[0_16px_40px_rgba(245,200,0,0.12)] ${
                            isSelected
                              ? 'bg-[#F5C800]/10 border-[#F5C800] shadow-[0_0_0_1px_rgba(245,200,0,0.25)]'
                              : 'bg-[#141414] border-[#2A2A2A]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-[#F5C800] font-bold">{offering.serviceType || 'Jasa Kreatif'}</p>
                              <h3 className="text-xl font-bold text-white mt-1">{offering.title}</h3>
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-[#F5C800] shrink-0" />}
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[#888888]">Estimasi paket</span>
                              <span className="font-bold text-white">{offering.priceFormatted}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[#888888]">Rate utama</span>
                              <span className="text-[#F5C800] font-bold">{offering.ratePerHourFormatted}/jam</span>
                            </div>
                            {offering.ratePerPhotoFormatted && (
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[#888888]">Rate foto</span>
                                <span className="font-bold text-white">{offering.ratePerPhotoFormatted}/foto</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-[#888888]">Orang tambahan</span>
                              <span className="font-bold text-white">{offering.extraPersonFeeFormatted}/orang</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <span className="inline-flex items-center gap-2 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] px-3 py-2 text-[#CCCCCC]">
                                <Clock className="w-4 h-4 text-[#F5C800]" />
                                {offering.estimatedHours || 1} jam
                              </span>
                              <span className="inline-flex items-center gap-2 rounded-lg bg-[#0F0F0F] border border-[#2A2A2A] px-3 py-2 text-[#CCCCCC]">
                                <Users className="w-4 h-4 text-[#F5C800]" />
                                Maks. {offering.capacityPersons || freelancer.maxTeamCapacity || 1}
                              </span>
                            </div>
                          </div>

                          {offering.description && (
                            <p className="text-sm text-[#BDBDBD] leading-relaxed mt-4 line-clamp-3">{offering.description}</p>
                          )}
                          {offering.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {offering.benefits.slice(0, 3).map((benefit) => (
                                <span key={benefit} className="px-2.5 py-1 rounded-full bg-[#F5C800]/10 text-[#F5C800] text-xs">
                                  {benefit}
                                </span>
                              ))}
                            </div>
                          )}
                          {(offering.toolsSpec || offering.relatedSpecs.length > 0) && (
                            <p className="text-xs text-[#888888] mt-4">
                              {[offering.toolsSpec, ...offering.relatedSpecs].filter(Boolean).slice(0, 3).join(' • ')}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Portofolio', 'Portfolio')}</h2>
                {freelancer.portfolioItems.length === 0 ? (
                  <EmptyState title={t('Portofolio kosong', 'Empty portfolio')} description={t('Freelancer ini belum menambahkan contoh karya, tetapi profilnya tetap bisa dihubungi.', 'This freelancer has not added work samples yet, but the profile can still be contacted.')} />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {freelancer.portfolioItems.map((item) => {
                      const media = getPortfolioMedia(item);
                      const firstMedia = media[0];

                      return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedPortfolio(item)}
                        className="group bg-[#141414] rounded-lg p-4 text-left transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(245,200,0,0.12)] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/50"
                      >
                        {firstMedia ? (
                          <div className="relative mb-3 overflow-hidden rounded-lg bg-[#1A1A1A]">
                            {firstMedia.fileType?.startsWith('video/') ? (
                              <video src={firstMedia.fileUrl} className="aspect-video w-full object-cover" muted playsInline />
                            ) : (
                              <img src={firstMedia.fileUrl} alt={item.title} className="aspect-video w-full object-cover" />
                            )}
                            <div className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs text-white">
                              {firstMedia.fileType?.startsWith('video/') ? <Film className="h-3.5 w-3.5" /> : <Images className="h-3.5 w-3.5" />}
                              {media.length}
                            </div>
                            {media.length > 1 && (
                              <div className="grid grid-cols-4 gap-1 p-1">
                                {media.slice(1, 5).map((mediaItem, index) => (
                                  mediaItem.fileType?.startsWith('video/') ? (
                                    <div key={mediaItem.id || `${mediaItem.fileUrl}-${index}`} className="h-12 w-full rounded bg-black/60 flex items-center justify-center">
                                      <Film className="h-4 w-4 text-white" />
                                    </div>
                                  ) : (
                                    <img
                                      key={mediaItem.id || `${mediaItem.fileUrl}-${index}`}
                                      src={mediaItem.fileUrl}
                                      alt={`${item.title} ${index + 2}`}
                                      className="h-12 w-full rounded object-cover"
                                    />
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-[#1A1A1A] rounded-lg mb-3 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-[#888888]" />
                          </div>
                        )}
                        <h3 className="font-bold group-hover:text-[#F5C800] transition-colors">{item.title}</h3>
                        {item.category && <p className="text-sm text-[#888888]">{item.category}</p>}
                        {item.serviceType && <p className="text-sm text-[#F5C800]">{item.serviceType}</p>}
                        <p className="mt-3 text-xs text-[#888888]">Klik untuk melihat detail portfolio</p>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Ulasan', 'Reviews')}</h2>
                {freelancer.reviews.length === 0 ? (
                  <EmptyState title={t('Belum ada review', 'No reviews yet')} description={t('Rating dan ulasan client akan muncul setelah project selesai direview.', 'Client ratings and reviews will appear after completed projects are reviewed.')} />
                ) : (
                  <div className="space-y-4">
                    {freelancer.reviews.map((review) => (
                      <div key={review.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
                        <div className="flex items-center gap-2 text-[#F5C800] font-bold mb-2">
                          <Star className="w-4 h-4 fill-current" />
                          {review.rating}/5
                        </div>
                        <p className="text-white mb-2">"{review.comment}"</p>
                        <p className="text-xs text-[#888888]">
                          {new Date(review.createdAt).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 sticky top-24">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Pesan Jasa</h2>
                {isOwnProfile && (
                  <div className="mb-4 p-3 bg-[#F5C800]/10 border border-[#F5C800] rounded-lg text-[#F5C800] text-sm">
                    Ini profile Anda sendiri. Client lain tetap bisa melihat dan memesan jasa Anda.
                  </div>
                )}
                {freelancer.offerings.length === 0 ? (
                  <EmptyState title="Jasa belum tersedia" description="Freelancer perlu menambahkan katalog jasa sebelum menerima pesanan." />
                ) : (
                  <div className="space-y-4">
                    {orderError && (
                      <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
                        {orderError}
                      </div>
                    )}

                    <div className="space-y-3">
                      <select
                        value={selectedOfferingId || currentOffering?.id || ''}
                        onChange={(e) => {
                          const nextOffering = freelancer.offerings.find((offering) => offering.id === e.target.value);
                          if (nextOffering) applyOfferingToOrder(nextOffering);
                        }}
                        className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                      >
                        {freelancer.offerings.map((offering) => (
                          <option key={offering.id} value={offering.id}>
                            {offering.title} - {offering.ratePerHourFormatted}/jam
                          </option>
                        ))}
                      </select>

                      {currentOffering && (
                        <div className="bg-[#F5C800]/10 border border-[#F5C800]/40 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-[#F5C800] font-bold">Paket dipilih</p>
                              <h3 className="text-white font-bold mt-1">{currentOffering.title}</h3>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-[#F5C800]" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-[#CCCCCC]">
                            <span>{currentOffering.priceFormatted} estimasi</span>
                            <span>{currentOffering.ratePerHourFormatted}/jam</span>
                            <span>{currentOffering.estimatedHours || 1} jam estimasi</span>
                            <span>Maks. {maxPersons} orang</span>
                            <span className="col-span-2">{currentOffering.extraPersonFeeFormatted}/orang tambahan</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <input
                      value={orderData.needType}
                      onChange={(e) => setOrderData({ ...orderData, needType: e.target.value })}
                      placeholder="Jenis kebutuhan, contoh: Pre-wedding"
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                    <textarea
                      value={orderData.description}
                      onChange={(e) => setOrderData({ ...orderData, description: e.target.value })}
                      placeholder="Jelaskan kebutuhan Anda secara detail..."
                      rows={5}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <label className="block text-sm text-[#888888]">Jumlah Orang yang Disewa</label>
                        <span className="text-xs text-[#F5C800]">Tersedia maksimal {maxPersons} orang</span>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={maxPersons}
                        value={orderData.personsCount}
                        onChange={(e) => setOrderData({ ...orderData, personsCount: e.target.value })}
                        className={`w-full bg-[#141414] border rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:outline-none ${
                          costSummary.persons > maxPersons
                            ? 'border-[#EF4444] focus:border-[#EF4444]'
                            : 'border-[#2A2A2A] focus:border-[#F5C800]'
                        }`}
                      />
                      {costSummary.persons > maxPersons ? (
                        <p className="text-xs text-[#EF4444] mt-2">
                          Jumlah yang kamu masukkan {costSummary.persons} orang, sedangkan freelancer hanya menyediakan {maxPersons} orang untuk jasa ini.
                        </p>
                      ) : (
                        <p className="text-xs text-[#888888] mt-2">
                          Isi berapa orang/tim freelancer yang ingin kamu sewa.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-[#888888] mb-2">Durasi Sewa Jasa</label>
                      <select
                        value={orderData.rentalHours}
                        onChange={(e) => setOrderData({ ...orderData, rentalHours: e.target.value })}
                        className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hour) => (
                          <option key={hour} value={hour}>{hour} jam</option>
                        ))}
                      </select>
                      <p className="text-xs text-[#888888] mt-2">
                        Biaya jasa dihitung dari harga per jam freelancer dikali durasi ini.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={orderData.eventDate}
                        onChange={(e) => setOrderData({ ...orderData, eventDate: e.target.value })}
                        className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                      />
                      <input
                        type="date"
                        value={orderData.deadline}
                        onChange={(e) => setOrderData({ ...orderData, deadline: e.target.value })}
                        className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={useCurrentLocation}
                      disabled={locating}
                      className="w-full inline-flex items-center justify-center gap-2 border border-[#888888] text-white rounded-lg py-3 hover:border-[#F5C800] hover:text-[#F5C800] transition-colors disabled:opacity-60"
                    >
                      <LocateFixed className="w-4 h-4" />
                      {locating ? 'Mengambil Lokasi...' : 'Gunakan Lokasi Saya'}
                    </button>
                    <button
                      type="button"
                      onClick={useProfileAddress}
                      className="w-full inline-flex items-center justify-center gap-2 border border-[#F5C800]/50 text-[#F5C800] rounded-lg py-3 hover:bg-[#F5C800] hover:text-black transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      Gunakan Alamat dari Settings
                    </button>

                    <SearchableRegionSelect
                      label="Provinsi"
                      placeholder={regionLoading.provinces ? t('Memuat provinsi...', 'Loading provinces...') : t('Ketik nama provinsi', 'Type province name')}
                      value={orderData.province}
                      options={provinces}
                      disabled={regionLoading.provinces}
                      onChange={(value) => selectProvince(findExactRegionByName(provinces, value), value)}
                      onSelect={selectProvince}
                    />
                    <SearchableRegionSelect
                      label="Kabupaten/Kota"
                      placeholder={!selectedProvinceId ? t('Pilih provinsi dulu', 'Select a province first') : regionLoading.cities ? t('Memuat kota/kabupaten...', 'Loading cities/regencies...') : t('Ketik kota/kabupaten', 'Type city/regency')}
                      value={orderData.city}
                      options={cities}
                      disabled={!selectedProvinceId || regionLoading.cities}
                      onChange={(value) => selectCity(findExactRegionByName(cities, value), value)}
                      onSelect={selectCity}
                    />
                    <SearchableRegionSelect
                      label="Kecamatan"
                      placeholder={!selectedCityId ? t('Pilih kota/kabupaten dulu', 'Select a city/regency first') : regionLoading.districts ? t('Memuat kecamatan...', 'Loading districts...') : t('Ketik kecamatan', 'Type district')}
                      value={orderData.district}
                      options={districts}
                      disabled={!selectedCityId || regionLoading.districts}
                      onChange={(value) => selectDistrict(findExactRegionByName(districts, value), value)}
                      onSelect={selectDistrict}
                    />
                    <SearchableRegionSelect
                      label="Desa/Kelurahan"
                      placeholder={!selectedDistrictId ? t('Pilih kecamatan dulu', 'Select a district first') : regionLoading.villages ? t('Memuat desa/kelurahan...', 'Loading villages/subdistricts...') : t('Ketik desa/kelurahan', 'Type village/subdistrict')}
                      value={orderData.village}
                      options={villages}
                      disabled={!selectedDistrictId || regionLoading.villages}
                      onChange={(value) => selectVillage(findExactRegionByName(villages, value), value)}
                      onSelect={selectVillage}
                    />
                    <input
                      type="number"
                      value={orderData.postalCode}
                      onChange={(e) => setOrderData({ ...orderData, postalCode: e.target.value })}
                      placeholder="Kode Pos"
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                    <textarea
                      value={orderData.addressDetail}
                      onChange={(e) => setOrderData({ ...orderData, addressDetail: e.target.value })}
                      placeholder="Jl. Mawar No.5, depan apotek"
                      rows={3}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                    <DraggableLocationMap
                      latitude={orderData.latitude}
                      longitude={orderData.longitude}
                      fallbackQuery={[orderData.addressDetail, orderData.village, orderData.district, orderData.city, orderData.province, orderData.postalCode].filter(Boolean).join(', ')}
                      onChange={(latitude, longitude) => setOrderData((current) => ({
                        ...current,
                        latitude,
                        longitude,
                        locationSource: 'map-pin',
                      }))}
                    />

                    <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-[#888888]">Biaya Jasa ({costSummary.rentalHours} jam)</span>
                        <span className="font-bold">{formatCurrency(costSummary.serviceFee)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#888888]">Biaya Orang Tambahan</span>
                        <span className="font-bold">{formatCurrency(costSummary.extraPersonFee)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#888888]">Transportasi</span>
                        <span className="font-bold">{formatCurrency(costSummary.transportFee)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-[#888888]">Admin MediaVault 1%</span>
                        <span className="font-bold">{formatCurrency(costSummary.adminFee)}</span>
                      </div>
                      <div className="h-px bg-[#2A2A2A]" />
                      <div className="flex justify-between gap-4 text-base">
                        <span className="text-[#888888]">Total</span>
                        <span className="text-[#F5C800] font-bold">{formatCurrency(costSummary.total)}</span>
                      </div>
                      <p className="text-xs text-[#888888]">
                        Transportasi estimasi {costSummary.distanceKm} km. 10 km pertama gratis, sisanya Rp 1/km.
                      </p>
                    </div>

                    <button
                      onClick={openOrderReview}
                      disabled={isOwnProfile || submitting || !costSummary.ready}
                      className="w-full bg-[#F5C800] text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Memproses...' : 'PESAN'}
                    </button>
                    {orderBlockingReason && (
                      <p className="text-xs text-[#EF4444] text-center">{orderBlockingReason}</p>
                    )}
                    <Link
                      to={user ? `/dashboard/client/messages?peerId=${freelancer.id}&peerName=${encodeURIComponent(freelancer.fullName)}` : '/login'}
                      className="w-full flex items-center justify-center gap-2 border border-[#888888] text-white rounded-lg py-3 hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Hubungi Freelancer
                    </Link>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />

      {selectedPortfolio && createPortal((
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedPortfolio(null);
          }}
        >
          <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(0,0,0,0.35)] bg-[var(--popover)] text-[var(--popover-foreground)] border-[var(--border)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#F5C800] font-bold">{t('Detail Portofolio', 'Portfolio Detail')}</p>
                <h2 className="text-3xl mt-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {selectedPortfolio.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPortfolio(null)}
                className="rounded-lg border border-[var(--border)] p-2 text-[var(--foreground)] hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                aria-label="Tutup detail portfolio"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-92px)] overflow-y-auto p-5">
              <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-6">
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--muted)]">
                    {selectedPortfolioMediaItem ? (
                      selectedPortfolioMediaItem.fileType?.startsWith('video/') ? (
                        <video
                          src={selectedPortfolioMediaItem.fileUrl}
                          controls
                          className="max-h-[560px] min-h-[280px] w-full object-contain bg-black/5"
                        />
                      ) : (
                        <img
                          src={selectedPortfolioMediaItem.fileUrl}
                          alt={selectedPortfolioMediaItem.fileName || selectedPortfolio.title}
                          className="max-h-[560px] min-h-[280px] w-full object-contain bg-black/5"
                        />
                      )
                    ) : (
                      <div className="flex min-h-[360px] items-center justify-center text-[var(--muted-foreground)]">
                        <Camera className="h-10 w-10" />
                      </div>
                    )}

                    {selectedPortfolioMedia.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSelectedPortfolioImageIndex((current) => (
                            current === 0 ? selectedPortfolioMedia.length - 1 : current - 1
                          ))}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white hover:bg-[#F5C800] hover:text-black transition-colors"
                          aria-label="Gambar sebelumnya"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPortfolioImageIndex((current) => (
                            current === selectedPortfolioMedia.length - 1 ? 0 : current + 1
                          ))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/65 p-2 text-white hover:bg-[#F5C800] hover:text-black transition-colors"
                          aria-label="Gambar berikutnya"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                          {selectedPortfolioImageIndex + 1}/{selectedPortfolioMedia.length}
                        </div>
                      </>
                    )}
                  </div>

                  {selectedPortfolioMedia.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {selectedPortfolioMedia.map((mediaItem, index) => (
                        <button
                          key={mediaItem.id || `${mediaItem.fileUrl}-${index}`}
                          type="button"
                          onClick={() => setSelectedPortfolioImageIndex(index)}
                          className={`overflow-hidden rounded-lg border transition-all ${
                            selectedPortfolioImageIndex === index
                              ? 'border-[#F5C800] ring-2 ring-[#F5C800]/25'
                              : 'border-[var(--border)] hover:border-[#F5C800]'
                          }`}
                        >
                          {mediaItem.fileType?.startsWith('video/') ? (
                            <div className="h-20 w-full bg-black/60 flex items-center justify-center">
                              <Film className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <img
                              src={mediaItem.fileUrl}
                              alt={mediaItem.fileName || `${selectedPortfolio.title} ${index + 1}`}
                              className="h-20 w-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <aside className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--card-foreground)]">
                  <div className="flex flex-wrap gap-2 mb-5">
                    {selectedPortfolio.category && (
                      <span className="rounded-full bg-[#F5C800]/15 px-3 py-1 text-sm font-bold text-[#D9A900]">
                        {selectedPortfolio.category}
                      </span>
                    )}
                    {selectedPortfolio.serviceType && (
                      <span className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted-foreground)]">
                        {selectedPortfolio.serviceType}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold mb-2">{t('Deskripsi Portofolio', 'Portfolio Description')}</h3>
                  {selectedPortfolio.description ? (
                    <p className="whitespace-pre-line leading-relaxed text-[var(--muted-foreground)]">
                      {selectedPortfolio.description}
                    </p>
                  ) : (
                    <p className="text-[var(--muted-foreground)]">Freelancer belum menambahkan deskripsi untuk portfolio ini.</p>
                  )}

                  <div className="mt-6 rounded-lg bg-[#F5C800]/10 border border-[#F5C800]/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#D9A900]">
                      <Images className="h-4 w-4" />
                      {t(
                        `${selectedPortfolioMedia.filter((mediaItem) => mediaItem.fileType?.startsWith('image/')).length || 0} gambar`,
                        `${selectedPortfolioMedia.filter((mediaItem) => mediaItem.fileType?.startsWith('image/')).length || 0} image${(selectedPortfolioMedia.filter((mediaItem) => mediaItem.fileType?.startsWith('image/')).length || 0) === 1 ? '' : 's'}`
                      )}
                      {selectedPortfolioMedia.some((mediaItem) => mediaItem.fileType?.startsWith('video/')) ? t(' + 1 video', ' + 1 video') : ''}
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)] mt-2">
                      Lihat contoh karya ini untuk menilai gaya visual freelancer sebelum menghubungi atau memesan jasa.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}

      {reviewOpen && freelancer && createPortal((
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-3xl mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Cek Pesanan
                </h2>
                <p className="text-sm text-[#888888]">Pastikan detail sudah sesuai sebelum membuat QRIS pembayaran.</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="p-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                aria-label="Tutup cek pesanan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {orderError && (
                <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
                  {orderError}
                </div>
              )}
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Freelancer</span>
                  <span className="font-bold text-right">{freelancer.fullName}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Jenis Jasa</span>
                  <span className="font-bold text-right">{orderData.serviceType}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Jenis Kebutuhan</span>
                  <span className="font-bold text-right">{orderData.needType}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Jumlah Orang</span>
                  <span className="font-bold text-right">{costSummary.persons} orang</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Durasi Sewa</span>
                  <span className="font-bold text-right">{costSummary.rentalHours} jam</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">{t('Tanggal', 'Date')}</span>
                  <span className="font-bold text-right">{orderData.eventDate} - {orderData.deadline}</span>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                <div className="text-[#888888] mb-2">{t('Deskripsi', 'Description')}</div>
                <p className="text-white">{orderData.description}</p>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                <div className="text-[#888888] mb-2">{t('Alamat Klien', 'Client Address')}</div>
                <p className="text-white">
                  {[orderData.addressDetail, orderData.village, orderData.district, orderData.city, orderData.province, orderData.postalCode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">{t('Biaya Jasa', 'Service Fee')} ({costSummary.rentalHours} {t('jam', 'hours')})</span>
                  <span className="font-bold">{formatCurrency(costSummary.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Biaya Orang Tambahan</span>
                  <span className="font-bold">{formatCurrency(costSummary.extraPersonFee)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Transportasi</span>
                  <span className="font-bold">{formatCurrency(costSummary.transportFee)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Admin MediaVault 1%</span>
                  <span className="font-bold">{formatCurrency(costSummary.adminFee)}</span>
                </div>
                <div className="h-px bg-[#2A2A2A]" />
                <div className="flex justify-between gap-4 text-base">
                  <span className="text-[#888888]">Total Estimasi Sebelum Kode Unik QRIS</span>
                  <span className="text-[#F5C800] font-bold">{formatCurrency(costSummary.total)}</span>
                </div>
                <p className="text-xs text-[#888888]">
                  Nominal final QRIS bisa bertambah kode unik dari KlikQRIS setelah tagihan dibuat.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setReviewOpen(false)}
                className="px-5 py-3 border border-[#888888] text-white rounded-lg font-bold hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
              >
                Edit Lagi
              </button>
              <button
                type="button"
                onClick={() => submitOrder('wallet')}
                disabled={submitting || !walletSummary || walletSummary.balance < costSummary.total}
                className="px-5 py-3 border border-[#22C55E] text-[#22C55E] rounded-lg font-bold disabled:opacity-50"
              >
                Bayar Pakai Saldo ({walletSummary?.balanceFormatted || 'Rp 0'})
              </button>
              <button
                type="button"
                onClick={() => submitOrder('qris')}
                disabled={submitting}
                className="px-5 py-3 bg-[#F5C800] text-black rounded-lg font-bold disabled:opacity-60"
              >
                {submitting ? 'Membuat QRIS...' : 'Konfirmasi & Bayar QRIS'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {paymentOpen && payment && createPortal((
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-3xl mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Pembayaran QRIS', 'QRIS Payment')}
                </h2>
                <p className="text-sm text-[#888888]">{payment.klikqrisOrderId}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="p-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                aria-label="Tutup modal pembayaran"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-[240px_1fr] gap-6">
              <div className="bg-white rounded-lg p-4 min-h-[240px] flex items-center justify-center">
                {payment.qrisUrl ? (
                  <img src={payment.qrisUrl} alt="QRIS pembayaran" className="w-full h-auto" />
                ) : (
                  <span className="text-black text-sm text-center">QRIS tidak tersedia dari gateway</span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Subtotal Pesanan</span>
                  <span className="font-bold">{payment.baseAmountFormatted}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Admin MediaVault 1%</span>
                  <span className="font-bold">{payment.adminFeeClientFormatted}</span>
                </div>
                {payment.gatewayAdjustment > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-[#888888]">Kode Unik / Penyesuaian KlikQRIS</span>
                    <span className="font-bold">{payment.gatewayAdjustmentFormatted}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Total Estimasi MediaVault</span>
                  <span className="font-bold">{payment.amountRequestFormatted}</span>
                </div>
                <div className="h-px bg-[#2A2A2A]" />
                <div className="flex justify-between gap-4 text-base">
                  <span className="text-[#888888]">Nominal Dibayar via QRIS</span>
                  <span className="text-[#F5C800] font-bold">{payment.totalAmountFormatted}</span>
                </div>
                <p className="text-[#888888]">
                  Scan QRIS ini dengan aplikasi bank/e-wallet. Nominal final mengikuti total dari KlikQRIS; selisih dari estimasi MediaVault ditampilkan sebagai kode unik/penyesuaian gateway.
                </p>
                <div className={payment.status === 'PAID' ? 'text-[#22C55E] font-bold' : 'text-[#F5C800] font-bold'}>
                  {payment.status === 'PAID' ? t('Pembayaran Berhasil', 'Payment Successful') : t('Menunggu Pembayaran', 'Waiting for Payment')}
                </div>
                {payment.isSandbox && payment.signature && payment.status === 'PENDING' && (
                  <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-3">
                    <div className="text-[#888888] mb-2">Signature Sandbox</div>
                    <code className="block text-xs text-white break-all bg-[#0A0A0A] rounded-md p-2">{payment.signature}</code>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(payment.signature || '')}
                      className="mt-3 px-3 py-2 border border-[#888888] text-white rounded-lg text-xs hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                    >
                      Copy Signature
                    </button>
                    <p className="text-xs text-[#888888] mt-2">
                      {t('Paste signature ini di menu Simulasi Pembayaran KlikQRIS, lalu klik Muat Ulang Status.', 'Paste this signature in the KlikQRIS Payment Simulation menu, then click Refresh Status.')}
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const response = await apiRequest<{ payment: PaymentDetail }>(`/payments/${payment.klikqrisOrderId}/status`);
                      setPayment(response.payment);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800] hover:text-[#F5C800] transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    {t('Muat Ulang Status', 'Refresh Status')}
                  </button>
                  {payment.directUrl && (
                    <a href={payment.directUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-[#F5C800] text-black rounded-lg text-sm font-bold">
                      Buka Halaman Bayar
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
}
