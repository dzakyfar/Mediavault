import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match";
    }
    if (!formData.agreedToTerms) newErrors.terms = 'You must agree to the terms';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard/client');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registrasi gagal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async (credential: string) => {
    try {
      setErrors({});
      setSubmitting(true);
      await loginWithGoogle(credential);
      navigate('/dashboard/client');
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Registrasi Google gagal',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex" style={{ fontFamily: 'DM Sans, sans-serif' }}>
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
            Create your account.
          </h1>

          <GoogleSignInButton disabled={submitting} text="signup_with" onCredential={handleGoogleRegister} />

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
            <span className="text-[#888888] text-sm">or</span>
            <div className="flex-1 h-px bg-[#2A2A2A]"></div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Budi Santoso"
                className={`w-full bg-[#1A1A1A] border ${errors.fullName ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
              />
              {errors.fullName && <p className="text-[#EF4444] text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                className={`w-full bg-[#1A1A1A] border ${errors.email ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
              />
              {errors.email && <p className="text-[#EF4444] text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className={`w-full bg-[#1A1A1A] border ${errors.password ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-[#EF4444] text-sm mt-1">{errors.password}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-[#888888] text-sm mb-2">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                  className={`w-full bg-[#1A1A1A] border ${errors.confirmPassword ? 'border-[#EF4444]' : 'border-[#2A2A2A]'} rounded-lg px-4 py-3 text-white placeholder-[#888888] focus:border-[#F5C800] focus:outline-none focus:ring-2 focus:ring-[#F5C800]/20 transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888] hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-[#EF4444] text-sm mt-1">{errors.confirmPassword}</p>}
            </div>

            <div className="mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#F5C800] focus:ring-[#F5C800]"
                />
                <span className="text-sm text-[#888888]">
                  I agree to the{' '}
                  <a href="#" className="text-[#F5C800] hover:underline">
                    Terms of Service
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-[#F5C800] hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
            {errors.terms && <p className="text-[#EF4444] text-sm mt-1">{errors.terms}</p>}
            </div>

            {errors.form && (
              <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444] rounded-lg text-[#EF4444] text-sm">
                {errors.form}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#F5C800] text-black font-bold py-4 rounded-full hover:shadow-[0_0_20px_rgba(245,200,0,0.4)] transition-all"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-[#888888] text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5C800] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
