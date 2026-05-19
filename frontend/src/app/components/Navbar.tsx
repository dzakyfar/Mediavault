import { Link } from 'react-router';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors ${
      isLight ? 'bg-[#EEF2F6]/95 border-[#D8DEE8]' : 'bg-[#0A0A0A]/90 border-[#2A2A2A]'
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className={isLight ? 'flex items-center gap-2 text-black' : 'flex items-center gap-2 text-white'}>
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </Link>
        <div className="hidden md:flex items-center gap-8" />
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-3 py-2 rounded-lg text-[#F5C800] transition-colors text-sm font-bold ${
              isLight ? 'hover:bg-[#E4EAF2]' : 'hover:bg-[#141414]'
            }`}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
          {user ? (
            <>
              <Link
                to={dashboardPathForRole(user.role)}
                className={`px-4 py-2 border rounded-full transition-all ${
                  isLight
                    ? 'border-black text-black hover:bg-black hover:text-white'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                Dashboard
              </Link>
              <button onClick={logout} className="px-4 py-2 text-[#EF4444] hover:text-[#FF6B6B] transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`px-4 py-2 border rounded-full transition-all ${
                  isLight
                    ? 'border-black text-black hover:bg-black hover:text-white'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                Login
              </Link>
              <Link to="/register" className="px-6 py-2 bg-[#F5C800] text-black font-bold rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
