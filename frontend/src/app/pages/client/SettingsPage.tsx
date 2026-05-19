import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Camera } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function ClientSettings() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      city: user.city || '',
    });
  }, [user]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      setStatusMessage('');
      await updateProfile({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
      });
      setStatusMessage('Profile berhasil disimpan');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Gagal menyimpan profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Hapus akun ini secara permanen? Semua data terkait akun akan ikut terhapus.')) return;
    await deleteAccount();
    navigate('/', { replace: true });
  };

  return (
    <DashboardLayout userType="client">
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
              <div className="w-20 h-20 rounded-full bg-[#141414] flex items-center justify-center text-[#F5C800] text-2xl font-bold">
                {(formData.fullName || 'U').charAt(0)}
              </div>
              <button className="px-4 py-2 bg-[#141414] border border-[#2A2A2A] rounded-lg hover:border-[#F5C800] transition-colors">
                Upload Photo
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-[#888888] mb-2">Full Name</label>
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
              <label className="block text-sm text-[#888888] mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-[#888888] mb-2">City</label>
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
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Security
          </h2>

          <div className="space-y-4 mb-6">
            <button className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-lg text-left hover:border-[#F5C800] transition-colors">
              Change Password
            </button>
            <div className="flex items-center justify-between p-4 bg-[#141414] border border-[#2A2A2A] rounded-lg">
              <div>
                <div className="font-bold mb-1">Two-Factor Authentication</div>
                <div className="text-sm text-[#888888]">Add an extra layer of security</div>
              </div>
              <label className="relative inline-block w-12 h-6">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-12 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5C800]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Notifications
          </h2>

          <div className="space-y-4">
            {[
              { label: 'Email Notifications', desc: 'Receive email updates for new messages and project updates' },
              { label: 'Push Notifications', desc: 'Get instant notifications on your device' },
              { label: 'Marketing Emails', desc: 'Receive promotional offers and updates' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-[#141414] border border-[#2A2A2A] rounded-lg">
                <div>
                  <div className="font-bold mb-1">{item.label}</div>
                  <div className="text-sm text-[#888888]">{item.desc}</div>
                </div>
                <label className="relative inline-block w-12 h-6">
                  <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                  <div className="w-12 h-6 bg-[#2A2A2A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F5C800]"></div>
                </label>
              </div>
            ))}
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
            onClick={handleDeleteAccount}
            className="px-6 py-3 border-2 border-[#EF4444] text-[#EF4444] font-bold rounded-lg hover:bg-[#EF4444] hover:text-white transition-all"
          >
            Delete Account
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
