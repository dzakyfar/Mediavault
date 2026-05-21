import { useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { apiRequest } from '../../lib/api';

const createCaptcha = () => {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 2;
  return { question: `${a} + ${b}`, answer: String(a + b) };
};

export default function ChangePasswordCard({ onNotify }: { onNotify: (message: string, type: 'success' | 'error') => void }) {
  const [saving, setSaving] = useState(false);
  const [captcha, setCaptcha] = useState(createCaptcha);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    captchaAnswer: '',
  });
  const captchaValid = useMemo(() => form.captchaAnswer.trim() === captcha.answer, [captcha.answer, form.captchaAnswer]);

  const submit = async () => {
    try {
      setSaving(true);
      if (form.newPassword.length < 8) throw new Error('Password baru minimal 8 karakter');
      if (form.newPassword !== form.confirmPassword) throw new Error('Konfirmasi password tidak sama');
      if (!captchaValid) throw new Error('Captcha sederhana belum benar');

      await apiRequest('/auth/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      setForm({ currentPassword: '', newPassword: '', confirmPassword: '', captchaAnswer: '' });
      setCaptcha(createCaptcha());
      onNotify('Password berhasil diubah', 'success');
    } catch (error) {
      onNotify(error instanceof Error ? error.message : 'Gagal mengubah password', 'error');
      setCaptcha(createCaptcha());
      setForm((current) => ({ ...current, captchaAnswer: '' }));
    } finally {
      setSaving(false);
    }
  };

  return (
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
          value={form.currentPassword}
          onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
          placeholder="Current password"
          className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
        />
        <input
          type="password"
          value={form.newPassword}
          onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          placeholder="New password"
          className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
        />
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
          placeholder="Confirm new password"
          className="bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
        />
        <div className="flex gap-3">
          <div className="px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-lg text-[#F5C800] font-bold min-w-24 text-center">
            {captcha.question}
          </div>
          <input
            value={form.captchaAnswer}
            onChange={(event) => setForm({ ...form, captchaAnswer: event.target.value })}
            placeholder="Answer"
            className="flex-1 bg-[#141414] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="mt-5 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Change Password'}
      </button>
    </div>
  );
}
