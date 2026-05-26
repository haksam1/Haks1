import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch {
      setError('root', { message: 'Invalid email or password' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative hidden min-h-screen overflow-hidden bg-[#0d2218] lg:block">
        <img
          src="/images/download.png"
          alt="Family archive"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2218]/70 via-transparent to-transparent" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] px-6 py-10 sm:px-10 lg:px-16">
        {/* Back to Home Link */}
        <div className="absolute left-6 top-6 sm:left-10 sm:top-10 lg:left-16 lg:top-16 z-20">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2d6a4f] hover:underline">
            <ArrowLeft size={16} />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Background Decorative Glows */}
        <div className="pointer-events-none absolute right-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-[#2d6a4f]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-[450px] w-[450px] rounded-full bg-[#d4c9b0]/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-6">
              <BrandLogo markClassName="h-24 w-56" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>Welcome Back</h2>
            <p className="mt-2 text-sm" style={{ color: '#a09080' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold transition-colors" style={{ color: '#2d6a4f' }}>
                Create a free account
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Mail size={18} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold hover:underline" style={{ color: '#2d6a4f' }}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-xl py-3 pl-10 pr-12 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 transition-colors"
                    style={{ color: '#a09080' }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
              </div>
            </div>

            {errors.root && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {errors.root.message}
              </div>
            )}

            <div>
              <button
                disabled={isLoggingIn}
                type="submit"
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300 disabled:opacity-50"
                style={{ background: '#1a3a2a' }}
              >
                {isLoggingIn ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
