import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Eye, EyeOff, ScrollText, ShieldCheck, X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleSignupConsentModal from '../components/GoogleSignupConsentModal';

type LegalModalType = 'terms' | 'privacy' | null;

const legalContent = {
  terms: {
    label: 'Terms of Service',
    title: 'MediaVault Terms of Service',
    icon: ScrollText,
    intro: 'Ketentuan ini menjelaskan aturan penggunaan MediaVault sebagai platform penghubung client dan freelancer kreatif fotografi/videografi.',
    sections: [
      {
        heading: '1. Akun dan Tanggung Jawab Pengguna',
        body: 'Pengguna wajib memberikan informasi akun yang benar, menjaga keamanan password/JWT session, dan bertanggung jawab atas aktivitas yang terjadi melalui akunnya.',
      },
      {
        heading: '2. Marketplace Client dan Freelancer',
        body: 'MediaVault memfasilitasi posting job, apply job, pesan, portfolio, tracking project, review draft, dan ulasan. Client dan freelancer bertanggung jawab atas komunikasi, brief, kualitas pekerjaan, dan kesepakatan project masing-masing.',
      },
      {
        heading: '3. Konten dan File Upload',
        body: 'Pengguna hanya boleh mengunggah file yang dimiliki sendiri atau memiliki izin untuk digunakan. MediaVault dapat menyimpan, menampilkan, dan memproses file tersebut hanya untuk menjalankan fitur platform seperti portfolio, pesan, reference file, avatar, dan project delivery.',
      },
      {
        heading: '4. Batasan Perilaku',
        body: 'Dilarang mengunggah konten ilegal, melanggar hak cipta, melecehkan pengguna lain, menyebarkan malware, melakukan spam, atau memakai platform untuk aktivitas yang merugikan pihak lain.',
      },
      {
        heading: '5. Project, Revisi, dan Approval',
        body: 'Progress project dapat ditandai melalui tracker, draft review, approval, dan request revisi. Fitur pembayaran/earnings saat ini masih dalam tahap hold, sehingga penyelesaian transaksi finansial belum menjadi bagian dari layanan aktif.',
      },
      {
        heading: '6. Penghentian Akses',
        body: 'MediaVault dapat membatasi atau menghapus akses jika akun melanggar ketentuan, mengganggu keamanan sistem, atau menyalahgunakan fitur marketplace.',
      },
      {
        heading: '7. Perubahan Ketentuan',
        body: 'Ketentuan dapat diperbarui mengikuti perkembangan fitur. Penggunaan berkelanjutan setelah pembaruan berarti pengguna menyetujui versi terbaru.',
      },
    ],
  },
  privacy: {
    label: 'Privacy Policy',
    title: 'MediaVault Privacy Policy',
    icon: ShieldCheck,
    intro: 'Kebijakan ini menjelaskan data apa yang MediaVault kumpulkan, bagaimana data dipakai, dan bagaimana file media pengguna dilindungi.',
    sections: [
      {
        heading: '1. Data yang Kami Kumpulkan',
        body: 'MediaVault dapat mengumpulkan nama, email, password terenkripsi, role, nomor telepon, kota, bio, specialty, avatar, portfolio, pesan, reference file, submission project, rating, ulasan, dan aktivitas yang diperlukan untuk menjalankan fitur platform.',
      },
      {
        heading: '2. Login Google',
        body: 'Jika pengguna memilih login dengan Google, MediaVault menerima credential dari Google untuk memverifikasi identitas, lalu membuat session JWT MediaVault sendiri. Data Google yang dipakai terbatas pada kebutuhan login seperti email, nama, Google ID, dan foto profil bila tersedia.',
      },
      {
        heading: '3. Penggunaan Data',
        body: 'Data digunakan untuk autentikasi, membuat profil, mencocokkan client dengan freelancer, menampilkan portfolio, mengirim pesan, memproses upload, mengelola project, menampilkan notifikasi, dan menjaga keamanan layanan.',
      },
      {
        heading: '4. Penyimpanan File Media',
        body: 'File media seperti avatar, portfolio, gambar pesan, reference file, dan submission project dapat disimpan di Amazon S3. Database menyimpan referensi file agar pengguna dapat mengakses kembali file yang pernah diunggah sesuai izin aksesnya.',
      },
      {
        heading: '5. Keamanan',
        body: 'Password disimpan dalam bentuk hash, akses endpoint private memakai JWT, dan file media dirancang memakai akses terbatas/presigned URL. Pengguna tetap perlu menjaga keamanan akun dan tidak membagikan token/password.',
      },
      {
        heading: '6. Berbagi Data',
        body: 'MediaVault tidak menjual data pribadi. Data dapat terlihat oleh pengguna lain sesuai fitur, misalnya profil freelancer di halaman pencarian, pesan kepada lawan bicara, atau file project kepada pihak yang terlibat.',
      },
      {
        heading: '7. Hak Pengguna',
        body: 'Pengguna dapat memperbarui profil, mengganti password untuk akun lokal, dan menghapus akun melalui fitur settings. Untuk permintaan bantuan data, pengguna dapat menghubungi email contact MediaVault.',
      },
    ],
  },
};

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [legalModal, setLegalModal] = useState<LegalModalType>(null);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleConsentError, setGoogleConsentError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, loginWithGoogle } = useAuth();
  const activeLegal = legalModal ? legalContent[legalModal] : null;
  const requestedRole = searchParams.get('role')?.toLowerCase();
  const getPostAuthPath = (role: UserRole | null) => {
    if (!role) return requestedRole ? `/role-select?intent=${requestedRole}` : '/role-select';
    if (role === 'FREELANCER') return '/dashboard/freelancer';
    return '/dashboard/client';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (!formData.agreedToTerms) newErrors.terms = 'You must agree to the terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      const user = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate(getPostAuthPath(user.role));
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registrasi gagal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async (credential: string) => {
    try {
      setErrors({});
      setGoogleConsentError('');
      setSubmitting(true);
      const user = await loginWithGoogle(credential);
      navigate(getPostAuthPath(user.role));
    } catch (err) {
      if (err instanceof Error && err.message.includes('GOOGLE_SIGNUP_REQUIRES_CONSENT')) {
        setPendingGoogleCredential(credential);
        setErrors({});
        return;
      }

      setErrors({
        form: err instanceof Error ? err.message : 'Registrasi Google gagal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const completeGoogleSignup = async (password: string) => {
    try {
      setSubmitting(true);
      setGoogleConsentError('');
      const user = await loginWithGoogle(pendingGoogleCredential, {
        acceptedTerms: true,
        password,
      });
      setPendingGoogleCredential('');
      navigate(getPostAuthPath(user.role));
    } catch (err) {
      setGoogleConsentError(err instanceof Error ? err.message : 'Registrasi Google gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] flex mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="hidden md:flex md:w-1/2 bg-[#0A0A0A] relative overflow-hidden">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 z-10">
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </Link>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Your next shoot
              <br />
              starts here.
            </h2>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5C800]/20 to-transparent"></div>
      </div>

      <div className="w-full md:w-1/2 bg-[#141414] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
            <Zap className="w-6 h-6 text-[#F5C800]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
          </Link>

          <h1 className="text-5xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Create your account.
          </h1>

          <GoogleSignInButton
            disabled={submitting}
            text="signup_with"
            onCredential={handleGoogleRegister}
          />

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
            <span className="text-[#888888] text-sm">or</span>
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Budi Santoso"
                className={`w-full bg-[#1A1A1A] border ${errors.fullName ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
              />
              {errors.fullName && <p className="text-[#EF4444] text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className={`w-full bg-[#1A1A1A] border ${errors.email ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
              />
              {errors.email && <p className="text-[#EF4444] text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className={`w-full bg-[#1A1A1A] border ${errors.password ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-[#EF4444] text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className={`w-full bg-[#1A1A1A] border ${errors.confirmPassword ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[#EF4444] text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#F5C800] focus:ring-[#F5C800]"
                />
                <span className="text-sm text-[#888888]">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="text-[#F5C800] hover:underline"
                  >
                    Terms of Service
                  </button>
                  {' '}and{' '}
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="text-[#F5C800] hover:underline"
                  >
                    Privacy Policy
                  </button>
                </span>
              </label>
            {errors.terms && <p className="text-[#EF4444] text-sm mt-1">{errors.terms}</p>}
            </div>

            {errors.form && (
              <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
                {errors.form}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5C800] text-black font-bold py-4 rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#888888] text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5C800] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
      </div>

      {activeLegal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label={`Close ${activeLegal.label}`}
            onClick={() => setLegalModal(null)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/75"
          />
          <div className="relative max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[#D9A900]/30 bg-white text-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-[#F5C800]/30 dark:bg-[#101010] dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.58)]">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#D9A900]/20 blur-3xl dark:bg-[#F5C800]/20" />
            <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-slate-300/40 blur-3xl dark:bg-white/10" />

            <div className="relative flex items-start justify-between gap-4 border-b border-[#D8DEE8] p-6 dark:border-[#2A2A2A]">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#D9A900] text-[#111827] shadow-[0_0_30px_rgba(217,169,0,0.2)] dark:bg-[#F5C800] dark:text-black dark:shadow-[0_0_30px_rgba(245,200,0,0.25)]">
                  <activeLegal.icon className="h-7 w-7" />
                </div>
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.28em] text-[#A87800] dark:text-[#F5C800]">
                    MediaVault Legal
                  </p>
                  <h2 className="text-4xl leading-tight text-[#111827] dark:text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {activeLegal.title}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#667085] transition-colors hover:border-[#D9A900] hover:text-[#A87800] dark:border-white/10 dark:bg-white/5 dark:text-[#888888] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
                aria-label={`Close ${activeLegal.label}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative max-h-[62vh] overflow-y-auto p-6">
              <p className="mb-6 rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-4 leading-relaxed text-[#667085] dark:border-[#2A2A2A] dark:bg-[#171717] dark:text-[#A3A3A3]">
                {activeLegal.intro}
              </p>
              <div className="space-y-4">
                {activeLegal.sections.map((section) => (
                  <section
                    key={section.heading}
                    className="rounded-2xl border border-[#D8DEE8] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-[#2A2A2A] dark:bg-[#171717] dark:shadow-none"
                  >
                    <h3 className="mb-2 text-lg font-bold text-[#111827] dark:text-white">{section.heading}</h3>
                    <p className="leading-relaxed text-[#667085] dark:text-[#A3A3A3]">{section.body}</p>
                  </section>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-[#D9A900]/30 bg-[#FFF8D7] p-4 text-sm text-[#665000] dark:border-[#F5C800]/30 dark:bg-[#1F1B0A] dark:text-[#E8D47A]">
                Dokumen ini disusun sebagai informasi operasional platform untuk kebutuhan project MediaVault dan bukan pengganti nasihat hukum profesional.
              </div>
            </div>

            <div className="relative border-t border-[#D8DEE8] p-6 dark:border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full rounded-full bg-[#D9A900] px-6 py-3 font-bold text-[#111827] transition-all hover:shadow-[0_0_24px_rgba(217,169,0,0.28)] dark:bg-[#F5C800] dark:text-black dark:hover:shadow-[0_0_24px_rgba(245,200,0,0.35)]"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
      <GoogleSignupConsentModal
        open={Boolean(pendingGoogleCredential)}
        submitting={submitting}
        error={googleConsentError}
        onCancel={() => {
          setPendingGoogleCredential('');
          setGoogleConsentError('');
        }}
        onConfirm={completeGoogleSignup}
      />
    </>
  );
}
