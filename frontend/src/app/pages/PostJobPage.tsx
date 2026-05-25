import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Check, FileUp, MapPin, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { apiRequest } from '../lib/api';
import { findCity, findDistrict, findProvince, locationOptions } from '../lib/locationOptions';
import { formatBytes, REFERENCE_FILE_MAX_BYTES, S3_TOTAL_LIMIT_BYTES, validateReferenceFile } from '../lib/uploadLimits';
import { uploadFileToS3 } from '../lib/s3Upload';

interface ReferenceFile {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
}

export default function PostJobPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: searchParams.get('service') ? `Pesan jasa ${searchParams.get('service')}` : '',
    category: searchParams.get('service') || '',
    serviceType: searchParams.get('service') || '',
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
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const serviceOptions = [
    'Photography',
    'Videography',
    'Photo + Video',
    'Editing',
    'Product Shoot',
    'Wedding Documentation',
    'Corporate Event',
    'Real Estate Shoot',
  ];

  const selectedProvince = findProvince(formData.province);
  const selectedCity = findCity(formData.province, formData.city);
  const selectedDistrict = findDistrict(formData.province, formData.city, formData.district);
  const mapQuery = formData.latitude && formData.longitude
    ? `${formData.latitude},${formData.longitude}`
    : [formData.addressDetail, formData.village, formData.district, formData.city, formData.province].filter(Boolean).join(', ');
  const hasMapPreview = Boolean(mapQuery);

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
      setError(`Total upload melebihi limit bucket ${formatBytes(S3_TOTAL_LIMIT_BYTES)}`);
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
    if (step === 1 && (!formData.title || !formData.category || !formData.serviceType || !formData.description)) {
      setError('Judul, kategori, jasa, dan deskripsi wajib diisi');
      return;
    }
    if (step === 2 && (!formData.eventDate || !formData.deadline || !formData.province || !formData.city || !formData.district || !formData.village || !formData.addressDetail)) {
      setError('Tanggal pelaksanaan, deadline, provinsi, kota, kecamatan, desa, dan detail alamat wajib diisi');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung share location');
      return;
    }

    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
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
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const payload = await response.json();
          const addressParts = payload.address || {};
          province = addressParts.state || province;
          city = addressParts.city || addressParts.town || addressParts.county || addressParts.city_district || city;
          district = addressParts.suburb || addressParts.city_district || addressParts.municipality || district;
          village = addressParts.village || addressParts.neighbourhood || addressParts.hamlet || addressParts.suburb || village;
          postalCode = addressParts.postcode || postalCode;
          address = payload.display_name || address;
          addressDetail = [
            addressParts.road,
            addressParts.house_number,
            addressParts.building,
          ].filter(Boolean).join(' ') || addressDetail || payload.display_name || `Koordinat: ${latitude}, ${longitude}`;
        } catch {
          address = address || `Koordinat: ${latitude}, ${longitude}`;
          addressDetail = addressDetail || address;
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
        setLocating(false);
      },
      () => {
        setError('Gagal mengambil lokasi. Izinkan akses lokasi atau input alamat manual.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePublish = async () => {
    try {
      setSubmitting(true);
      setError('');
      await apiRequest('/projects', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      navigate('/dashboard/client/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal publish job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout userType="client">
      <div className="max-w-4xl mx-auto">
        <Link to="/dashboard/client" className="flex items-center gap-2 text-[#888888] hover:text-[#F5C800] transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Dashboard</span>
        </Link>

        <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Post a New Job
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
                Job Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Job Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Wedding Photography in Bali"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">Select a category</option>
                    <option value="wedding">Wedding</option>
                    <option value="product">Product</option>
                    <option value="fashion">Fashion</option>
                    <option value="corporate">Corporate</option>
                    <option value="concert">Concert</option>
                    <option value="real-estate">Real Estate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Jasa yang dibutuhkan</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  >
                    <option value="">Pilih jasa</option>
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what you need..."
                    rows={6}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Reference Files (Optional)</label>
                  <label className="block border-2 border-dashed border-[#2A2A2A] rounded-lg p-8 text-center hover:border-[#F5C800] transition-colors cursor-pointer">
                    <FileUp className="w-8 h-8 text-[#F5C800] mx-auto mb-3" />
                    <p className="text-[#888888]">Click to upload reference files</p>
                    <p className="text-sm text-[#888888] mt-2">
                      Maksimal {formatBytes(REFERENCE_FILE_MAX_BYTES)} per file. Total storage mengikuti limit bucket {formatBytes(S3_TOTAL_LIMIT_BYTES)}.
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
                Budget & Timeline
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Budget (Rp)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g. 1500000"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#888888] mb-2">Deadline Konfirmasi / Deliverable</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h3 className="font-bold text-white">Lokasi Job</h3>
                    <p className="text-sm text-[#888888]">Pilih manual seperti checkout, atau isi otomatis dari lokasi Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-[#F5C800] text-black rounded-lg text-sm font-bold hover:shadow-[0_0_10px_rgba(245,200,0,0.35)] transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    {locating ? 'Mengambil lokasi...' : 'Share My Location'}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">Provinsi</label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({
                        ...formData,
                        province: e.target.value,
                        city: '',
                        district: '',
                        village: '',
                        postalCode: '',
                        locationSource: 'manual',
                      })}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    >
                      <option value="">Pilih provinsi</option>
                      {locationOptions.map((province) => (
                        <option key={province.name} value={province.name}>{province.name}</option>
                      ))}
                      {formData.province && !findProvince(formData.province) && (
                        <option value={formData.province}>{formData.province}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">Kota / Kabupaten</label>
                    <select
                      value={formData.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        city: e.target.value,
                        district: '',
                        village: '',
                        postalCode: '',
                        locationSource: 'manual',
                      })}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    >
                      <option value="">Pilih kota/kabupaten</option>
                      {selectedProvince?.cities.map((city) => (
                        <option key={city.name} value={city.name}>{city.name}</option>
                      ))}
                      {formData.city && !selectedCity && (
                        <option value={formData.city}>{formData.city}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">Kecamatan</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        district: e.target.value,
                        village: '',
                        postalCode: '',
                        locationSource: 'manual',
                      })}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    >
                      <option value="">Pilih kecamatan</option>
                      {selectedCity?.districts.map((district) => (
                        <option key={district.name} value={district.name}>{district.name}</option>
                      ))}
                      {formData.district && !selectedDistrict && (
                        <option value={formData.district}>{formData.district}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[#888888] mb-2">Desa / Kelurahan</label>
                    <select
                      value={formData.village}
                      onChange={(e) => {
                        const village = selectedDistrict?.villages.find((item) => item.name === e.target.value);
                        setFormData({
                          ...formData,
                          village: e.target.value,
                          postalCode: village?.postalCode || formData.postalCode,
                          locationSource: 'manual',
                        });
                      }}
                      className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                    >
                      <option value="">Pilih desa/kelurahan</option>
                      {selectedDistrict?.villages.map((village) => (
                        <option key={village.name} value={village.name}>{village.name}</option>
                      ))}
                      {formData.village && !selectedDistrict?.villages.some((village) => village.name === formData.village) && (
                        <option value={formData.village}>{formData.village}</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[#888888] mb-2">Kode Pos</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value, locationSource: 'manual' })}
                    placeholder="Otomatis dari wilayah atau isi manual"
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-[#888888] mb-2">Detail Alamat</label>
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
                    placeholder="Nama venue, jalan, nomor rumah/gedung, patokan, instruksi masuk"
                    rows={4}
                    className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                  />
                  <p className="text-xs text-[#888888] mt-2">
                    Alamat tersimpan: {[formData.addressDetail, formData.village, formData.district, formData.city, formData.province, formData.postalCode].filter(Boolean).join(', ') || '-'}
                  </p>
                  {formData.latitude && formData.longitude && (
                    <p className="text-xs text-[#888888] mt-1">
                      Koordinat tersimpan: {formData.latitude}, {formData.longitude}
                    </p>
                  )}
                </div>

                {hasMapPreview && (
                  <div className="overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#141414]">
                    <iframe
                      title="Preview lokasi job"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`}
                      className="w-full h-64 border-0"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Review & Publish
              </h2>
              <div className="space-y-6">
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-4">Job Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[#888888]">Title: </span>
                      <span className="text-white">{formData.title || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Category: </span>
                      <span className="text-white capitalize">{formData.category || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Jasa: </span>
                      <span className="text-white">{formData.serviceType || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Budget: </span>
                      <span className="text-[#F5C800] font-bold">Rp {formData.budget || '0'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Tanggal Pelaksanaan: </span>
                      <span className="text-white">{formData.eventDate || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Deadline: </span>
                      <span className="text-white">{formData.deadline || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Provinsi: </span>
                      <span className="text-white">{formData.province || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Kota/Kabupaten: </span>
                      <span className="text-white">{formData.city || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Kecamatan: </span>
                      <span className="text-white">{formData.district || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Desa/Kelurahan: </span>
                      <span className="text-white">{formData.village || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Detail Alamat: </span>
                      <span className="text-white">{formData.addressDetail || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="text-[#888888]">Reference Files: </span>
                      <span className="text-white">{formData.referenceFiles.length} file</span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#141414] rounded-lg p-6">
                  <h3 className="font-bold mb-2">Description</h3>
                  <p className="text-[#888888]">{formData.description || 'No description provided'}</p>
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
                Back
              </button>
            ) : <div></div>}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={submitting}
                className="px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all ml-auto"
              >
                {submitting ? 'Publishing...' : 'Publish Job'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
