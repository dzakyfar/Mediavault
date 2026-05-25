import { Link } from 'react-router';
import { Mail, X, Zap } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [showContact, setShowContact] = useState(false);
  const contacts = ['fauzanalwahyu827@gmail.com', 'dzakyfardya@gmail.com'];

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
                <li><Link to="/about" className="hover:text-[#F5C800] transition-colors">About Us</Link></li>
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
                <li><Link to="/post-job" className="hover:text-[#F5C800] transition-colors">Post a Job</Link></li>
                <li><Link to="/explore" className="hover:text-[#F5C800] transition-colors">Search Talent</Link></li>
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

      {showContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Close contact popup"
            onClick={() => setShowContact(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#F5C800]/30 bg-[#101010] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F5C800]/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

            <button
              type="button"
              onClick={() => setShowContact(false)}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-[#888888] transition-colors hover:border-[#F5C800] hover:text-[#F5C800]"
              aria-label="Close contact popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5C800] text-black shadow-[0_0_30px_rgba(245,200,0,0.25)]">
                <Mail className="h-7 w-7" />
              </div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.3em] text-[#F5C800]">Contact</p>
              <h3 className="mb-3 text-4xl text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                Talk To MediaVault
              </h3>
              <p className="mb-6 text-[#A3A3A3]">
                Punya pertanyaan, kerja sama, atau butuh bantuan project? Hubungi kami lewat email berikut.
              </p>

              <div className="space-y-3">
                {contacts.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-[#2A2A2A] bg-[#171717] px-5 py-4 text-white transition-all hover:border-[#F5C800] hover:bg-[#1F1B0A]"
                  >
                    <span className="break-all font-semibold">{email}</span>
                    <Mail className="h-5 w-5 shrink-0 text-[#F5C800]" />
                  </a>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowContact(false)}
                className="mt-7 w-full rounded-full bg-[#F5C800] px-6 py-3 font-bold text-black transition-all hover:shadow-[0_0_24px_rgba(245,200,0,0.35)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
