import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../context/LanguageContext';

type LegalTab = 'terms' | 'privacy';
type SignupStep = 'legal' | 'password';

const legalCopy = {
  terms: {
    titleId: 'Ketentuan Layanan',
    titleEn: 'Terms of Service',
    intro: 'Ketentuan ini mengatur penggunaan MediaVault sebagai platform penghubung client dan freelancer kreatif untuk layanan fotografi, videografi, editing, dokumentasi event, produk, fashion, corporate, dan real estate.',
    introEn: 'These terms govern the use of MediaVault as a platform connecting clients and creative freelancers for photography, videography, editing, event documentation, product, fashion, corporate, and real estate services.',
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
    sectionsEn: [
      'Account and identity: users must provide accurate names, emails, and profile information. Users are responsible for keeping their account, local password, JWT session, and devices secure.',
      'Roles and access: users may use MediaVault as a client, freelancer, or both based on the role selection flow. Freelancers must complete onboarding before appearing in search or receiving project requests.',
      'Project marketplace: MediaVault supports job posts, applications, freelancer selection, chat, project tracking, draft delivery, revisions, approvals, portfolios, ratings, and reviews. Briefs, schedules, locations, quality, and communication remain the responsibility of the involved parties.',
      'Content and copyright: users may only upload files, images, videos, portfolios, reference files, or submissions they own or are authorized to use. Illegal, infringing, deceptive, abusive, malware, spam, or harmful content is prohibited.',
      'Project tracking and revisions: freelancers may submit progress or drafts with comments. Clients may review, approve, or request revisions. Approval and revision history is used as a workflow record.',
      'Payments and earnings: every amount, invoice, and withdrawal must follow the transaction status shown in the system and MediaVault operational policies.',
      'Security and access limits: MediaVault may restrict, disable, or remove accounts that abuse the platform, disrupt system security, commit fraud, or violate these terms.',
      'Service changes: MediaVault may update features, terms, and operational policies. Continued use after an update means users accept the latest version.',
      'Limitation of liability: MediaVault provides a creative workflow management platform but does not guarantee freelancer results, subjective expectations, or events outside platform control such as connectivity, devices, or third-party services.',
    ],
  },
  privacy: {
    titleId: 'Kebijakan Privasi',
    titleEn: 'Privacy Policy',
    intro: 'Kebijakan ini menjelaskan data yang dikumpulkan MediaVault, cara data digunakan, dan bagaimana file media pengguna diproses agar fitur platform berjalan.',
    introEn: 'This policy explains what data MediaVault collects, how the data is used, and how user media files are processed so platform features can work.',
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
    sectionsEn: [
      'Account data: MediaVault may store names, emails, Google IDs, Google profile photos when available, hashed local passwords, roles, phone numbers, cities, addresses, coordinates, bios, specialties, rates, availability, ratings, and reviews.',
      'Google sign-in: when logging in or signing up with Google, Google credentials are used to verify identity. After validation, MediaVault creates its own JWT session. Google does not store the MediaVault session; the application session is managed by the MediaVault backend.',
      'Local password for Google accounts: the password requested during Google signup is used as an additional local security option and is stored as a hash. The original password is not stored as plain text.',
      'Project and workflow data: MediaVault may store job posts, applications or requests, project statuses, messages, notifications, draft submissions, revision comments, approvals, reference files, portfolio items, and activity history so clients and freelancers can continue workflows later.',
      'Media file storage: avatars, portfolios, message images, reference files, and project submission files are stored so they can be accessed again according to permission rules.',
      'Data usage: data is used for authentication, profile display, freelancer search, job requests, chat, notifications, project tracking, reviews, and maintaining security and system consistency.',
      'Data visible to other users: freelancer profiles, portfolios, specialties, general location, rates, availability, ratings, and reviews may be visible to clients. Messages and project files are only intended for parties involved in the related workflow.',
      'Third parties: MediaVault may use identity, maps/geolocation, file delivery, and infrastructure services to operate the platform securely.',
      'Retention and deletion: users may update profiles and delete accounts from settings. Some data may be retained temporarily for security, workflow audit, or service consistency until technical deletion is complete.',
      'Security: MediaVault uses JWT for private endpoints, password hashing, upload validation, and file access limits. Users are still responsible for protecting passwords, tokens, devices, and avoiding unauthorized sharing.',
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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<LegalTab>('terms');
  const [step, setStep] = useState<SignupStep>('legal');
  const [approved, setApproved] = useState(false);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const activeCopy = legalCopy[activeTab];
  const activeTitle = t(activeCopy.titleId, activeCopy.titleEn);
  const activeIntro = t(activeCopy.intro, activeCopy.introEn);
  const activeSections = t(activeCopy.sections, activeCopy.sectionsEn);

  if (!open) return null;

  const approveLegal = () => {
    if (!approved) {
      setLocalError(t('Checklist persetujuan Ketentuan Layanan dan Kebijakan Privasi terlebih dahulu.', 'Please check the Terms of Service and Privacy Policy agreement first.'));
      return;
    }

    setLocalError('');
    setStep('password');
  };

  const submitPassword = () => {
    if (phone.trim().length < 8) {
      setLocalError(t('Nomor telepon wajib diisi.', 'Phone number is required.'));
      return;
    }

    if (password.length < 8) {
      setLocalError(t('Password minimal 8 karakter.', 'Password must be at least 8 characters.'));
      return;
    }

    setLocalError('');
    onConfirm({ password, phone: phone.trim() });
  };

  return createPortal((
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={t('Batalkan pendaftaran Google', 'Cancel Google signup')}
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
                {t('Pengaturan Akun Google', 'Google Account Setup')}
              </p>
              <h2 className="text-4xl leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {step === 'legal' ? t('Tinjau Persetujuan Legal', 'Review Legal Agreement') : t('Lengkapi Pengaturan Akun', 'Complete Account Setup')}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-slate-50 p-2 text-[#667085] hover:border-[#D9A900] hover:text-[#A87800] dark:border-white/10 dark:bg-white/5 dark:text-[#888888] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
            aria-label={t('Tutup persetujuan pendaftaran Google', 'Close Google signup consent')}
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
                    {t(legalCopy[tab].titleId, legalCopy[tab].titleEn)}
                  </button>
                ))}
              </div>

              <div className="max-h-[48vh] overflow-y-auto rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-5 dark:border-[#2A2A2A] dark:bg-[#171717]">
                <h3 className="mb-2 text-xl font-bold">{activeTitle}</h3>
                <p className="mb-4 text-[#667085] dark:text-[#A3A3A3]">{activeIntro}</p>
                <div className="space-y-3">
                  {activeSections.map((section, index) => (
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
                  {t('Saya sudah membaca dan menyetujui Ketentuan Layanan serta Kebijakan Privasi MediaVault untuk membuat akun Google baru.', 'I have read and agree to MediaVault Terms of Service and Privacy Policy to create a new Google account.')}
                </span>
              </label>
            </>
          ) : (
            <div className="rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] p-5 dark:border-[#2A2A2A] dark:bg-[#171717]">
              <h3 className="mb-2 text-xl font-bold">{t('Lengkapi Kontak & Password', 'Complete Contact & Password')}</h3>
              <p className="mb-5 text-sm leading-relaxed text-[#667085] dark:text-[#A3A3A3]">
                {t('Nomor telepon dipakai untuk kontak project dan opsi notifikasi Telegram. Password menjadi akses lokal tambahan untuk akun Google kamu.', 'Your phone number is used for project contact and Telegram notification options. The password adds local access for your Google account.')}
              </p>
              <label className="mb-2 block text-sm text-[#667085] dark:text-[#A3A3A3]">{t('Nomor Telepon', 'Phone Number')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+62 812 3456 7890"
                className="mb-4 w-full rounded-xl border border-[#D8DEE8] bg-white px-4 py-3 text-[#111827] placeholder-[#667085] focus:border-[#D9A900] focus:outline-none dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-white dark:placeholder-[#888888] dark:focus:border-[#F5C800]"
              />
              <label className="mb-2 block text-sm text-[#667085] dark:text-[#A3A3A3]">{t('Password Lokal', 'Local Password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('Minimal 8 karakter', 'At least 8 characters')}
                  className="w-full rounded-xl border border-[#D8DEE8] bg-white px-4 py-3 pr-12 text-[#111827] placeholder-[#667085] focus:border-[#D9A900] focus:outline-none dark:border-[#2A2A2A] dark:bg-[#101010] dark:text-white dark:placeholder-[#888888] dark:focus:border-[#F5C800]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#667085] hover:text-[#A87800] dark:text-[#888888] dark:hover:text-[#F5C800]"
                  aria-label={t('Tampilkan atau sembunyikan password', 'Toggle password visibility')}
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
            {t('Tidak, batalkan', 'No, cancel')}
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
              {t('Kembali', 'Back')}
            </button>
          )}
          <button
            type="button"
            onClick={step === 'legal' ? approveLegal : submitPassword}
            disabled={submitting}
            className="rounded-full bg-[#D9A900] px-6 py-3 font-bold text-[#111827] disabled:opacity-60 dark:bg-[#F5C800] dark:text-black"
          >
            {submitting ? t('Membuat akun...', 'Creating...') : step === 'legal' ? t('Setujui & Lanjutkan', 'Approve & Continue') : t('Buat Akun', 'Create Account')}
          </button>
        </div>
      </div>
    </div>
  ), document.body);
}
