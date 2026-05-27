import { FormEvent, useEffect, useState } from 'react';
import { Edit2, ImagePlus, Plus, Tags, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import SmoothToast from '../../components/dashboard/SmoothToast';
import { apiRequest } from '../../lib/api';
import { MESSAGE_IMAGE_MAX_BYTES, validateImageFile } from '../../lib/uploadLimits';
import { getServicesForCategory, serviceCatalog } from '../../lib/serviceCatalog';
import { uploadFileToS3 } from '../../lib/s3Upload';

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
      setError(err instanceof Error ? err.message : 'Gagal memuat portfolio');
    } finally {
      setLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const response = await apiRequest<{ offerings: Offering[] }>('/offerings/mine');
      setOfferings(response.offerings);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal memuat katalog jasa', type: 'error' });
    }
  };

  useEffect(() => {
    loadItems();
    loadOfferings();
  }, []);

  const attachImage = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file, MESSAGE_IMAGE_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    const uploaded = await uploadFileToS3(file, 'portfolio');
    setForm((current) => ({
      ...current,
      fileUrl: uploaded.key,
      previewUrl: uploaded.url,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      fileSize: uploaded.fileSize,
    }));
    setError('');
  };

  const editItem = (item: PortfolioItem) => {
    setForm({
      id: item.id,
      title: item.title,
      category: item.category || '',
      serviceType: item.serviceType || '',
      description: item.description || '',
      fileUrl: item.fileKey || item.fileUrl || '',
      previewUrl: item.fileUrl || '',
      fileName: item.fileName || '',
      fileType: item.fileType || '',
      fileSize: item.fileSize || 0,
    });
  };

  const resetForm = () => setForm(emptyForm);

  const saveItem = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError('Judul portfolio wajib diisi');
      return;
    }

    if (!form.category || !form.serviceType) {
      setError('Kategori dan jasa portfolio wajib dipilih');
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
      };
      await apiRequest(form.id ? `/portfolio/${form.id}` : '/portfolio', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      resetForm();
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan portfolio');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiRequest(`/portfolio/${id}`, { method: 'DELETE' });
      setToast({ message: 'Portfolio berhasil dihapus', type: 'success' });
      setDeleteTargetId('');
      await loadItems();
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal menghapus portfolio', type: 'error' });
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
      setError('Jenis jasa wajib dipilih');
      return;
    }

    if (!Number.isFinite(parsedRatePerHour) || parsedRatePerHour < 1) {
      setError('Harga per jam wajib diisi minimal Rp 1');
      return;
    }

    if (!offeringForm.description.trim()) {
      setError('Deskripsi atau benefit jasa wajib diisi');
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
      setToast({ message: 'Jasa berhasil ditambahkan ke katalog', type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan jasa');
    } finally {
      setOfferingSaving(false);
    }
  };

  const deleteOffering = async (id: string) => {
    try {
      await apiRequest(`/offerings/${id}`, { method: 'DELETE' });
      setOfferings((current) => current.filter((offering) => offering.id !== id));
      setOfferingDeleteTargetId('');
      setToast({ message: 'Jasa dinonaktifkan dari katalog', type: 'success' });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal menghapus jasa', type: 'error' });
    }
  };

  return (
    <DashboardLayout userType="freelancer">
      <SmoothToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Portfolio"
        description="Portfolio ini akan dihapus permanen dari profile Anda."
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTargetId('')}
        onConfirm={() => deleteItem(deleteTargetId)}
      />
      <ConfirmDialog
        open={Boolean(offeringDeleteTargetId)}
        title="Nonaktifkan Jasa"
        description="Jasa ini akan dinonaktifkan dari katalog publik freelancer."
        confirmLabel="Nonaktifkan"
        danger
        onCancel={() => setOfferingDeleteTargetId('')}
        onConfirm={() => deleteOffering(offeringDeleteTargetId)}
      />
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Portfolio & Katalog Jasa
          </h1>
          <p className="text-[#888888] mt-2">Kelola karya visual dan rate jasa dari satu tempat.</p>
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
          <h2 className="text-2xl font-bold">{form.id ? 'Edit Portfolio' : 'Tambah Portfolio'}</h2>
          {form.id && (
            <button type="button" onClick={resetForm} className="text-[#888888] hover:text-[#EF4444]">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Judul project portfolio"
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
            <option value="">Pilih kategori</option>
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
            <option value="">Pilih jasa</option>
            {getServicesForCategory(form.category).map((service) => (
              <option key={service} value={service}>{service}</option>
            ))}
          </select>
          <textarea
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Deskripsi singkat"
            rows={4}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <label className="inline-flex items-center gap-2 px-4 py-3 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] cursor-pointer transition-colors">
            <ImagePlus className="w-4 h-4" />
            Upload PNG/JPEG
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => attachImage(event.target.files?.[0])} />
          </label>
          <span className="text-sm text-[#888888]">Maksimal 1MB per gambar.</span>
        </div>

        {form.previewUrl && (
          <img src={form.previewUrl} alt={form.fileName} className="mt-4 max-h-56 rounded-lg object-contain bg-[#141414]" />
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
        >
          {saving ? 'Saving...' : form.id ? 'Update Portfolio' : 'Add Portfolio'}
        </button>
      </form>

      <form onSubmit={saveOffering} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#F5C800] text-black flex items-center justify-center">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Katalog Jasa & Rate</h2>
            <p className="text-sm text-[#888888]">Paket aktif akan muncul di profile publik dan bisa dipilih client.</p>
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
            placeholder="Nama tampilan jasa"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.ratePerHour}
            onChange={(event) => setOfferingForm({ ...offeringForm, ratePerHour: event.target.value })}
            placeholder="Harga per jam (Rp)"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.ratePerPhoto}
            onChange={(event) => setOfferingForm({ ...offeringForm, ratePerPhoto: event.target.value })}
            placeholder="Rate per foto (opsional)"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <input
            type="number"
            value={offeringForm.extraPersonFee}
            onChange={(event) => setOfferingForm({ ...offeringForm, extraPersonFee: event.target.value })}
            placeholder="Biaya orang tambahan"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <select
            value={offeringForm.estimatedHours}
            onChange={(event) => setOfferingForm({ ...offeringForm, estimatedHours: event.target.value })}
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none"
          >
            {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((hour) => (
              <option key={hour} value={hour}>{hour} jam estimasi</option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={offeringForm.capacityPersons}
            onChange={(event) => setOfferingForm({ ...offeringForm, capacityPersons: event.target.value })}
            placeholder="Kapasitas tim"
            className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
          <textarea
            value={offeringForm.description}
            onChange={(event) => setOfferingForm({ ...offeringForm, description: event.target.value })}
            placeholder="Benefit/deskripsi jasa. Pisahkan benefit per baris."
            rows={4}
            className="md:col-span-2 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
        </div>

        <div className="mt-4">
          <div className="text-sm text-[#888888] mb-2">Label jasa</div>
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
          {offeringSaving ? 'Menyimpan...' : 'Tambah Jasa'}
        </button>
      </form>
      </section>

      <section className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Katalog Jasa Aktif</h2>
        {offerings.length === 0 ? (
          <p className="text-sm text-[#888888]">Belum ada jasa. Tambahkan minimal satu paket agar client bisa memesan dari profile.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {offerings.map((offering) => (
              <div key={offering.id} className="bg-[#141414] border border-[#2A2A2A] rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-[#F5C800] font-bold">{offering.serviceType}</div>
                    <h3 className="text-xl text-white font-bold">{offering.title || offering.serviceType}</h3>
                    <p className="text-sm text-[#888888] mt-1">
                      {offering.ratePerHourFormatted}/jam
                      {offering.ratePerPhotoFormatted ? ` - ${offering.ratePerPhotoFormatted}/foto` : ''}
                    </p>
                    <p className="text-sm text-[#888888]">Estimasi {offering.estimatedHours} jam - kapasitas {offering.capacityPersons || 1} orang</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOfferingDeleteTargetId(offering.id)}
                    className="p-2 text-[#888888] hover:text-[#EF4444]"
                    aria-label="Nonaktifkan jasa"
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

      {loading && <EmptyState title="Memuat portfolio" description="Mengambil portfolio dari database." />}

      {!loading && items.length === 0 && (
        <EmptyState
          title="Portfolio masih kosong"
          description="Tambahkan contoh hasil kerja agar client bisa menilai gaya visual Anda."
        />
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {items.map((item) => (
          <div key={item.id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
            {item.fileUrl ? (
              <img src={item.fileUrl} alt={item.title} className="w-full h-48 object-cover bg-[#141414]" />
            ) : (
              <div className="w-full h-48 bg-[#141414] flex items-center justify-center text-[#888888]">
                No image
              </div>
            )}
            <div className="p-5">
              <div className="text-sm text-[#F5C800] font-bold mb-1">{item.category || 'Portfolio'}</div>
              <h3 className="text-xl font-bold text-white">{item.title}</h3>
              {item.serviceType && <p className="text-sm text-[#888888] mt-1">{item.serviceType}</p>}
              {item.description && <p className="text-[#888888] mt-2">{item.description}</p>}
              <div className="flex gap-2 mt-4">
                <button onClick={() => editItem(item)} className="inline-flex items-center gap-2 px-3 py-2 border border-[#888888] text-white rounded-lg text-sm hover:border-[#F5C800]">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={() => setDeleteTargetId(item.id)} className="inline-flex items-center gap-2 px-3 py-2 border border-[#EF4444] text-[#EF4444] rounded-lg text-sm hover:bg-[#EF4444] hover:text-white">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
