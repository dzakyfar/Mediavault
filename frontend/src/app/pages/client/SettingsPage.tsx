import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera, Lock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import LanguagePreferenceCard from '../../components/dashboard/LanguagePreferenceCard';
import PhoneInput from '../../components/dashboard/PhoneInput';
import SmoothToast from '../../components/dashboard/SmoothToast';
import TelegramNotificationCard from '../../components/dashboard/TelegramNotificationCard';
import UserAvatar from '../../components/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';
import { validateImageFile } from '../../lib/uploadLimits';
import { uploadFileToS3 } from '../../lib/s3Upload';

const createCaptcha = () => {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { question: `${a} + ${b}`, answer: String(a + b) };
};

export default function ClientSettings() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' }>({ message: '', type: 'info' });
  const [saving, setSaving] = useState(false);
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
  const [avatarPreview, setAvatarPreview] = useState('');

  const captchaValid = passwordForm.captchaAnswer.trim() === captcha.answer;

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      city: user.city || '',
      avatarUrl: user.avatarKey || user.avatarUrl || '',
    });
    setAvatarPreview(user.avatarUrl || '');
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
      setStatusMessage(t('Profil berhasil disimpan', 'Profile saved successfully'));
      showToast(t('Profil berhasil disimpan', 'Profile saved successfully'), 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Gagal menyimpan profil', 'Failed to save profile');
      setStatusMessage(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setSaving(true);
      if (passwordForm.newPassword.length < 8) {
        throw new Error(t('Password baru minimal 8 karakter', 'New password must be at least 8 characters'));
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error(t('Konfirmasi password tidak sama', 'Password confirmation does not match'));
      }

      if (!captchaValid) {
        throw new Error(t('Captcha sederhana belum benar', 'The simple captcha answer is incorrect'));
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
      showToast(t('Password berhasil diubah', 'Password updated successfully'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('Gagal mengubah password', 'Failed to update password'), 'error');
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
      const uploaded = await uploadFileToS3(file, 'avatar');
      setFormData((current) => ({ ...current, avatarUrl: uploaded.key }));
      setAvatarPreview(uploaded.url);
      showToast(t('Foto profil siap disimpan', 'Profile photo is ready to save'), 'success');
    } catch (uploadError) {
      showToast(uploadError instanceof Error ? uploadError.message : t('Gagal upload foto profil', 'Failed to upload profile photo'), 'error');
    }
  };

  return (
    <DashboardLayout userType="client">
      <SmoothToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <ConfirmDialog
        open={showDeleteDialog}
        title={t('Hapus Akun', 'Delete Account')}
        description={t('Akun dan data terkait akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.', 'Your account and related data will be permanently deleted. This action cannot be undone.')}
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
            {saving ? t('Menyimpan...', 'Saving...') : t('Simpan Perubahan', 'Save Changes')}
          </button>
        </div>

        <LanguagePreferenceCard />

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="w-5 h-5 text-[#F5C800]" />
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Ubah Password', 'Change Password')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
              placeholder={t('Password saat ini', 'Current password')}
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
              placeholder={t('Password baru', 'New password')}
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
              placeholder={t('Konfirmasi password baru', 'Confirm new password')}
              className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
            />
            <div className="flex gap-3">
              <div className="px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F5C800] font-bold min-w-24 text-center">
                {captcha.question}
              </div>
              <input
                value={passwordForm.captchaAnswer}
                onChange={(event) => setPasswordForm({ ...passwordForm, captchaAnswer: event.target.value })}
                placeholder={t('Jawaban', 'Answer')}
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
            {saving ? t('Menyimpan...', 'Saving...') : t('Ubah Password', 'Change Password')}
          </button>
        </div>

        <TelegramNotificationCard onNotify={showToast} />

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
