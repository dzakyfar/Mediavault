import { FormEvent, useEffect, useState } from 'react';
import { Edit2, Film, ImagePlus, Plus, Tags, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import SmoothToast from '../../components/dashboard/SmoothToast';
import { apiRequest } from '../../lib/api';
import {
  PORTFOLIO_MAX_IMAGES_PER_ITEM,
  PORTFOLIO_MAX_VIDEOS_PER_ITEM,
  validatePortfolioFile,
} from '../../lib/uploadLimits';
import { getServicesForCategory, serviceCatalog } from '../../lib/serviceCatalog';
import { uploadFileToS3 } from '../../lib/s3Upload';
import { useLanguage } from '../../context/LanguageContext';

interface PortfolioMedia {
  id?: string;
  fileUrl: string;
  fileKey?: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  previewUrl?: string;
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
  media?: PortfolioMedia[];
}

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

const emptyForm = {
  id: '',
  title: '',
  category: '',
  serviceType: '',
  description: '',
  fileUrl: '',
  previewUrl: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
  media: [] as PortfolioMedia[],
};

const serviceOptions = serviceCatalog.flatMap((category) => category.services);
const tagOptions = serviceCatalog.map((category) => category.category);

const emptyOfferingForm = {
  serviceType: serviceOptions[0] || '',
  title: '',
  ratePerHour: '',
  ratePerPhoto: '',
  extraPersonFee: '',
  estimatedHours: '2',
  capacityPersons: '1',
  relatedSpecs: [] as string[],
  description: '',
};

export default function FreelancerPortfolio() {
  const { t } = useLanguage();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [offeringDeleteTargetId, setOfferingDeleteTargetId] = useState('');
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [offeringForm, setOfferingForm] = useState(emptyOfferingForm);
  const [offeringSaving, setOfferingSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await apiRequest<{ items: PortfolioItem[] }>('/portfolio/mine');
      setItems(response.items);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal memuat portofolio', 'Failed to load portfolio'));
    } finally {
      setLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const response = await apiRequest<{ offerings: Offering[] }>('/offerings/mine');
      setOfferings(response.offerings);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : t('Gagal memuat katalog jasa', 'Failed to load service catalog'), type: 'error' });
    }
  };

  useEffect(() => {
    loadItems();
    loadOfferings();
  }, []);

  const attachMedia = async (fileList?: FileList | null) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const currentImages = form.media.filter((media) => media.fileType?.startsWith('image/')).length;
    const currentVideos = form.media.filter((media) => media.fileType?.startsWith('video/')).length;
    const incomingImages = files.filter((file) => file.type.startsWith('image/')).length;
    const incomingVideos = files.filter((file) => file.type.startsWith('video/')).length;

    if (currentImages + incomingImages > PORTFOLIO_MAX_IMAGES_PER_ITEM) {
      setError(t(`Maksimal ${PORTFOLIO_MAX_IMAGES_PER_ITEM} gambar dalam satu portofolio`, `Maximum ${PORTFOLIO_MAX_IMAGES_PER_ITEM} images in one portfolio item`));
      return;
    }

    if (currentVideos + incomingVideos > PORTFOLIO_MAX_VIDEOS_PER_ITEM) {
      setError(t('Maksimal 1 video dalam satu portofolio', 'Maximum 1 video in one portfolio item'));
      return;
    }

    const validationError = files.map(validatePortfolioFile).find(Boolean);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const uploadedFiles = await Promise.all(files.map((file) => uploadFileToS3(file, 'portfolio')));
      setForm((current) => {
        const media = [
          ...current.media,
          ...uploadedFiles.map((uploaded) => ({
            fileUrl: uploaded.key,
            fileKey: uploaded.key,
            previewUrl: uploaded.url,
            fileName: uploaded.fileName,
            fileType: uploaded.fileType,
            fileSize: uploaded.fileSize,
          })),
        ];
        const first = media[0];
        return {
          ...current,
          media,
          fileUrl: first?.fileUrl || '',
          previewUrl: first?.previewUrl || first?.fileUrl || '',
          fileName: first?.fileName || '',
          fileType: first?.fileType || '',
          fileSize: first?.fileSize || 0,
        };
      });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal mengupload media portofolio', 'Failed to upload portfolio media'));
    } finally {
      setSaving(false);
    }
  };

  const removeMedia = (index: number) => {
    setForm((current) => {
      const media = current.media.filter((_, mediaIndex) => mediaIndex !== index);
      const first = media[0];
      return {
        ...current,
        media,
        fileUrl: first?.fileUrl || '',
        previewUrl: first?.previewUrl || first?.fileUrl || '',
        fileName: first?.fileName || '',
        fileType: first?.fileType || '',
        fileSize: first?.fileSize || 0,
      };
    });
  };

  const itemMedia = (item: PortfolioItem): PortfolioMedia[] => (
    item.media?.length
      ? item.media
      : item.fileUrl
        ? [{
          fileUrl: item.fileKey || item.fileUrl,
          previewUrl: item.fileUrl,
          fileName: item.fileName,
          fileType: item.fileType,
          fileSize: item.fileSize,
        }]
        : []
  );

  const editItem = (item: PortfolioItem) => {
    const media = itemMedia(item).map((mediaItem) => ({
      ...mediaItem,
      fileUrl: mediaItem.fileKey || mediaItem.fileUrl,
      previewUrl: mediaItem.previewUrl || mediaItem.fileUrl,
    }));
    const first = media[0];
    setForm({
      id: item.id,
      title: item.title,
      category: item.category || '',
      serviceType: item.serviceType || '',
      description: item.description || '',
      fileUrl: first?.fileUrl || '',
      previewUrl: first?.previewUrl || '',
      fileName: first?.fileName || '',
      fileType: first?.fileType || '',
      fileSize: first?.fileSize || 0,
      media,
    });
  };

  const resetForm = () => setForm(emptyForm);

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError(t('Judul portofolio wajib diisi', 'Portfolio title is required'));
      return;
    }

    if (!form.category || !form.serviceType) {
      setError(t('Kategori dan jasa portofolio wajib dipilih', 'Portfolio category and service are required'));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: form.title,
        category: form.category,
        serviceType: form.serviceType,
        description: form.description,
        fileUrl: form.fileUrl || null,
        fileName: form.fileName || null,
        fileType: form.fileType || null,
        fileSize: form.fileSize || null,
        files: form.media.map((media, index) => ({
          fileUrl: media.fileKey || media.fileUrl,
          fileName: media.fileName,
          fileType: media.fileType,
          fileSize: media.fileSize,
          sortOrder: index,
        })),
      };
      await apiRequest(form.id ? `/portfolio/${form.id}` : '/portfolio', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan portofolio', 'Failed to save portfolio'));
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiRequest(`/portfolio/${id}`, { method: 'DELETE' });
      setToast({ message: t('Portofolio berhasil dihapus', 'Portfolio deleted successfully'), type: 'success' });
      setDeleteTargetId('');
      await loadItems();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : t('Gagal menghapus portofolio', 'Failed to delete portfolio'), type: 'error' });
    }
  };

  const toggleOfferingTag = (tag: string) => {
    setOfferingForm((current) => ({
      ...current,
      relatedSpecs: current.relatedSpecs.includes(tag)
        ? current.relatedSpecs.filter((item) => item !== tag)
        : [...current.relatedSpecs, tag],
    }));
  };

  const saveOffering = async (event: FormEvent) => {
    event.preventDefault();
    const serviceType = offeringForm.serviceType;
    const parsedRatePerHour = Number(offeringForm.ratePerHour);

    if (!serviceType) {
      setError(t('Jenis jasa wajib dipilih', 'Service type is required'));
      return;
    }

    if (!Number.isFinite(parsedRatePerHour) || parsedRatePerHour < 1) {
      setError(t('Harga per jam wajib diisi minimal Rp 1', 'Hourly rate must be at least Rp 1'));
      return;
    }

    if (!offeringForm.description.trim()) {
      setError(t('Deskripsi atau benefit jasa wajib diisi', 'Service description or benefits are required'));
      return;
    }

    try {
      setOfferingSaving(true);
      setError('');
      const response = await apiRequest<{ offering: Offering }>('/offerings', {
        method: 'POST',
        body: JSON.stringify({
          title: offeringForm.title || serviceType,
          serviceType,
          price: parsedRatePerHour,
          ratePerHour: parsedRatePerHour,
          ratePerPhoto: offeringForm.ratePerPhoto ? Number(offeringForm.ratePerPhoto) : null,
          extraPersonFee: Number(offeringForm.extraPersonFee || 0),
          estimatedHours: Number(offeringForm.estimatedHours || 1),
          capacityPersons: Number(offeringForm.capacityPersons || 1),
          relatedSpecs: offeringForm.relatedSpecs,
          benefits: offeringForm.description,
          description: offeringForm.description,
        }),
      });
      setOfferings((current) => [response.offering, ...current]);
      setOfferingForm(emptyOfferingForm);
      setToast({ message: t('Jasa berhasil ditambahkan ke katalog', 'Service added to catalog'), type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Gagal menyimpan jasa', 'Failed to save service'));
    } finally {
      setOfferingSaving(false);
    }
  };

  const deleteOffering = async (id: string) => {
    try {
      await apiRequest(`/offerings/${id}`, { method: 'DELETE' });
      setOfferings((current) => current.filter((offering) => offering.id !== id));
      setOfferingDeleteTargetId('');
      setToast({ message: t('Jasa dinonaktifkan dari katalog', 'Service deactivated from catalog'), type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : t('Gagal menghapus jasa', 'Failed to delete service'), type: 'error' });
    }
  };

  return (
    <DashboardLayout userType="freelancer">
      <SmoothToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title={t('Hapus Portofolio', 'Delete Portfolio')}
        description={t('Portofolio ini akan dihapus permanen dari profil Anda.', 'This portfolio item will be permanently deleted from your profile.')}
        confirmLabel={t('Hapus', 'Delete')}
        danger
        onCancel={() => setDeleteTargetId('')}
        onConfirm={() => deleteItem(deleteTargetId)}
      />
      <ConfirmDialog
        open={Boolean(offeringDeleteTargetId)}
        title={t('Nonaktifkan Jasa', 'Deactivate Service')}
        description={t('Jasa ini akan dinonaktifkan dari katalog publik freelancer.', 'This service will be deactivated from your public freelancer catalog.')}
        confirmLabel={t('Nonaktifkan', 'Deactivate')}
        danger
        onCancel={() => setOfferingDeleteTargetId('')}
        onConfirm={() => deleteOffering(offeringDeleteTargetId)}
      />
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Portofolio & Katalog Jasa', 'Portfolio & Service Catalog')}
          </h1>
          <p className="text-[#888888] mt-2">{t('Kelola karya visual dan rate jasa dari satu tempat.', 'Manage your visual work and service rates in one place.')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <section className="grid xl:grid-cols-[1.05fr_0.95fr] gap-6 mb-8">
      <form onSubmit={saveItem} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{form.id ? t('Edit Portofolio', 'Edit Portfolio') : t('Tambah Portofolio', 'Add Portfolio')}</h2>
          <div className="flex items-center gap-3">
            {!form.id && (
              <span className="text-sm font-medium text-[#888888]">
                {items.length} {t('portofolio tersimpan', 'portfolio saved')}
              </span>
            )}
            {form.id && (
              <button type="button" onClick={resetForm} className="text-[#888888] hover:text-[#EF4444]">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder={t('Judul project portofolio', 'Portfolio project title')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <select
            value={form.category}
            onChange={(event) => {
              const nextCategory = event.target.value;
              setForm({
                ...form,
                category: nextCategory,
                serviceType: getServicesForCategory(nextCategory)[0] || '',
              });
            }}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          >
            <option value="">{t('Pilih kategori', 'Select category')}</option>
            {serviceCatalog.map((item) => (
              <option key={item.category} value={item.category}>{item.category}</option>
            ))}
          </select>
          <select
            value={form.serviceType}
            onChange={(event) => setForm({ ...form, serviceType: event.target.value })}
            disabled={!form.category}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none disabled:opacity-60"
          >
            <option value="">{t('Pilih jasa', 'Select service')}</option>
            {getServicesForCategory(form.category).map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder={t('Deskripsi singkat', 'Short description')}
            rows={4}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
            <ImagePlus className="w-4 h-4" />
            {t('Upload Gambar / Video', 'Upload Images / Video')}
            <input
              type="file"
              accept="image/png,image/jpeg,video/mp4,video/quicktime,video/webm"
              multiple
              className="hidden"
              onChange={(event) => {
                attachMedia(event.target.files);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <span className="text-sm text-[#888888]">{t('Maks. 5 gambar (1MB/gambar) dan 1 video (100MB)', 'Max. 5 images (1MB/image) and 1 video (100MB)')}</span>
        </div>

        {form.media.length > 0 && (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {form.media.map((media, index) => (
              <div key={`${media.fileUrl}-${index}`} className="relative overflow-hidden rounded-lg border border-[#2A2A2A] bg-[#141414]">
                {media.fileType?.startsWith('video/') ? (
                  <video
                    src={media.previewUrl || media.fileUrl}
                    controls
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <img
                    src={media.previewUrl || media.fileUrl}
                    alt={media.fileName || `Media ${index + 1}`}
                    className="h-40 w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white hover:bg-[#EF4444] transition-colors"
                  aria-label={t('Hapus media', 'Remove media')}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-3 py-2 text-xs text-[#888888]">
                  {media.fileType?.startsWith('video/') ? <Film className="w-3 h-3" /> : <ImagePlus className="w-3 h-3" />}
                  <span className="truncate">{media.fileName}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
        >
          {saving ? t('Menyimpan...', 'Saving...') : form.id ? t('Update Portofolio', 'Update Portfolio') : t('Tambah Portofolio', 'Add Portfolio')}
        </button>
      </form>

      <form onSubmit={saveOffering} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#F5C800] text-black flex items-center justify-center">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t('Katalog Jasa & Rate', 'Service Catalog & Rates')}</h2>
            <p className="text-sm text-[#888888]">{t('Paket aktif akan muncul di profil publik dan bisa dipilih klien.', 'Active packages appear on your public profile and can be selected by clients.')}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <select
            value={offeringForm.serviceType}
            onChange={(event) => setOfferingForm({ ...offeringForm, serviceType: event.target.value })}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
          >
            {serviceOptions.map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          <input
            value={offeringForm.title}
            onChange={(event) => setOfferingForm({ ...offeringForm, title: event.target.value })}
            placeholder={t('Nama tampilan jasa', 'Service display name')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.ratePerHour}
            onChange={(event) => setOfferingForm({ ...offeringForm, ratePerHour: event.target.value })}
            placeholder={t('Harga per jam (Rp)', 'Hourly rate (Rp)')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.ratePerPhoto}
            onChange={(event) => setOfferingForm({ ...offeringForm, ratePerPhoto: event.target.value })}
            placeholder={t('Rate per foto (opsional)', 'Rate per photo (optional)')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.extraPersonFee}
            onChange={(event) => setOfferingForm({ ...offeringForm, extraPersonFee: event.target.value })}
            placeholder={t('Biaya orang tambahan', 'Extra person fee')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <select
            value={offeringForm.estimatedHours}
            onChange={(event) => setOfferingForm({ ...offeringForm, estimatedHours: event.target.value })}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hour) => (
              <option key={hour} value={hour}>{hour} {t('jam estimasi', 'estimated hours')}</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={offeringForm.capacityPersons}
            onChange={(event) => setOfferingForm({ ...offeringForm, capacityPersons: event.target.value })}
            placeholder={t('Kapasitas tim', 'Team capacity')}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <textarea
            value={offeringForm.description}
            onChange={(event) => setOfferingForm({ ...offeringForm, description: event.target.value })}
            placeholder={t('Benefit/deskripsi jasa. Pisahkan benefit per baris.', 'Service benefits/description. Put each benefit on a separate line.')}
            rows={4}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <div className="text-sm text-[#888888] mb-2">{t('Label jasa', 'Service labels')}</div>
          <div className="flex flex-wrap gap-2">
            {tagOptions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleOfferingTag(tag)}
                className={`px-3 py-2 rounded-full text-sm font-bold transition-colors ${
                  offeringForm.relatedSpecs.includes(tag)
                    ? 'bg-[#F5C800] text-black'
                    : 'bg-[#141414] border border-[#2A2A2A] text-[#888888] hover:text-white'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={offeringSaving}
          className="mt-5 inline-flex items-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
        >
          <Plus className="w-4 h-4" />
          {offeringSaving ? t('Menyimpan...', 'Saving...') : t('Tambah Jasa', 'Add Service')}
        </button>
      </form>
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">{t('Katalog Jasa Aktif', 'Active Service Catalog')}</h2>
        {offerings.length === 0 ? (
          <p className="text-sm text-[#888888]">{t('Belum ada jasa. Tambahkan minimal satu paket agar klien bisa memesan dari profil.', 'No services yet. Add at least one package so clients can order from your profile.')}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offerings.map((offering) => (
              <div key={offering.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-[#F5C800] font-bold">{offering.serviceType}</div>
                    <h3 className="text-xl text-white font-bold">{offering.title || offering.serviceType}</h3>
                    <p className="text-sm text-[#888888] mt-1">
                      {offering.ratePerHourFormatted}/{t('jam', 'hour')}
                      {offering.ratePerPhotoFormatted ? ` - ${offering.ratePerPhotoFormatted}/${t('foto', 'photo')}` : ''}
                    </p>
                    <p className="text-sm text-[#888888]">{t('Estimasi', 'Estimate')} {offering.estimatedHours} {t('jam', 'hours')} - {t('kapasitas', 'capacity')} {offering.capacityPersons || 1} {t('orang', 'people')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfferingDeleteTargetId(offering.id)}
                    className="p-2 text-[#888888] hover:text-[#EF4444]"
                    aria-label={t('Nonaktifkan jasa', 'Deactivate service')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {offering.relatedSpecs.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {offering.relatedSpecs.map((tag) => (
                      <span key={tag} className="px-2 py-1 rounded-full bg-[#F5C800]/10 text-[#F5C800] text-xs">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {loading && <EmptyState title={t('Memuat portofolio', 'Loading portfolio')} description={t('Menyiapkan karya dan katalog jasa Anda.', 'Preparing your work and service catalog.')} />}

      {!loading && items.length === 0 && (
        <EmptyState
          title={t('Portofolio masih kosong', 'Portfolio is still empty')}
          description={t('Tambahkan contoh hasil kerja agar client bisa menilai gaya visual Anda.', 'Add work samples so clients can review your visual style.')}
        />
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => {
          const media = itemMedia(item);
          const firstMedia = media[0];

          return (
          <div key={item.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {firstMedia ? (
              firstMedia.fileType?.startsWith('video/') ? (
                <div className="w-full h-48 bg-[#141414] relative overflow-hidden">
                  <video
                    src={firstMedia.previewUrl || firstMedia.fileUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLVideoElement).pause(); (e.currentTarget as HTMLVideoElement).currentTime = 0; }}
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 rounded-full p-1">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                </div>
              ) : (
                <img src={firstMedia.previewUrl || firstMedia.fileUrl} alt={item.title} className="w-full h-48 object-cover bg-[#141414]" />
              )
            ) : (
              <div className="w-full h-48 bg-[#141414] flex items-center justify-center text-[#888888]">
                {t('Belum ada gambar', 'No image yet')}
              </div>
            )}
            {media.length > 1 && (
              <div className="mx-5 -mt-9 mb-3 relative z-10 inline-flex rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                {media.filter((itemMediaItem) => itemMediaItem.fileType?.startsWith('image/')).length} {t('gambar', 'images')}
                {media.some((itemMediaItem) => itemMediaItem.fileType?.startsWith('video/')) ? ` + 1 ${t('video', 'video')}` : ''}
              </div>
            )}
            <div className="p-5">
              <div className="text-sm text-[#F5C800] font-bold mb-1">{item.category || t('Portofolio', 'Portfolio')}</div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              {item.serviceType && <p className="text-sm text-[#888888] mt-1">{item.serviceType}</p>}
              {item.description && <p className="text-[#888888] mt-2">{item.description}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => editItem(item)} className="inline-flex items-center gap-2 px-3 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800]">
                  <Edit2 className="w-4 h-4" />
                  {t('Edit', 'Edit')}
                </button>
                <button onClick={() => setDeleteTargetId(item.id)} className="inline-flex items-center gap-2 px-3 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm hover:bg-[#EF4444] hover:text-white">
                  <Trash2 className="w-4 h-4" />
                  {t('Hapus', 'Delete')}
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
