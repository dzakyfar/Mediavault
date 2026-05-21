import { Link } from 'react-router';
import { Zap } from 'lucide-react';

export default function Footer() {
  return (
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
              <li><a href="#" className="hover:text-[#F5C800] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#F5C800] transition-colors">Contact</a></li>
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
  );
}
