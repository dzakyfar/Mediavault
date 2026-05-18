import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Zap } from 'lucide-react';
import { applyTheme, getNextTheme, getStoredTheme, setStoredTheme } from '../lib/theme';
import type { ThemeName } from '../lib/theme';

export default function Navbar() {
  const [theme, setTheme] = useState<ThemeName>(() => getStoredTheme());
  const isDark = theme === 'dark';

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((currentTheme) => setStoredTheme(getNextTheme(currentTheme)));
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0A0A]/90 border-b border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-white hover:text-[#F5C800] transition-colors">How It Works</a>
          <a href="#for-freelancers" className="text-white hover:text-[#F5C800] transition-colors">For Freelancers</a>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg hover:bg-[#141414] transition-colors"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <Link to="/login" className="px-4 py-2 border border-white rounded-full hover:bg-white hover:text-black transition-all">
            Login
          </Link>
          <Link to="/register" className="px-6 py-2 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
