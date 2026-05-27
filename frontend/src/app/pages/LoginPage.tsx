import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPathForRole } from '../lib/api';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleSignupConsentModal from '../components/GoogleSignupConsentModal';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingGoogleCredential, setPendingGoogleCredential] = useState('');
  const [googleConsentError, setGoogleConsentError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email, password);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    try {
      setError('');
      setGoogleConsentError('');
      setSubmitting(true);
      const user = await loginWithGoogle(credential);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      if (err instanceof Error && err.message.includes('GOOGLE_SIGNUP_REQUIRES_CONSENT')) {
        setPendingGoogleCredential(credential);
        return;
      }

      setError(err instanceof Error ? err.message : 'Login Google gagal');
    } finally {
      setSubmitting(false);
    }
  };

  const completeGoogleSignup = async (password: string) => {
    try {
      setSubmitting(true);
      setGoogleConsentError('');
      const user = await loginWithGoogle(pendingGoogleCredential, {
        acceptedTerms: true,
        password,
      });
      setPendingGoogleCredential('');
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setGoogleConsentError(err instanceof Error ? err.message : 'Registrasi Google gagal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-[#0A0A0A] flex mv-ambient" style={{ fontFamily: 'DM Sans, sans-serif' }}>
      <div className="hidden md:flex md:w-1/2 bg-[#0A0A0A] relative overflow-hidden">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 z-10">
          <Zap className="w-6 h-6 text-[#F5C800]" />
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
        </Link>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-6xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              Your next shoot
              <br />
              starts here.
            </h2>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#F5C800]/20 to-transparent"></div>
      </div>

      <div className="w-full md:w-1/2 bg-[#141414] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="md:hidden flex items-center gap-2 mb-8">
            <Zap className="w-6 h-6 text-[#F5C800]" />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>MediaVault</span>
          </Link>

          <h1 className="text-5xl text-white mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Welcome back.
          </h1>
          <p className="text-[#888888] mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F5C800] hover:underline">
              Sign up free
            </Link>
          </p>

          <GoogleSignInButton disabled={submitting} text="signin_with" onCredential={handleGoogleLogin} />

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
            <span className="text-[#888888] text-sm">or</span>
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end mb-6">
              <a href="#" className="text-[#888888] text-sm hover:text-[#F5C800] transition-colors">
                Forgot password?
              </a>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5C800] text-black font-bold py-4 rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
            >
              {submitting ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          <p className="text-center text-[#888888] text-sm mt-6">
            New here?{' '}
            <Link to="/register" className="text-[#F5C800] hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
    <GoogleSignupConsentModal
      open={Boolean(pendingGoogleCredential)}
      submitting={submitting}
      error={googleConsentError}
      onCancel={() => {
        setPendingGoogleCredential('');
        setGoogleConsentError('');
      }}
      onConfirm={completeGoogleSignup}
    />
    </>
  );
}
