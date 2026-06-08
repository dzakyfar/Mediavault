import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Camera, LocateFixed, MapPin, MessageCircle, RefreshCcw, Star, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import EmptyState from '../components/EmptyState';
import DraggableLocationMap from '../components/dashboard/DraggableLocationMap';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import {
  AddressSuggestion,
  estimateRoadDistanceKm,
  fallbackPostalCodeForCity,
  fetchDrivingDistanceKm,
  geocodeIndonesianAddress,
  normalizeRegionName,
  searchIndonesianAddressSuggestions,
} from '../lib/indonesiaRegions';
import { findCity, findDistrict, findProvince, locationOptions } from '../lib/locationOptions';

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
  }>;
  offerings: Offering[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
  }>;
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount: number) => currency.format(amount || 0).replace(/\s/g, ' ');

const findProvinceLoose = (name: string) => {
  const normalized = normalizeRegionName(name);
  if (!normalized) return null;
  return locationOptions.find((province) => normalizeRegionName(province.name) === normalized)
    || locationOptions.find((province) => {
      const provinceName = normalizeRegionName(province.name);
      return provinceName.includes(normalized) || normalized.includes(provinceName);
    })
    || null;
};

const findCityLoose = (provinceName: string, cityName: string) => {
  const province = findProvinceLoose(provinceName);
  const normalized = normalizeRegionName(cityName);
  if (!province || !normalized) return null;
  return province?.cities.find((city) => normalizeRegionName(city.name) === normalized)
    || province?.cities.find((city) => {
      const optionName = normalizeRegionName(city.name);
      return optionName.includes(normalized) || normalized.includes(optionName);
    })
    || null;
};

const findDistrictLoose = (provinceName: string, cityName: string, districtName: string) => {
  const city = findCityLoose(provinceName, cityName);
  const normalized = normalizeRegionName(districtName);
  if (!city || !normalized) return null;
  return city?.districts.find((district) => normalizeRegionName(district.name) === normalized)
    || city?.districts.find((district) => {
      const optionName = normalizeRegionName(district.name);
      return optionName.includes(normalized) || normalized.includes(optionName);
    })
    || null;
};

const readNominatimAddress = (address: Record<string, string> = {}) => {
  const province = address.state || '';
  const city = address.city || address.town || address.county || address.municipality || address.city_district || '';
  const district = address.suburb || address.city_district || address.municipality || address.district || '';
  const village = address.village || address.neighbourhood || address.hamlet || address.suburb || '';
  const roadDetail = [address.road, address.house_number, address.building].filter(Boolean).join(' ');

  return {
    province,
    city,
    district,
    village,
    postalCode: address.postcode || '',
    roadDetail,
  };
};

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

export default function FreelancerProfilePage() {
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
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [addressSuggesting, setAddressSuggesting] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [freelancerGeo, setFreelancerGeo] = useState<{ latitude: string; longitude: string } | null>(null);
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
  const selectedProvince = findProvince(orderData.province);
  const selectedCity = findCity(orderData.province, orderData.city);
  const selectedDistrict = findDistrict(orderData.province, orderData.city, orderData.district);

  const currentOffering = useMemo(() => {
    if (!freelancer) return null;
    return freelancer.offerings.find((offering) => offering.serviceType === orderData.serviceType)
      || freelancer.offerings[0]
      || null;
  }, [freelancer, orderData.serviceType]);
  const maxPersons = currentOffering?.capacityPersons || freelancer?.maxTeamCapacity || 1;

  useEffect(() => {
    if (!currentOffering) return;
    setOrderData((current) => ({
      ...current,
      rentalHours: current.rentalHours || String(currentOffering.estimatedHours || 1),
    }));
  }, [currentOffering]);

  const costSummary = useMemo(() => {
    const persons = Math.max(1, Number(orderData.personsCount) || 1);
    const ratePerHour = currentOffering?.ratePerHour || 0;
    const rentalHours = Math.max(1, Number(orderData.rentalHours) || currentOffering?.estimatedHours || 1);
    const serviceFee = ratePerHour * rentalHours;
    const extraPersonFee = Math.max(0, persons - 1) * (currentOffering?.extraPersonFee || 0);
    const clientLat = Number(orderData.latitude);
    const clientLon = Number(orderData.longitude);
    const freelancerLat = Number(freelancerGeo?.latitude ?? freelancer?.latitude);
    const freelancerLon = Number(freelancerGeo?.longitude ?? freelancer?.longitude);
    const hasCoordinateDistance = (freelancerGeo || (freelancer?.latitude != null && freelancer.longitude != null))
      && orderData.latitude !== '' && orderData.longitude !== ''
      && Number.isFinite(freelancerLat) && Number.isFinite(freelancerLon)
      && Number.isFinite(clientLat) && Number.isFinite(clientLon);
    const distanceKm = hasCoordinateDistance
      ? (routeDistanceKm ?? estimateRoadDistanceKm(freelancerLat, freelancerLon, clientLat, clientLon))
      : orderData.city && freelancer?.city && freelancer.city !== '-'
        ? (orderData.city.toLowerCase() === freelancer.city.toLowerCase() ? 8 : 120)
        : 10;
    const transportFee = Math.max(0, distanceKm - 10) * 1;
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
      distanceSource: routeDistanceKm ? 'rute jalan OSRM' : hasCoordinateDistance ? 'estimasi koordinat' : 'estimasi kota',
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
  }, [currentOffering, freelancer?.city, freelancer?.latitude, freelancer?.longitude, freelancerGeo, maxPersons, orderData, routeDistanceKm]);

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
        setFreelancer(nextFreelancer);
        setOrderData((current) => ({
          ...current,
          serviceType: nextFreelancer.services[0] || '',
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Gagal memuat profile freelancer'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!freelancer) return undefined;
    if (freelancer.latitude != null && freelancer.longitude != null) {
      setFreelancerGeo(null);
      return undefined;
    }

    const query = [
      freelancer.addressDetail,
      freelancer.village,
      freelancer.district,
      freelancer.city,
      freelancer.province,
      freelancer.postalCode,
    ].filter(Boolean).join(', ');
    if (query.trim().length < 6) return undefined;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await geocodeIndonesianAddress(`${query}, Indonesia`);
      if (!cancelled && result) {
        setFreelancerGeo({ latitude: result.latitude, longitude: result.longitude });
      }
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    freelancer?.addressDetail,
    freelancer?.city,
    freelancer?.district,
    freelancer?.id,
    freelancer?.latitude,
    freelancer?.longitude,
    freelancer?.postalCode,
    freelancer?.province,
    freelancer?.village,
  ]);

  useEffect(() => {
    if (orderData.locationSource === 'share-location' || orderData.locationSource === 'manual-map') return undefined;
    const query = [
      orderData.addressDetail,
      orderData.village,
      orderData.district,
      orderData.city,
      orderData.province,
      orderData.postalCode,
    ].filter(Boolean).join(', ');
    if (query.trim().length < 8) return undefined;

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      const result = await geocodeIndonesianAddress(`${query}, Indonesia`);
      if (!cancelled && result) {
        setOrderData((current) => ({
          ...current,
          latitude: result.latitude,
          longitude: result.longitude,
          postalCode: current.postalCode || result.postalCode || fallbackPostalCodeForCity(current.city),
          locationSource: 'manual-geocode',
        }));
      }
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    orderData.addressDetail,
    orderData.city,
    orderData.district,
    orderData.locationSource,
    orderData.postalCode,
    orderData.province,
    orderData.village,
  ]);

  useEffect(() => {
    const query = [
      orderData.addressDetail,
      orderData.district,
      orderData.city,
      orderData.province,
    ].filter(Boolean).join(', ');
    if (orderData.addressDetail.trim().length < 3 || query.trim().length < 5) {
      setAddressSuggestions([]);
      return undefined;
    }

    let cancelled = false;
    setAddressSuggesting(true);
    const timeout = window.setTimeout(async () => {
      const suggestions = await searchIndonesianAddressSuggestions(`${query}, Indonesia`, 5);
      if (!cancelled) {
        setAddressSuggestions(suggestions);
        setAddressSuggesting(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      setAddressSuggesting(false);
    };
  }, [orderData.addressDetail, orderData.city, orderData.district, orderData.province]);

  useEffect(() => {
    const originLat = Number(freelancerGeo?.latitude ?? freelancer?.latitude);
    const originLon = Number(freelancerGeo?.longitude ?? freelancer?.longitude);
    const destinationLat = Number(orderData.latitude);
    const destinationLon = Number(orderData.longitude);
    const canRoute = Number.isFinite(originLat)
      && Number.isFinite(originLon)
      && Number.isFinite(destinationLat)
      && Number.isFinite(destinationLon);

    if (!canRoute) {
      setRouteDistanceKm(null);
      return undefined;
    }

    let cancelled = false;
    setRouteLoading(true);
    const timeout = window.setTimeout(async () => {
      const distance = await fetchDrivingDistanceKm(originLat, originLon, destinationLat, destinationLon);
      if (!cancelled) {
        setRouteDistanceKm(distance);
        setRouteLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      setRouteLoading(false);
    };
  }, [
    freelancer?.latitude,
    freelancer?.longitude,
    freelancerGeo?.latitude,
    freelancerGeo?.longitude,
    orderData.latitude,
    orderData.longitude,
  ]);

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

  const applyAddressSuggestion = (suggestion: AddressSuggestion) => {
    const parsed = readNominatimAddress(suggestion.address);
    const nextProvince = findProvinceLoose(parsed.province)?.name || parsed.province || orderData.province;
    const nextCity = findCityLoose(nextProvince, parsed.city)?.name || parsed.city || orderData.city;
    const nextDistrict = findDistrictLoose(nextProvince, nextCity, parsed.district)?.name || parsed.district || orderData.district;

    setOrderData((current) => ({
      ...current,
      province: nextProvince,
      city: nextCity,
      district: nextDistrict,
      village: parsed.village || current.village,
      postalCode: suggestion.postalCode || parsed.postalCode || current.postalCode || fallbackPostalCodeForCity(nextCity),
      addressDetail: parsed.roadDetail || suggestion.displayName,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      locationSource: 'address-suggestion',
    }));
    setAddressSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setOrderError('Browser tidak mendukung fitur lokasi.');
      return;
    }

    setLocating(true);
    setOrderError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = String(position.coords.latitude);
        const longitude = String(position.coords.longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
          );
          const payload = await response.json();
          const address = payload.address || {};
          const provinceName = address.state || '';
          const cityName = address.city || address.town || address.county || address.city_district || '';
          const districtName = address.suburb || address.city_district || address.municipality || '';
          const villageName = address.village || address.neighbourhood || address.hamlet || address.suburb || '';

          setOrderData((current) => ({
            ...current,
            latitude,
            longitude,
            province: findProvinceLoose(provinceName)?.name || provinceName,
            city: findCityLoose(provinceName, cityName)?.name || cityName,
            district: findDistrictLoose(provinceName, cityName, districtName)?.name || districtName,
            village: villageName,
            postalCode: address.postcode || current.postalCode || fallbackPostalCodeForCity(cityName),
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
        } finally {
          setLocating(false);
        }
      },
      () => {
        setOrderError('Izin lokasi ditolak. Silakan isi manual.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
        title: `${orderData.serviceType} - ${orderData.needType}`,
        budget: costSummary.subtotal,
        address,
        costBreakdown: {
          serviceFee: costSummary.serviceFee,
          extraPersonFee: costSummary.extraPersonFee,
          transportFee: costSummary.transportFee,
          distanceKm: costSummary.distanceKm,
          distanceSource: costSummary.distanceSource,
          rentalHours: costSummary.rentalHours,
          adminFee: costSummary.adminFee,
          total: costSummary.total,
        },
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
    <div className="min-h-screen bg-[#0A0A0A] text-white mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link to="/explore" className="text-[#888888] hover:text-[#F5C800] transition-colors">
          Back to explore
        </Link>

        {loading && (
          <div className="mt-8">
            <EmptyState title="Memuat profile" description="Mengambil profile freelancer dari database." />
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
                  <div className="w-28 h-28 rounded-full bg-[#141414] overflow-hidden flex items-center justify-center text-[#F5C800] text-4xl font-bold">
                    {freelancer.avatarUrl
                      ? <img src={freelancer.avatarUrl} alt={freelancer.fullName} className="w-full h-full object-cover" />
                      : freelancer.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-5xl mb-2" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{freelancer.fullName}</h1>
                        <p className="text-[#888888]">{freelancer.specialty}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${freelancer.available ? 'bg-[#22C55E] text-white' : 'bg-[#888888] text-white'}`}>
                        {freelancer.available ? 'Available' : 'Busy'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-[#888888]">
                      <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" />{freelancer.city}</span>
                      <span className="inline-flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                        {freelancer.rating ?? 'Baru'}
                        {freelancer.reviewCount > 0 && <span>({freelancer.reviewCount} ulasan)</span>}
                      </span>
                      <span className="text-[#F5C800] font-bold">Mulai dari {freelancer.price}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>About</h2>
                <p className="text-[#888888] leading-relaxed">{freelancer.bio}</p>
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Tag Jasa</h2>
                {freelancer.serviceTags.length === 0 ? (
                  <EmptyState title="Belum ada tag jasa" description="Freelancer perlu menambahkan katalog jasa di halaman akun." />
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
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Portfolio</h2>
                {freelancer.portfolioItems.length === 0 ? (
                  <EmptyState title="Portfolio kosong" description="Freelancer ini belum mengupload portfolio, tapi profile tetap bisa dihubungi." />
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {freelancer.portfolioItems.map((item) => (
                      <div key={item.id} className="bg-[#141414] rounded-lg p-4">
                        <div className="aspect-video bg-[#1A1A1A] rounded-lg mb-3 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#888888]" />
                        </div>
                        <h3 className="font-bold">{item.title}</h3>
                        {item.category && <p className="text-sm text-[#888888]">{item.category}</p>}
                        {item.serviceType && <p className="text-sm text-[#F5C800]">{item.serviceType}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
                <h2 className="text-3xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Reviews</h2>
                {freelancer.reviews.length === 0 ? (
                  <EmptyState title="Belum ada review" description="Rating dan ulasan client akan muncul setelah project selesai direview." />
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

                    <select
                      value={orderData.serviceType}
                      onChange={(e) => setOrderData({ ...orderData, serviceType: e.target.value })}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                    >
                      {freelancer.services.map((service) => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>

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

                    <select
                      value={orderData.province}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        province: e.target.value,
                        city: '',
                        district: '',
                        village: '',
                        postalCode: '',
                        latitude: '',
                        longitude: '',
                        locationSource: 'manual',
                      })}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
                    >
                      <option value="">Provinsi</option>
                      {locationOptions.map((province) => <option key={province.name} value={province.name}>{province.name}</option>)}
                      {orderData.province && !selectedProvince && <option value={orderData.province}>{orderData.province}</option>}
                    </select>
                    <select
                      value={orderData.city}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        city: e.target.value,
                        district: '',
                        village: '',
                        postalCode: fallbackPostalCodeForCity(e.target.value),
                        latitude: '',
                        longitude: '',
                        locationSource: 'manual',
                      })}
                      disabled={!orderData.province}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none disabled:opacity-60"
                    >
                      <option value="">Kabupaten/Kota</option>
                      {selectedProvince?.cities.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
                      {orderData.city && !selectedCity && <option value={orderData.city}>{orderData.city}</option>}
                    </select>
                    <select
                      value={orderData.district}
                      onChange={(e) => setOrderData({
                        ...orderData,
                        district: e.target.value,
                        village: '',
                        postalCode: orderData.postalCode || fallbackPostalCodeForCity(orderData.city),
                        latitude: '',
                        longitude: '',
                        locationSource: 'manual',
                      })}
                      disabled={!orderData.city}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none disabled:opacity-60"
                    >
                      <option value="">Kecamatan</option>
                      {selectedCity?.districts.map((district) => <option key={district.name} value={district.name}>{district.name}</option>)}
                      {orderData.district && !selectedDistrict && <option value={orderData.district}>{orderData.district}</option>}
                    </select>
                    <input
                      value={orderData.village}
                      onChange={(e) => setOrderData({ ...orderData, village: e.target.value, locationSource: 'manual' })}
                      placeholder="Desa/Kelurahan"
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
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
                      onChange={(e) => setOrderData({ ...orderData, addressDetail: e.target.value, locationSource: 'manual' })}
                      placeholder="Jl. Mawar No.5, depan apotek"
                      rows={3}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
                    />
                    {(addressSuggesting || addressSuggestions.length > 0) && (
                      <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg overflow-hidden">
                        {addressSuggesting && (
                          <div className="px-4 py-3 text-sm text-[#888888]">Mencari saran alamat...</div>
                        )}
                        {addressSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.label}`}
                            type="button"
                            onClick={() => applyAddressSuggestion(suggestion)}
                            className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#F5C800]/10 border-t border-[#2A2A2A] first:border-t-0"
                          >
                            <span className="block font-bold">Pakai alamat ini</span>
                            <span className="block text-[#888888]">{suggestion.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    <DraggableLocationMap
                      latitude={orderData.latitude}
                      longitude={orderData.longitude}
                      fallbackQuery={[orderData.addressDetail, orderData.city, orderData.province].filter(Boolean).join(', ')}
                      onChange={(latitude, longitude) => setOrderData({
                        ...orderData,
                        latitude,
                        longitude,
                        locationSource: 'manual-map',
                      })}
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
                        Transportasi estimasi {costSummary.distanceKm} km ({costSummary.distanceSource}{routeLoading ? ', menghitung rute...' : ''}). 10 km pertama gratis, sisanya Rp 1/km.
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

      {reviewOpen && freelancer && (
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
                  <span className="text-[#888888]">Tanggal</span>
                  <span className="font-bold text-right">{orderData.eventDate} - {orderData.deadline}</span>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                <div className="text-[#888888] mb-2">Deskripsi</div>
                <p className="text-white">{orderData.description}</p>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4">
                <div className="text-[#888888] mb-2">Alamat Client</div>
                <p className="text-white">
                  {[orderData.addressDetail, orderData.village, orderData.district, orderData.city, orderData.province, orderData.postalCode].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="bg-[#141414] border border-[#2A2A2A] rounded-lg p-4 space-y-2">
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
      )}

      {paymentOpen && payment && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-3xl mb-1" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  Pembayaran QRIS
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
                  <span className="text-[#888888]">Biaya Jasa ({costSummary.rentalHours} jam)</span>
                  <span className="font-bold">{formatCurrency(costSummary.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Biaya Orang Tambahan</span>
                  <span className="font-bold">{formatCurrency(costSummary.extraPersonFee)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-[#888888]">Transportasi ({costSummary.distanceKm} km)</span>
                  <span className="font-bold">{formatCurrency(costSummary.transportFee)}</span>
                </div>
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
                  {payment.status === 'PAID' ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
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
                      Paste signature ini di menu Simulasi Pembayaran KlikQRIS, lalu klik Refresh Status.
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
                    Refresh Status
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
      )}
    </div>
  );
}
