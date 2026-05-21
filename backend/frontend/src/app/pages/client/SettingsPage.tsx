import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Camera, Lock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import SmoothToast from '../../components/dashboard/SmoothToast';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { readFileAsDataUrl, validateImageFile } from '../../lib/uploadLimits';

const PUSH_KEY = 'mediavault_push_notifications';

const createCaptcha = () => {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { question: `${a} + ${b}`, answer: String(a + b) };
};

export default function ClientSettings() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });
  const [saving, setSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => localStorage.getItem(PUSH_KEY) === 'true');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    captchaAnswer: '',
  });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    avatarUrl: '',
  });

  const notificationPermission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  const captchaValid = useMemo(() => passwordForm.captchaAnswer.trim() === captcha.answer, [captcha.answer, passwordForm.captchaAnswer]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      city: user.city || '',
      avatarUrl: user.avatarUrl || '',
    });
  }, [user]);

  useEffect(() => {
    if (!toast.message) return;
    const timeout = window.setTimeout(() => setToast({ message: '', type: 'info' }), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast.message]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setStatusMessage('');
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        avatarUrl: formData.avatarUrl,
      });
      setStatusMessage('Profile berhasil disimpan');
      showToast('Profile berhasil disimpan', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan profile';
      setStatusMessage(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePushNotification = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Browser ini belum mendukung push notification.', 'error');
      return;
    }

    if (!pushEnabled && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        showToast('Izin push notification belum diberikan.', 'error');
        return;
      }
    }

    const nextValue = !pushEnabled;
    setPushEnabled(nextValue);
    localStorage.setItem(PUSH_KEY, String(nextValue));
    showToast(nextValue ? 'Push notification aktif.' : 'Push notification nonaktif.', nextValue ? 'success' : 'info');

    if (nextValue && Notification.permission === 'granted') {
      new Notification('MediaVault', {
        body: 'Push notification aktif. Update project dan pesan akan lebih mudah terlihat.',
      });
    }
  };

  const changePassword = async () => {
    try {
      setSaving(true);
      if (passwordForm.newPassword.length < 8) {
        throw new Error('Password baru minimal 8 karakter');
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Konfirmasi password tidak sama');
      }

      if (!captchaValid) {
        throw new Error('Captcha sederhana belum benar');
      }

      await apiRequest('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        captchaAnswer: '',
      });
      setCaptcha(createCaptcha());
      showToast('Password berhasil diubah', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Gagal mengubah password', 'error');
      setCaptcha(createCaptcha());
      setPasswordForm((current) => ({ ...current, captchaAnswer: '' }));
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
      showToast(error, 'error');
      return;
    }

    try {
      const avatarUrl = await readFileAsDataUrl(file);
      setFormData((current) => ({ ...current, avatarUrl }));
      showToast('Foto profile siap disimpan', 'success');
    } catch {
      showToast('Gagal membaca foto profile', 'error');
    }
  };

  return (
    <DashboardLayout userType="client">
      <SmoothToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Account"
        description="Akun dan data terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Delete Account"
        danger
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
      />

      <h1 className="text-5xl mb-8" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
        Account Settings
      </h1>

      <div className="space-y-6 max-w-4xl">
        {statusMessage && (
          <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-xl text-[#F5C800]">
            {statusMessage}
          </div>
        )}

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Profile
          </h2>

          <div className="mb-6">
            <label className="block text-sm text-[#888888] mb-2">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#141414] overflow-hidden flex items-center justify-center text-[#F5C800] text-2xl font-bold">
                {formData.avatarUrl
                  ? <img src={formData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  : (formData.fullName || 'U').charAt(0)}
              </div>
              <label className="px-4 py-2 bg-[#141414] border border-[#2A2A2A] rounded-lg hover:border-[#F5C800] transition-colors cursor-pointer inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Upload Photo
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
              <label className="block text-sm text-[#888888] mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(event) => setFormData({ ...formData, fullName: event.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(event) => setFormData({ ...formData, city: event.target.value })}
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-[#F5C800]" />
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Change Password
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              placeholder="Current password"
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              placeholder="New password"
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              placeholder="Confirm new password"
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <div className="flex gap-3">
              <div className="px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F5C800] font-bold min-w-24 text-center">
                {captcha.question}
              </div>
              <input
                value={passwordForm.captchaAnswer}
                onChange={(event) => setPasswordForm({ ...passwordForm, captchaAnswer: event.target.value })}
                placeholder="Answer"
                className="flex-1 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={changePassword}
            disabled={saving}
            className="mt-5 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Change Password'}
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Notifications
          </h2>

          <div className="flex items-center justify-between p-4 bg-[#141414] border border-[#2A2A2A] rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F5C800]/10 text-[#F5C800] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold mb-1">Push Notifications</div>
                <div className="text-sm text-[#888888]">
                  {notificationPermission === 'unsupported'
                    ? 'Browser belum mendukung push notification.'
                    : pushEnabled
                      ? 'Notifikasi browser aktif untuk update penting.'
                      : 'Aktifkan untuk menerima popup notifikasi browser.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={togglePushNotification}
              className={`relative w-12 h-6 rounded-full transition-colors ${pushEnabled ? 'bg-[#F5C800]' : 'bg-[#2A2A2A]'}`}
            >
              <span className={`absolute top-[2px] left-[2px] w-5 h-5 bg-white rounded-full transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#EF4444]/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-[#EF4444]" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Danger Zone
          </h2>
          <p className="text-[#888888] mb-6">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className="px-6 py-3 border-2 border-[#EF4444] text-[#EF4444] font-bold rounded-lg hover:bg-[#EF4444] hover:text-white transition-all"
          >
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
