import { Link } from 'react-router';
import { ArrowRight, Camera, CheckCircle2, Clapperboard, Quote, Sparkles, Star, TrendingUp, Users, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';

const stories = [
  {
    name: 'Raka Photo',
    role: 'Wedding & Product Photographer',
    city: 'Surabaya',
    metric: '+38%',
    metricLabel: 'repeat order',
    icon: Camera,
    title: 'Dari portofolio sederhana menjadi vendor wedding yang rutin mendapat permintaan.',
    titleEn: 'From a simple portfolio to a wedding vendor with steady requests.',
    quote: 'MediaVault membantu klien melihat style saya sejak awal. Brief lebih jelas, revisi lebih terarah, dan proyek terasa lebih profesional.',
    quoteEn: 'MediaVault helps clients understand my style from the start. Briefs are clearer, revisions are focused, and projects feel more professional.',
    tags: ['Wedding', 'Product Shoot', 'Surabaya'],
  },
  {
    name: 'Maya Visual',
    role: 'Videographer & Editor',
    city: 'Bandung',
    metric: '4.9',
    metricLabel: 'avg rating',
    icon: Clapperboard,
    title: 'Workflow review draft membuat campaign brand lebih cepat selesai.',
    titleEn: 'Draft review workflows helped brand campaigns finish faster.',
    quote: 'Klien bisa approval dan minta revisi di satu tempat. Saya tidak perlu bongkar chat lama hanya untuk mencari catatan revisi.',
    quoteEn: 'Clients can approve and request revisions in one place. I no longer dig through old chats just to find revision notes.',
    tags: ['Corporate', 'Fashion', 'Video'],
  },
  {
    name: 'Dion Studio',
    role: 'Real Estate & Event Creator',
    city: 'Malang',
    metric: '12',
    metricLabel: 'projects tracked',
    icon: Sparkles,
    title: 'Tracker proyek membantu klien properti merasa lebih percaya.',
    titleEn: 'Project tracking helped real estate clients feel more confident.',
    quote: 'Untuk project properti, detail lokasi dan file referensi itu penting. MediaVault membuat semua asset tersusun dari awal sampai final.',
    quoteEn: 'For real estate projects, location details and reference files matter. MediaVault keeps every asset organized from start to finish.',
    tags: ['Real Estate', 'Concert', 'Tracking'],
  },
];

const highlights = [
  { icon: Users, label: '500+ freelancer', labelEn: '500+ freelancers' },
  { icon: Star, label: 'Review transparan', labelEn: 'Transparent reviews' },
  { icon: TrendingUp, label: 'Workflow bertumbuh', labelEn: 'Scalable workflow' },
];

export default function SuccessStoriesPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen overflow-hidden bg-[#F6F1E3] text-[#17130A] dark:bg-[#0A0A0A] dark:text-white mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <Navbar />

      <main>
        <section className="relative border-b border-[#E0D5B8] dark:border-[#2A2A2A]">
          <div className="absolute inset-0 opacity-60">
            <div className="absolute -top-28 right-10 h-96 w-96 rounded-full bg-[#D9A900]/25 blur-3xl dark:bg-[#F5C800]/20" />
            <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[#B58A00]/10 blur-3xl dark:bg-[#3B82F6]/10" />
          </div>
          <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#D9A900]/40 bg-[#FFF4B8] px-4 py-2 text-sm font-bold text-[#8A6500] dark:border-[#F5C800]/40 dark:bg-[#F5C800]/10 dark:text-[#F5C800]">
                <Zap className="h-4 w-4" />
                {t('Cerita Sukses Freelancer', 'Freelancer Success Stories')}
              </div>
              <h1 className="text-6xl md:text-8xl leading-none" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                {t('Kreator tumbuh bersama workflow yang jelas.', 'Creators grow with a clearer workflow.')}
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-[#6E6250] dark:text-[#A3A3A3]">
                {t(
                  'Cerita ini menggambarkan bagaimana freelancer MediaVault mengubah portofolio, komunikasi, tracking, dan review menjadi pengalaman kerja yang lebih dipercaya klien.',
                  'These stories show how MediaVault freelancers turn portfolios, communication, tracking, and reviews into a more trusted client experience.'
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {highlights.map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-[#DED1AE] bg-white/70 px-4 py-2 text-sm text-[#4F4537] shadow-sm dark:border-[#2A2A2A] dark:bg-[#141414] dark:text-[#D6D6D6]">
                    <item.icon className="h-4 w-4 text-[#B58A00] dark:text-[#F5C800]" />
                    {t(item.label, item.labelEn)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-3">
            {stories.map((story, index) => (
              <article
                key={story.name}
                className={`group relative overflow-hidden rounded-3xl border border-[#DED1AE] bg-white/85 p-6 shadow-[0_18px_60px_rgba(91,70,20,0.08)] transition-all duration-300 hover:-translate-y-2 hover:border-[#D9A900] hover:shadow-[0_24px_80px_rgba(217,169,0,0.16)] dark:border-[#2A2A2A] dark:bg-[#141414] dark:shadow-none dark:hover:border-[#F5C800] dark:hover:shadow-[0_24px_80px_rgba(245,200,0,0.12)] ${
                  index === 1 ? 'lg:translate-y-8' : ''
                }`}
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#D9A900]/15 blur-2xl transition-opacity group-hover:opacity-100 dark:bg-[#F5C800]/10" />
                <div className="relative mb-8 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9A900] text-[#17130A] dark:bg-[#F5C800] dark:text-black">
                      <story.icon className="h-7 w-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#17130A] dark:text-white">{story.name}</h2>
                      <p className="text-sm text-[#7A6F5F] dark:text-[#888888]">{story.city}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[#D9A900]/30 bg-[#FFF4B8] px-3 py-2 text-right dark:border-[#F5C800]/30 dark:bg-[#F5C800]/10">
                    <div className="font-bold text-[#9C7400] dark:text-[#F5C800]">{story.metric}</div>
                    <div className="text-[11px] uppercase tracking-widest text-[#7A6F5F] dark:text-[#888888]">{story.metricLabel}</div>
                  </div>
                </div>

                <h3 className="relative mb-5 text-3xl leading-tight" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t(story.title, story.titleEn)}
                </h3>
                <div className="relative rounded-2xl border border-[#E0D5B8] bg-[#FFF9E7] p-5 dark:border-[#2A2A2A] dark:bg-[#0A0A0A]">
                  <Quote className="mb-3 h-6 w-6 text-[#B58A00] dark:text-[#F5C800]" />
                  <p className="text-[#4F4537] dark:text-[#D6D6D6]">{t(story.quote, story.quoteEn)}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-[#FFF4B8] px-3 py-1 text-xs font-bold text-[#8A6500] dark:bg-[#F5C800]/10 dark:text-[#F5C800]">
                      #{tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="overflow-hidden rounded-3xl border border-[#D9A900]/30 bg-gradient-to-r from-white via-[#FFF9E7] to-[#F1DE9D] p-8 shadow-[0_24px_80px_rgba(91,70,20,0.12)] dark:border-[#F5C800]/30 dark:bg-gradient-to-r dark:from-[#1A1A1A] dark:via-[#121212] dark:to-[#1F1B0A] dark:shadow-none md:p-10">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 text-[#9C7400] dark:text-[#F5C800]">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-bold">{t('Siap jadi cerita berikutnya?', 'Ready to be the next story?')}</span>
                </div>
                <h2 className="text-4xl md:text-5xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                  {t('Bangun profil, tampilkan portofolio, dan biarkan klien menemukan style Anda.', 'Build your profile, showcase your portfolio, and let clients discover your style.')}
                </h2>
              </div>
              <Link
                to="/register?role=freelancer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D9A900] px-6 py-4 font-bold text-[#17130A] transition-all hover:shadow-[0_0_30px_rgba(217,169,0,0.35)] dark:bg-[#F5C800] dark:text-black dark:hover:shadow-[0_0_30px_rgba(245,200,0,0.35)]"
              >
                {t('Mulai sebagai Freelancer', 'Start as Freelancer')}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
