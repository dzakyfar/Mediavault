import { FormEvent, useEffect, useState } from 'react';
import { Edit2, ImagePlus, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import SmoothToast from '../../components/dashboard/SmoothToast';
import { apiRequest } from '../../lib/api';
import { MESSAGE_IMAGE_MAX_BYTES, readFileAsDataUrl, validateImageFile } from '../../lib/uploadLimits';
import { getServicesForCategory, serviceCatalog } from '../../lib/serviceCatalog';

interface PortfolioItem {
  id: string;
  title: string;
  category: string | null;
  serviceType: string | null;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
}

const emptyForm = {
  id: '',
  title: '',
  category: '',
  serviceType: '',
  description: '',
  fileUrl: '',
  fileName: '',
  fileType: '',
  fileSize: 0,
};

export default function FreelancerPortfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState('');
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

  useEffect(() => {
    loadItems();
  }, []);

  const attachImage = async (file?: File) => {
    if (!file) return;
    const validationError = validateImageFile(file, MESSAGE_IMAGE_MAX_BYTES);
    if (validationError) {
      setError(validationError);
      return;
    }

    const fileUrl = await readFileAsDataUrl(file);
    setForm((current) => ({
      ...current,
      fileUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
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
      fileUrl: item.fileUrl || '',
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
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <h1 className="text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          Portfolio
        </h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444]">
          {error}
        </div>
      )}

      <form onSubmit={saveItem} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 mb-8">
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

        {form.fileUrl && (
          <img src={form.fileUrl} alt={form.fileName} className="mt-4 max-h-56 rounded-lg object-contain bg-[#141414]" />
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
        >
          {saving ? 'Saving...' : form.id ? 'Update Portfolio' : 'Add Portfolio'}
        </button>
      </form>

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
