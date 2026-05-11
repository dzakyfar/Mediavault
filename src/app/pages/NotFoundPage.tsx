import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="text-center max-w-md">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-[#F5C800] mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Page Not Found
          </h2>
          <p className="text-[#888888] mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F5C800] text-black font-bold rounded-lg hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-black transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        <div className="mt-12 p-6 bg-[#141414] border border-[#2A2A2A] rounded-xl">
          <p className="text-sm text-[#888888] mb-2">Quick Links:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Link to="/explore" className="text-[#F5C800] hover:underline text-sm">Explore</Link>
            <span className="text-[#888888]">•</span>
            <Link to="/pricing" className="text-[#F5C800] hover:underline text-sm">Pricing</Link>
            <span className="text-[#888888]">•</span>
            <Link to="/login" className="text-[#F5C800] hover:underline text-sm">Login</Link>
            <span className="text-[#888888]">•</span>
            <Link to="/register" className="text-[#F5C800] hover:underline text-sm">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
