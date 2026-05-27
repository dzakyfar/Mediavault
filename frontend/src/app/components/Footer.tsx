import { Link } from 'react-router';
import { Mail, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';

export default function Footer() {
  const [showContact, setShowContact] = useState(false);
  const contacts = ['fauzanalwahyu827@gmail.com', 'dzakyfardya@gmail.com'];
  const scrollToTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });

  return (
    <>
      <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-6 h-6 text-[#F5C800]" />
                <span className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
              </div>
              <p className="text-[#888888] text-sm mb-4">Book. Shoot. Deliver.</p>
              <p className="text-[#888888] text-sm">Indonesia's boldest platform for creative photography and video services.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-[#888888]">
                <li><Link to="/about" onClick={scrollToTop} className="hover:text-[#F5C800] transition-colors">About Us</Link></li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowContact(true)}
                    className="hover:text-[#F5C800] transition-colors text-left"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">For Clients</h4>
              <ul className="space-y-2 text-[#888888]">
                <li><Link to="/post-job" onClick={scrollToTop} className="hover:text-[#F5C800] transition-colors">Post a Job</Link></li>
                <li><Link to="/explore" onClick={scrollToTop} className="hover:text-[#F5C800] transition-colors">Search Talent</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-white">For Freelancers</h4>
              <ul className="space-y-2 text-[#888888]">
                <li><a href="#" className="hover:text-[#F5C800] transition-colors">Success Stories</a></li>
                <li><a href="#" className="hover:text-[#F5C800] transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mb-8">
            <a href="#" className="text-[#888888] hover:text-[#F5C800] transition-colors">Instagram</a>
            <a href="#" className="text-[#888888] hover:text-[#F5C800] transition-colors">TikTok</a>
            <a href="#" className="text-[#888888] hover:text-[#F5C800] transition-colors">Twitter/X</a>
          </div>
          <div className="text-center text-[#888888] text-sm">
            Copyright 2026 MediaVault. Made in Surabaya.
          </div>
        </div>
      </footer>

      {showContact && createPortal((
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close contact popup"
            onClick={() => setShowContact(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm dark:bg-black/75"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#D9A900]/30 bg-white p-8 text-[#111827] shadow-[0_24px_80px_rgba(15,23,42,0.22)] dark:border-[#F5C800]/30 dark:bg-[#101010] dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D9A900]/20 blur-3xl dark:bg-[#F5C800]/20" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-slate-300/40 blur-3xl dark:bg-white/10" />

            <button
              type="button"
              onClick={() => setShowContact(false)}
              className="absolute right-5 top-5 rounded-full border border-slate-200 bg-slate-50 p-2 text-[#667085] transition-colors hover:border-[#D9A900] hover:text-[#A87800] dark:border-white/10 dark:bg-white/5 dark:text-[#888888] dark:hover:border-[#F5C800] dark:hover:text-[#F5C800]"
              aria-label="Close contact popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9A900] text-[#111827] shadow-[0_0_30px_rgba(217,169,0,0.22)] dark:bg-[#F5C800] dark:text-black dark:shadow-[0_0_30px_rgba(245,200,0,0.25)]">
                <Mail className="h-7 w-7" />
              </div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#A87800] dark:text-[#F5C800]">Contact</p>
              <h3 className="mb-3 text-4xl text-[#111827] dark:text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Talk To MediaVault
              </h3>
              <p className="mb-6 text-[#667085] dark:text-[#A3A3A3]">
                Punya pertanyaan, kerja sama, atau butuh bantuan project? Hubungi kami lewat email berikut.
              </p>

              <div className="space-y-3">
                {contacts.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#D8DEE8] bg-[#F7F9FC] px-5 py-4 text-[#111827] transition-all hover:border-[#D9A900] hover:bg-[#FFF8D7] dark:border-[#2A2A2A] dark:bg-[#171717] dark:text-white dark:hover:border-[#F5C800] dark:hover:bg-[#1F1B0A]"
                  >
                    <span className="break-all font-semibold">{email}</span>
                    <Mail className="h-5 w-5 shrink-0 text-[#A87800] dark:text-[#F5C800]" />
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="mt-7 w-full rounded-full bg-[#D9A900] px-6 py-3 font-bold text-[#111827] transition-all hover:shadow-[0_0_24px_rgba(217,169,0,0.28)] dark:bg-[#F5C800] dark:text-black dark:hover:shadow-[0_0_24px_rgba(245,200,0,0.35)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </>
  );
}
