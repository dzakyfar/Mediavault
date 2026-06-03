import { Link } from 'react-router';
import {
  ArrowRight,
  Bell,
  Building2,
  Camera,
  CheckCircle2,
  Clapperboard,
  FolderLock,
  HeartHandshake,
  Home,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Video,
  Wand2,
  Workflow,
  Zap,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const pillars = [
  {
    icon: Workflow,
    titleId: 'Alur Project Terstruktur',
    titleEn: 'Structured Project Flow',
    descriptionId: 'Brief, request, approval, revisi, dan delivery tersusun dalam satu workspace yang jelas.',
    descriptionEn: 'Briefs, requests, approvals, revisions, and delivery are organized in one clear workspace.',
  },
  {
    icon: FolderLock,
    titleId: 'Aset Kreatif Lebih Aman',
    titleEn: 'Secure Creative Assets',
    descriptionId: 'Reference file dan aset produksi dirancang agar tetap rapi, terlacak, dan mudah diakses kembali.',
    descriptionEn: 'Reference files and production assets are designed to stay organized, traceable, and easy to access.',
  },
  {
    icon: ShieldCheck,
    titleId: 'Kolaborasi Transparan',
    titleEn: 'Transparent Collaboration',
    descriptionId: 'Client dan freelancer dapat mengikuti status project, pesan, notifikasi, dan riwayat review.',
    descriptionEn: 'Clients and freelancers can follow project status, messages, notifications, and review history.',
  },
];

const services = [
  { nameId: 'Fotografi', nameEn: 'Photography', icon: Camera },
  { nameId: 'Videografi', nameEn: 'Videography', icon: Video },
  { nameId: 'Foto Produk', nameEn: 'Product Shoot', icon: Package },
  { nameId: 'Dokumentasi Wedding', nameEn: 'Wedding Documentation', icon: HeartHandshake },
  { nameId: 'Event Corporate', nameEn: 'Corporate Event', icon: Building2 },
  { nameId: 'Foto Real Estate', nameEn: 'Real Estate Shoot', icon: Home },
  { nameId: 'Editing Kreatif', nameEn: 'Creative Editing', icon: Wand2 },
  { nameId: 'Konten Digital', nameEn: 'Digital Content', icon: Smartphone },
];

const platformHighlights = [
  {
    id: 'Sistem akun dual-role untuk client dan freelancer',
    en: 'Dual-role account system for clients and freelancers',
  },
  {
    id: 'Pencarian freelancer dengan filter kategori, rating, lokasi, dan availability',
    en: 'Freelancer discovery with category, rating, location, and availability filters',
  },
  {
    id: 'Alur job request dengan budget, timeline, lokasi, dan reference file',
    en: 'Job request flow with budget, timeline, location, and reference files',
  },
  {
    id: 'Project tracker dengan approval client dan loop revisi',
    en: 'Project tracker with client approval and revision loop',
  },
  {
    id: 'Notifikasi dan pesan untuk update project penting',
    en: 'Notifications and messages for important project updates',
  },
  {
    id: 'Sistem rating dan review untuk menjaga kualitas layanan',
    en: 'Rating and review system to maintain service quality',
  },
];

export default function AboutUsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main>
        <section className="relative">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F5C800]/20 blur-3xl" />
            <div className="absolute top-64 -left-20 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-28">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#2A2A2A] rounded-full text-[#F5C800] text-sm font-bold mb-6">
                  <Zap className="w-4 h-4" />
                  {t('Portal Klien MediaVault', 'MediaVault Client Portal')}
                </div>
                <h1 className="text-6xl md:text-8xl mb-6" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                  {t('Kerja Kreatif,', 'Creative Work,')}
                  <br />
                  <span className="text-[#F5C800]">{t('Lebih Rapi.', 'Organized.')}</span>
                </h1>
                <p className="text-lg md:text-xl text-[#888888] max-w-2xl leading-relaxed mb-8">
                  {t(
                    'MediaVault adalah platform web freelance multimedia yang membantu client menemukan talenta kreatif, mengelola request pekerjaan, memantau progress project, dan menjaga distribusi file tetap rapi, aman, serta transparan.',
                    'MediaVault is a multimedia freelance web platform that helps clients discover creative talent, manage job requests, track project progress, and keep file distribution organized, secure, and transparent.'
                  )}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/explore"
                    className="inline-flex items-center gap-2 px-7 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_24px_rgba(245,200,0,0.35)] transition-all"
                  >
                    {t('Explore Freelancer', 'Explore Freelancers')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/post-job"
                    className="inline-flex items-center gap-2 px-7 py-4 border border-[#888888] text-white font-bold rounded-full hover:border-[#F5C800] hover:text-[#F5C800] transition-all"
                  >
                    {t('Mulai Proyek', 'Start a Project')}
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 translate-x-6 translate-y-6 rounded-[2rem] bg-[#F5C800]/20 blur-sm" />
                <div className="relative bg-[#141414] border border-[#2A2A2A] rounded-[2rem] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] mv-glass-card mv-float-soft">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
                      <Camera className="w-9 h-9 text-[#F5C800] mb-4" />
                      <div className="text-3xl font-bold">Photo</div>
                      <div className="text-sm text-[#888888]">{t('Produksi profesional', 'Professional shoot')}</div>
                    </div>
                    <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-[#2A2A2A]">
                      <Clapperboard className="w-9 h-9 text-[#F5C800] mb-4" />
                      <div className="text-3xl font-bold">Video</div>
                      <div className="text-sm text-[#888888]">{t('Produksi kreatif', 'Creative production')}</div>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] rounded-2xl p-5 border border-[#2A2A2A] mb-5">
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-[#888888]">{t('Transparansi Proyek', 'Project Transparency')}</span>
                      <span className="text-[#F5C800] font-bold">85%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#1A1A1A] overflow-hidden">
                      <div className="h-full w-[85%] bg-[#F5C800] rounded-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-xs text-[#888888]">
                      <span>{t('Brief', 'Brief')}</span>
                      <span>{t('Review', 'Review')}</span>
                      <span>{t('Approval', 'Approval')}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      t('Permintaan pekerjaan lebih terstruktur', 'More structured job requests'),
                      t('Progress dapat dipantau kedua pihak', 'Progress can be tracked by both parties'),
                      t('Review dan rating menjaga kualitas', 'Reviews and ratings help maintain quality'),
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-3">
                        <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                        <span className="text-sm text-[#888888]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10 items-start">
              <div>
                <p className="text-[#F5C800] font-bold mb-3">{t('Profil Perusahaan', 'Company Profile')}</p>
                <h2 className="text-5xl md:text-6xl mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                  {t('Dibangun untuk Workflow Kreatif Indonesia', "Built for Indonesia's Creative Workflow")}
                </h2>
                <p className="text-[#888888] leading-relaxed">
                  {t(
                    'MediaVault dikembangkan untuk menjawab masalah umum dalam industri kreatif digital: pemesanan yang tersebar di chat, progress yang sulit dilacak, file produksi yang berantakan, dan kolaborasi yang kurang transparan.',
                    'MediaVault was developed to solve common problems in the digital creative industry: scattered orders across chats, hard-to-track progress, messy production files, and collaboration that lacks transparency.'
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-6 hover:border-[#F5C800] hover:-translate-y-1 transition-all">
                    <pillar.icon className="w-10 h-10 text-[#F5C800] mb-5" />
                    <h3 className="text-xl font-bold mb-3">{t(pillar.titleId, pillar.titleEn)}</h3>
                    <p className="text-sm text-[#888888] leading-relaxed">{t(pillar.descriptionId, pillar.descriptionEn)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-10">
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-[2rem] p-8">
                <Sparkles className="w-10 h-10 text-[#F5C800] mb-5" />
                <h2 className="text-4xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Visi Kami', 'Our Vision')}</h2>
                <p className="text-[#888888] leading-relaxed">
                  {t(
                    'Menjadi portal kreatif yang membantu client dan freelancer multimedia bekerja lebih profesional, efisien, aman, dan mudah dipantau dari awal request hingga hasil akhir.',
                    'To become a creative portal that helps clients and multimedia freelancers work more professionally, efficiently, securely, and transparently from the first request to final delivery.'
                  )}
                </p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-[2rem] p-8">
                <Bell className="w-10 h-10 text-[#F5C800] mb-5" />
                <h2 className="text-4xl mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>{t('Misi Kami', 'Our Mission')}</h2>
                <p className="text-[#888888] leading-relaxed">
                  {t(
                    'Menyatukan discovery freelancer, job request, project tracking, komunikasi, file management, notifikasi, serta review kualitas dalam satu pengalaman web yang modern dan mudah digunakan.',
                    'To unify freelancer discovery, job requests, project tracking, communication, file management, notifications, and quality reviews into one modern and easy-to-use web experience.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
              <div>
                <p className="text-[#F5C800] font-bold mb-3">{t('Layanan yang Didukung', 'What We Support')}</p>
                <h2 className="text-5xl md:text-6xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Layanan Multimedia', 'Multimedia Services')}
                </h2>
              </div>
              <p className="text-[#888888] max-w-xl">
                {t(
                  'Fokus MediaVault adalah layanan kreatif visual dan multimedia yang membutuhkan brief jelas, approval rapi, dan pengelolaan file yang aman.',
                  'MediaVault focuses on visual and multimedia creative services that need clear briefs, clean approvals, and secure file management.'
                )}
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((service) => (
                <div key={service.nameEn} className="group bg-[#141414] border border-[#2A2A2A] rounded-2xl p-5 hover:border-[#F5C800] hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[#1A1A1A] flex items-center justify-center mb-5 group-hover:bg-[#F5C800] transition-colors">
                    <service.icon className="w-5 h-5 text-[#F5C800] group-hover:text-black transition-colors" />
                  </div>
                  <div className="font-bold">{t(service.nameId, service.nameEn)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-[#141414] border border-[#2A2A2A] rounded-[2rem] p-8 md:p-10 overflow-hidden relative">
              <div className="absolute right-0 top-0 w-72 h-72 bg-[#F5C800]/10 rounded-full blur-3xl" />
              <div className="relative grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
                <div>
                  <p className="text-[#F5C800] font-bold mb-3">{t('Highlight Platform', 'Platform Highlights')}</p>
                  <h2 className="text-5xl md:text-6xl mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
                    {t('Satu Tempat untuk Klien dan Kreator', 'One Place for Client and Creator')}
                  </h2>
                  <p className="text-[#888888] leading-relaxed">
                    {t(
                      'MediaVault dirancang sebagai satu pintu kerja untuk kebutuhan kreatif: mencari talent, membuat brief, mengelola project, mengirim draft, meminta revisi, hingga memberi ulasan.',
                      'MediaVault is designed as one workspace for creative needs: finding talent, creating briefs, managing projects, sending drafts, requesting revisions, and leaving reviews.'
                    )}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {platformHighlights.map((highlight) => (
                    <div key={highlight.en} className="flex items-start gap-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-4">
                      <CheckCircle2 className="w-5 h-5 text-[#F5C800] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[#888888]">{t(highlight.id, highlight.en)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-[#141414]">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F5C800] rounded-2xl mb-6">
              <Search className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-5xl md:text-6xl mb-5" style={{ fontFamily: 'Bebas Neue, sans-serif', lineHeight: 1 }}>
              {t('Siap Membuat Proyek Kreatif yang Lebih Rapi?', 'Ready to Build a Cleaner Creative Project?')}
            </h2>
            <p className="text-[#888888] leading-relaxed max-w-2xl mx-auto mb-8">
              {t(
                'Mulai dari mencari freelancer sampai mengelola progress pekerjaan, MediaVault membantu proses kreatif terasa lebih jelas, terukur, dan profesional.',
                'From finding freelancers to managing work progress, MediaVault helps creative processes feel clearer, measurable, and professional.'
              )}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_24px_rgba(245,200,0,0.35)] transition-all"
            >
              {t('Cari Talent Kreatif', 'Find Creative Talent')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
