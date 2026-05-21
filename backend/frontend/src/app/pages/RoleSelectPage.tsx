import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Zap, ShoppingBag, Camera, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../lib/api';

export default function RoleSelectPage() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'freelancer' | 'both' | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, updateRole } = useAuth();

  const roleMap: Record<'client' | 'freelancer' | 'both', UserRole> = {
    client: 'CLIENT',
    freelancer: 'FREELANCER',
    both: 'BOTH',
  };

  useEffect(() => {
    if (!user?.role) return;
    navigate(user.role === 'FREELANCER' ? '/dashboard/freelancer' : '/dashboard/client', { replace: true });
  }, [navigate, user?.role]);

  const handleContinue = async () => {
    if (!selectedRole) return;

    try {
      setSubmitting(true);
      setError('');
      const user = await updateRole(roleMap[selectedRole]);
      navigate(user.role === 'FREELANCER' ? '/dashboard/freelancer' : '/dashboard/client', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan role');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <Zap className="w-6 h-6 text-[#F5C800]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
          </Link>
          <h1 className="text-6xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            How will you use MediaVault?
          </h1>
          <p className="text-[#888888]">You can always switch later.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('client')}
            className={`p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'client'
                ? 'border-[#F5C800] shadow-[0_0_20px_rgba(245,200,0,0.3)] scale-105'
                : 'border-[#2A2A2A] hover:border-[#F5C800] hover:scale-102'
            } bg-[#141414] text-left relative`}
          >
            {selectedRole === 'client' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#F5C800] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="w-16 h-16 bg-[#F5C800] rounded-lg flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">I'm a Client</h3>
            <p className="text-[#888888] mb-6">
              I want to book photographers and videographers for my projects.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Wedding</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Product Shoot</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Event</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Corporate</span>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('freelancer')}
            className={`p-8 rounded-xl border-2 transition-all ${
              selectedRole === 'freelancer'
                ? 'border-[#F5C800] shadow-[0_0_20px_rgba(245,200,0,0.3)] scale-105'
                : 'border-[#2A2A2A] hover:border-[#F5C800] hover:scale-102'
            } bg-[#141414] text-left relative`}
          >
            {selectedRole === 'freelancer' && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-[#F5C800] rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
            <div className="w-16 h-16 bg-[#F5C800] rounded-lg flex items-center justify-center mb-6">
              <Camera className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">I'm a Freelancer</h3>
            <p className="text-[#888888] mb-6">
              I want to offer my photography or video services and get hired.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Build Portfolio</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Get Clients</span>
              <span className="px-3 py-1 bg-[#1A1A1A] text-[#888888] text-sm rounded-full">Earn Money</span>
            </div>
          </button>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={() => setSelectedRole('both')}
            className="text-[#F5C800] hover:underline"
          >
            I'm both - Client & Freelancer
          </button>
        </div>

        <div className="text-center">
          {error && (
            <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleContinue}
            disabled={!selectedRole || submitting}
            className={`px-12 py-4 rounded-full font-bold transition-all ${
              selectedRole
                ? 'bg-[#F5C800] text-black hover:shadow-[0_0_20px_rgba(245,200,0,0.4)]'
                : 'bg-[#2A2A2A] text-[#888888] cursor-not-allowed'
            }`}
          >
            {submitting ? 'SAVING...' : 'CONTINUE'}
          </button>
          <p className="text-[#888888] text-sm mt-4">
            You can switch roles anytime from your dashboard settings.
          </p>
        </div>
      </div>
    </div>
  );
}
