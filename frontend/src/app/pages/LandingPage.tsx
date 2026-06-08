import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Pencil, Camera, FolderOpen, Star, Image, Shield, Zap, Users, CheckCircle2, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UserAvatar from '../components/UserAvatar';
import { apiRequest } from '../lib/api';
import { useLanguage } from '../context/LanguageContext';

interface Freelancer {
  id: string;
  name: string;
  avatarUrl?: string | null;
  specialty: string;
  rating: string | null;
  reviewCount: number;
  price: string;
  available: boolean;
}

export default function LandingPage() {
  const { t } = useLanguage();
  const [topFreelancers, setTopFreelancers] = useState<Freelancer[]>([]);
  const openContact = () => window.dispatchEvent(new Event('mediavault:open-contact'));
  const shotCategories = [
    { name: 'Wedding', image: '/catalog/wedding.jpg' },
    { name: 'Product', image: '/catalog/product.jpg' },
    { name: 'Fashion', image: '/catalog/fashion.jpg' },
    { name: 'Corporate', image: '/catalog/corporate.jpg' },
    { name: 'Concert', image: '/catalog/concert.jpg' },
    { name: 'Real Estate', image: '/catalog/real-estate.jpg' },
  ];
  const heroStats = [
    { icon: Star, label: t('Rating 4,9', '4.9 Rating') },
    { icon: Users, label: t('500+ Freelancer', '500+ Freelancers') },
    { icon: CheckCircle2, label: t('2.000+ Proyek Selesai', '2,000+ Projects Done') },
  ];
  const testimonials = [
    {
      name: 'Rania Putri',
      role: t('Klien Wedding', 'Wedding Client'),
      quote: t(
        'MediaVault bikin proses cari fotografer nikahan terasa tenang. Brief jelas, progress kelihatan, dan hasilnya benar-benar sinematik.',
        'MediaVault made finding a wedding photographer feel calm. The brief was clear, progress was visible, and the result felt truly cinematic.'
      ),
    },
    {
      name: 'Bima Studio',
      role: t('Freelancer Video', 'Video Freelancer'),
      quote: t(
        'Request job masuk lebih rapi, chat tidak tercecer, dan client bisa review draft tanpa drama revisi panjang.',
        'Job requests are cleaner, chats stay organized, and clients can review drafts without long revision drama.'
      ),
    },
    {
      name: 'Aurelia Brand',
      role: t('Klien Product Shoot', 'Product Shoot Client'),
      quote: t(
        'Referensi produk bisa dikirim dari awal, jadi fotografer langsung paham mood yang kami cari. Flow-nya bersih dan cepat.',
        'Product references can be sent from the start, so photographers understand the mood right away. The flow is clean and fast.'
      ),
    },
    {
      name: 'Dion Visuals',
      role: t('Freelancer Foto', 'Photo Freelancer'),
      quote: t(
        'Tracker project membantu banget. Client tahu tahap pengerjaan, saya juga punya catatan approval yang jelas.',
        'The project tracker helps a lot. Clients know every stage, and I have clear approval records.'
      ),
    },
  ];

  useEffect(() => {
    apiRequest<{ freelancers: Freelancer[] }>('/freelancers', { auth: false })
      .then((response) => setTopFreelancers(response.freelancers.slice(0, 4)))
      .catch(() => setTopFreelancers([]));
  }, []);

  return (
    <div className="mv-no-page-transform min-h-screen bg-[#0A0A0A] text-white mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-6 gap-4 h-full p-8">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="bg-[#1A1A1A] rounded-lg"></div>
            ))}
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
            {heroStats.map((stat) => (
              <span key={stat.label} className="inline-flex items-center gap-2 px-4 py-2 border border-[#F5C800] bg-[#141414] rounded-full text-sm shadow-[0_12px_30px_rgba(245,200,0,0.08)]">
                <stat.icon className="h-4 w-4 text-[#F5C800]" />
                {stat.label}
              </span>
            ))}
          </div>
          <h1 className="text-6xl md:text-8xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: '1.1' }}>
            BOOK THE <span className="text-[#F5C800]">BEST.</span>
            <br />
            SHOOT THE <span className="text-[#F5C800]">REST.</span>
          </h1>
          <p className="text-lg text-[#888888] mb-8 max-w-2xl mx-auto">
            {t('Platform kreatif untuk memesan jasa fotografi dan video dengan alur kerja yang rapi.', "Indonesia's boldest platform for creative photography & video services.")}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/explore" className="px-8 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
              {t('Cari Fotografer', 'Find a Photographer')}
            </Link>
            <Link to="/register?role=freelancer" className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-black transition-all">
              {t('Jadi Freelancer', 'Become a Freelancer')}
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl text-center mb-16" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Simple. Cepat. Terarah.', 'Simple. Fast. No Cap.')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Pencil, step: '1', title: t('Buat Pekerjaan', 'Post Your Job'), desc: t('Tulis brief, tentukan budget, lalu tunggu freelancer mengajukan permintaan.', 'Drop your brief. Set your budget. Get ready for the pitch.') },
              { icon: Camera, step: '2', title: t('Pilih Freelancer', 'Pick Your Shooter'), desc: t('Review portfolio, bandingkan rate, dan pilih kreator yang paling cocok.', 'Review portfolios, compare rates, and hire the perfect match.') },
              { icon: FolderOpen, step: '3', title: t('Terima File', 'Get Your Files'), desc: t('Pantau progres, review draft, dan akses hasil media dengan aman.', 'Track progress, review drafts, and access delivered media securely.') }
            ].map((item, i) => (
              <div key={i} className="bg-[#141414] rounded-xl p-8 border border-[#2A2A2A] hover:-translate-y-1 hover:border-b-4 hover:border-b-[#F5C800] hover:shadow-[0_4px_20px_rgba(245,200,0,0.2)] transition-all duration-200 relative overflow-hidden mv-glass-card">
                <div className="absolute top-8 right-8 text-8xl font-bold text-[#1A1A1A] opacity-50">
                  {item.step}
                </div>
                <item.icon className="w-12 h-12 text-[#F5C800] mb-4 relative z-10" />
                <h3 className="text-2xl font-bold mb-3 relative z-10" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {item.title}
                </h3>
                <p className="text-[#888888] relative z-10">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-freelancers" className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-6xl mb-16" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Gabung dengan 500+ Kreator di MediaVault', 'Join 500+ Shooters Making Money on MediaVault')}
          </h2>
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            {[
              { icon: Image, title: t('Bangun Portofolio', 'Build Your Portfolio'), desc: t('Tampilkan karya terbaik dan bantu klien menemukan jasa Anda.', 'Showcase your best work and get discovered by clients.') },
              { icon: Zap, title: t('Lebih Cepat Dipesan', 'Get Hired Fast'), desc: t('Terhubung dengan client yang mencari skill sesuai keahlian Anda.', 'Connect with clients looking for your exact skills.') },
              { icon: Shield, title: t('Alur Approval Jelas', 'Clear Approval Flow'), desc: t('Setiap proyek punya alur review, revisi, dan approval yang mudah dilacak.', 'Every project has a clear review, revision, and approval flow you can track easily.') }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F5C800] rounded-lg mb-4">
                  <item.icon className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-[#888888]">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/register?role=freelancer" className="inline-block px-8 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
            {t('Mulai Dapat Proyek', 'Start Earning Today')}
          </Link>
        </div>
      </section>

      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-5xl md:text-6xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {t('Freelancer Pilihan Minggu Ini', 'Top Shooters This Week')}
            </h2>
            <Link to="/explore" className="text-[#F5C800] hover:underline font-bold">{t('Lihat Semua', 'See All')}</Link>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {topFreelancers.length === 0 && (
              <div className="md:col-span-4 bg-[#141414] border border-[#2A2A2A] rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold mb-2">{t('Freelancer pilihan segera hadir', 'Featured freelancers coming soon')}</h3>
                <p className="text-[#888888]">{t('Profil kreator yang siap menerima proyek akan tampil di sini.', 'Creator profiles ready for projects will appear here.')}</p>
              </div>
            )}

            {topFreelancers.map((freelancer) => (
              <div key={freelancer.id} className="bg-[#141414] rounded-xl p-6 border border-[#2A2A2A] hover:border-[#F5C800] hover:-translate-y-1 transition-all">
                <div className="relative w-full aspect-square bg-[#1A1A1A] rounded-lg mb-4 flex items-center justify-center">
                  <UserAvatar name={freelancer.name} src={freelancer.avatarUrl} className="h-24 w-24 text-3xl" />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {freelancer.available ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[#22C55E] text-white rounded-full text-xs font-bold">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        {t('Tersedia', 'Available')}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[#888888] text-white rounded-full text-xs font-bold">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        {t('Sibuk', 'Busy')}
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-bold mb-2">{freelancer.name}</h3>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {freelancer.specialty.split(/[|,]/).map((tag) => tag.trim()).filter(Boolean).map((tag, j) => (
                    <span key={j} className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-1 mb-2 text-sm">
                  <Star className="w-4 h-4 text-[#F5C800] fill-current" />
                  <span>{freelancer.rating ?? 'Baru'}</span>
                  {freelancer.reviewCount > 0 && <span className="text-[#888888]">({freelancer.reviewCount})</span>}
                </div>
                <p className="text-[#F5C800] font-bold mb-4">{t('Mulai dari', 'From')} {freelancer.price}</p>
                <Link to={`/freelancer/${freelancer.id}`} className="block w-full px-4 py-2 border border-[#888888] text-white rounded-lg hover:border-[#F5C800] hover:text-[#F5C800] transition-colors text-center">
                  {t('Lihat Profil', 'View Profile')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl mb-12 text-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            {t('Butuh Jasa Apa?', 'What Do You Need Shot?')}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {shotCategories.map((category, i) => (
              <Link
                key={i}
                to={`/explore?category=${category.name.toLowerCase()}`}
                className="relative h-64 rounded-xl overflow-hidden group cursor-pointer block bg-[#1A1A1A] mv-preserve-white"
              >
                <img
                  src={category.image}
                  alt={`${category.name} photography service`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"></div>
                <div className="absolute inset-0 border border-white/10 rounded-xl group-hover:border-[#F5C800]/70 transition-colors"></div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
                  <h3 className="text-3xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    {category.name}
                  </h3>
                  <span className="px-3 py-1 bg-[#F5C800] text-black text-sm font-bold rounded-full">
                    {t('Jelajahi', 'Explore')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mv-testimonial-section py-16 bg-[#141414] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <h2 className="text-5xl md:text-6xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Voices From The Vault
          </h2>
          <p className="text-[#888888] mt-3">{t('Cerita pilihan dari workflow kreatif yang berjalan lewat MediaVault.', 'Selected stories from creative workflows powered by MediaVault.')}</p>
        </div>
        <div className="mv-testimonial-strip relative">
          <div className="mv-testimonial-track">
            {[...testimonials, ...testimonials].map((testimonial, index) => (
              <div key={`${testimonial.name}-${index}`} className="mv-testimonial-card w-80 md:w-96 bg-[#0A0A0A] border border-[#2A2A2A] rounded-2xl p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
                <div className="text-5xl text-[#F5C800] leading-none mb-3">"</div>
                <p className="text-white leading-relaxed mb-6">{testimonial.quote}</p>
                <div>
                  <div className="font-bold text-[#F5C800]">{testimonial.name}</div>
                  <div className="text-sm text-[#888888]">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={openContact}
        className="group fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border border-[#D9A900]/50 bg-white/90 px-4 py-3 text-[#111827] shadow-[0_20px_60px_rgba(91,70,20,0.18)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-[#D9A900] hover:bg-[#FFF7D1] hover:shadow-[0_24px_70px_rgba(217,169,0,0.28)] dark:border-[#F5C800]/35 dark:bg-[#111111]/88 dark:text-white dark:shadow-[0_22px_70px_rgba(0,0,0,0.42)] dark:hover:border-[#F5C800] dark:hover:bg-[#1F1B0A]"
        aria-label={t('Buka konsultasi customer service', 'Open customer service consultation')}
      >
        <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#D9A900] text-[#111827] shadow-[0_0_28px_rgba(217,169,0,0.26)] dark:bg-[#F5C800] dark:text-black">
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-[#22C55E] dark:border-[#111111]" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-xs font-bold uppercase tracking-[0.18em] text-[#A87800] dark:text-[#F5C800]">CS</span>
          <span className="block text-sm font-bold">{t('Konsultasi', 'Consultation')}</span>
        </span>
      </button>

      <Footer />

    </div>
  );
}
