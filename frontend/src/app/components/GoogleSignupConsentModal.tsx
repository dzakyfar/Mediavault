import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';

type LegalTab = 'terms' | 'privacy';
type SignupStep = 'legal' | 'password';

const legalCopy = {
  terms: {
    title: 'Terms of Service',
    intro: 'Ketentuan ini mengatur penggunaan MediaVault sebagai platform penghubung client dan freelancer kreatif untuk layanan fotografi, videografi, editing, dokumentasi event, produk, fashion, corporate, dan real estate.',
    sections: [
      'Akun dan identitas: pengguna wajib memakai nama, email, dan informasi profil yang benar. Pengguna bertanggung jawab menjaga keamanan akun, password lokal, session JWT, dan perangkat yang dipakai untuk mengakses MediaVault.',
      'Role dan akses: pengguna dapat menggunakan MediaVault sebagai client, freelancer, atau keduanya sesuai alur role select. Freelancer wajib melengkapi onboarding sebelum tampil di pencarian atau menerima request project.',
      'Marketplace project: MediaVault memfasilitasi post job, apply/request job, pemilihan freelancer, chat, tracking project, pengiriman draft, revisi, approval, portfolio, rating, dan ulasan. Kesepakatan brief, jadwal, lokasi, kualitas, dan komunikasi tetap menjadi tanggung jawab pihak yang terlibat.',
      'Konten dan hak cipta: pengguna hanya boleh mengunggah file, gambar, video, portfolio, reference file, atau submission yang dimiliki sendiri atau punya izin penggunaan. Konten ilegal, melanggar hak cipta, menipu, melecehkan, berisi malware, spam, atau merugikan pihak lain dilarang.',
      'Project tracking dan revisi: freelancer dapat mengirim progres/draft beserta komentar. Client dapat melakukan review, approve, atau meminta revisi. Riwayat approval dan revisi dipakai sebagai catatan alur kerja project.',
      'Pembayaran dan earnings: setiap nominal, invoice, dan pencairan dana harus mengikuti status transaksi yang tampil di sistem serta kebijakan operasional MediaVault.',
      'Keamanan dan pembatasan akses: MediaVault dapat membatasi, menonaktifkan, atau menghapus akun yang menyalahgunakan platform, mengganggu keamanan sistem, melakukan penipuan, atau melanggar ketentuan ini.',
      'Perubahan layanan: MediaVault dapat memperbarui fitur, ketentuan, dan kebijakan operasional. Penggunaan layanan setelah pembaruan berarti pengguna menyetujui versi terbaru.',
      'Batas tanggung jawab: MediaVault menyediakan platform pengelolaan workflow kreatif, tetapi tidak menjamin hasil pekerjaan freelancer, kesesuaian ekspektasi subjektif, atau kejadian di luar kendali platform seperti koneksi, perangkat, atau layanan pihak ketiga.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    intro: 'Kebijakan ini menjelaskan data yang dikumpulkan MediaVault, cara data digunakan, dan bagaimana file media pengguna diproses agar fitur platform berjalan.',
    sections: [
      'Data akun: MediaVault dapat menyimpan nama, email, Google ID, foto profil Google bila tersedia, password lokal yang sudah di-hash, role, nomor telepon, kota, alamat, koordinat, bio, specialty, rate, availability, rating, dan ulasan.',
      'Google sign-in: saat login atau signup dengan Google, credential Google dipakai untuk memverifikasi identitas. Setelah valid, MediaVault membuat session JWT sendiri. Google tidak menyimpan session MediaVault; session aplikasi dikelola oleh backend MediaVault.',
      'Password lokal untuk akun Google: password yang diminta pada signup Google digunakan sebagai opsi keamanan akun lokal dan disimpan dalam bentuk hash. Password asli tidak disimpan dalam bentuk teks biasa.',
      'Data project dan workflow: MediaVault dapat menyimpan job post, application/request, status project, pesan, notifikasi, draft submission, komentar revisi, approval, reference file, portfolio item, dan histori aktivitas agar client dan freelancer dapat melanjutkan workflow di kemudian hari.',
      'Penyimpanan file media: avatar, portfolio, gambar pesan, reference file, dan file submission project disimpan agar file dapat diakses kembali sesuai hak akses.',
      'Penggunaan data: data dipakai untuk autentikasi, menampilkan profil, mencari freelancer, memproses job request, menjalankan chat, notifikasi, tracking project, review, serta menjaga keamanan dan konsistensi sistem.',
      'Data yang terlihat pengguna lain: profil freelancer, portfolio, specialty, lokasi umum, rate, availability, rating, dan review dapat terlihat oleh client. Pesan dan file project hanya ditujukan kepada pihak yang terlibat dalam alur terkait.',
      'Pihak ketiga: MediaVault dapat memakai layanan identitas, peta/geolocation, pengiriman file, dan infrastruktur lain untuk menjalankan fitur platform secara aman.',
      'Retensi dan penghapusan: pengguna dapat memperbarui profil dan menghapus akun melalui settings. Beberapa data dapat tetap tersimpan sementara untuk kebutuhan keamanan, audit workflow, atau konsistensi layanan sampai proses penghapusan teknis selesai.',
      'Keamanan: MediaVault menggunakan JWT untuk endpoint private, password hashing, validasi upload, dan pembatasan akses file. Pengguna tetap wajib menjaga password, token, perangkat, dan tidak membagikan akses kepada pihak lain.',
    ],
  },
};

interface GoogleSignupConsentModalProps {
  open: boolean;
  submitting?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (payload: { password: string; phone: string }) => void;
}

export default function GoogleSignupConsentModal({
  open,
  submitting = false,
  error = '',
  onCancel,
  onConfirm,
}: GoogleSignupConsentModalProps) {
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const [step, setStep] = useState<SignupStep>('legal');
  const [approved, setApproved] = useState(false);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const activeCopy = legalCopy[activeTab];

  if (!open) return null;

  const approveLegal = () => {
    if (!approved) {
      setLocalError('Checklist persetujuan Terms of Service dan Privacy Policy terlebih dahulu.');
      return;
    }

    setLocalError('');
    setStep('password');
  };

  const submitPassword = () => {
    if (phone.trim().length < 8) {
      setLocalError('Nomor telepon wajib diisi.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password minimal 8 karakter.');
      return;
    }

    setLocalError('');
    onConfirm({ password, phone: phone.trim() });
  };

  return createPortal((
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Cancel Google signup"
        onClick={onCancel}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/75"
      />
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-[#D9A900]/30 bg-white text-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.24)] dark:border-[#F5C800]/30 dark:bg-[#101010] dark:text-white">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-[#D9A900]/20 blur-3xl dark:bg-[#F5C800]/20" />
        <div className="relative flex items-start justify-between gap-4 border-b border-[#D8DEE8] p-6 dark:border-[#2A2A2A]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#D9A900] text-[#111827] dark:bg-[#F5C800] dark:text-black">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.28em] text-[#A87800] dark:text-[#F5C800]">
                Google Account Setup
              </p>
              <h2 className="text-4xl leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {step === 'legal' ? 'Review Legal Agreement' : 'Complete Account Setup'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#667085] hover:border-[#D9A900] hover:text-[#A87800] dark:border-white/10 dark:bg-white/5 dark:text-[#888888] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
            aria-label="Close Google signup consent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative p-6">
          {step === 'legal' ? (
            <>
              <div className="mb-5 grid grid-cols-2 rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-1 dark:border-[#2A2A2A] dark:bg-[#171717]">
                {(['terms', 'privacy'] as LegalTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      activeTab === tab
                        ? 'bg-[#D9A900] text-[#111827] dark:bg-[#F5C800] dark:text-black'
                        : 'text-[#667085] hover:text-[#A87800] dark:text-[#A3A3A3] dark:hover:text-[#F5C800]'
                    }`}
                  >
                    {legalCopy[tab].title}
                  </button>
                ))}
              </div>

              <div className="max-h-[48vh] overflow-y-auto rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-5 dark:border-[#2A2A2A] dark:bg-[#171717]">
                <h3 className="mb-2 text-xl font-bold">{activeCopy.title}</h3>
                <p className="mb-4 text-[#667085] dark:text-[#A3A3A3]">{activeCopy.intro}</p>
                <div className="space-y-3">
                  {activeCopy.sections.map((section, index) => (
                    <div key={section} className="rounded-xl bg-white p-4 text-sm leading-relaxed text-[#667085] dark:bg-[#101010] dark:text-[#D1D1D1]">
                      <span className="mr-2 font-bold text-[#A87800] dark:text-[#F5C800]">{index + 1}.</span>
                      {section}
                    </div>
                  ))}
                </div>
              </div>

              <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[#D8DEE8] bg-white p-4 dark:border-[#2A2A2A] dark:bg-[#171717]">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(event) => setApproved(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-[#D8DEE8] text-[#D9A900] focus:ring-[#D9A900] dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-[#F5C800]"
                />
                <span className="text-sm text-[#667085] dark:text-[#A3A3A3]">
                  Saya sudah membaca dan menyetujui Terms of Service serta Privacy Policy MediaVault untuk membuat akun Google baru.
                </span>
              </label>
            </>
          ) : (
            <div className="rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-5 dark:border-[#2A2A2A] dark:bg-[#171717]">
              <h3 className="mb-2 text-xl font-bold">Lengkapi Kontak & Password</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#667085] dark:text-[#A3A3A3]">
                Nomor telepon dipakai untuk kontak project dan opsi notifikasi Telegram. Password menjadi akses lokal tambahan untuk akun Google kamu.
              </p>
              <label className="mb-2 block text-sm text-[#667085] dark:text-[#A3A3A3]">Nomor Telepon</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+62 812 3456 7890"
                className="mb-4 w-full rounded-xl border border-[#D8DEE8] bg-white px-4 py-3 text-[#111827] placeholder-[#667085] focus:border-[#D9A900] focus:outline-none dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-white dark:placeholder-[#888888] dark:focus:border-[#F5C800]"
              />
              <label className="mb-2 block text-sm text-[#667085] dark:text-[#A3A3A3]">Password Lokal</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-xl border border-[#D8DEE8] bg-white px-4 py-3 pr-12 text-[#111827] placeholder-[#667085] focus:border-[#D9A900] focus:outline-none dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-white dark:placeholder-[#888888] dark:focus:border-[#F5C800]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#A87800] dark:text-[#888888] dark:hover:text-[#F5C800]"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {(localError || error) && (
            <div className="mt-4 rounded-xl border border-[#EF4444] bg-[#EF4444]/10 p-3 text-sm text-[#EF4444]">
              {localError || error}
            </div>
          )}
        </div>

        <div className="relative flex flex-col gap-3 border-t border-[#D8DEE8] p-6 dark:border-[#2A2A2A] sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#D8DEE8] px-6 py-3 font-bold text-[#667085] hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#2A2A2A] dark:text-[#A3A3A3] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
          >
            Tidak, batalkan
          </button>
          {step === 'password' && (
            <button
              type="button"
              onClick={() => {
                setLocalError('');
                setStep('legal');
              }}
              className="rounded-full border border-[#D8DEE8] px-6 py-3 font-bold text-[#667085] hover:border-[#D9A900] hover:text-[#A87800] dark:border-[#2A2A2A] dark:text-[#A3A3A3] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
            >
              Kembali
            </button>
          )}
          <button
            type="button"
            onClick={step === 'legal' ? approveLegal : submitPassword}
            disabled={submitting}
            className="rounded-full bg-[#D9A900] px-6 py-3 font-bold text-[#111827] disabled:opacity-60 dark:bg-[#F5C800] dark:text-black"
          >
            {submitting ? 'Creating...' : step === 'legal' ? 'Approve & Continue' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
