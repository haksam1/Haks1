import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Hash, Key, Lock } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one digit')
  .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@$!%*?&)');

const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    otp_code: z.string().length(6, 'OTP code must be exactly 6 digits'),
    new_password: passwordSchema,
    confirm_password: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword: React.FC = () => {
  const { resetPassword, isResettingPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const queryToken = searchParams.get('token') || '';

  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: queryToken,
      otp_code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const passwordVal = watch('new_password') || '';

  // Password strength checks for real-time UI indicator
  const hasMinLength = passwordVal.length >= 8;
  const hasLowercase = /[a-z]/.test(passwordVal);
  const hasUppercase = /[A-Z]/.test(passwordVal);
  const hasDigit = /\d/.test(passwordVal);
  const hasSpecial = /[@$!%*?&]/.test(passwordVal);

  const onSubmit = async (data: ResetPasswordForm) => {
    try {
      await resetPassword({
        token: data.token,
        otp_code: data.otp_code,
        new_password: data.new_password,
      });
      navigate('/login');
    } catch {
      setError('root', { message: 'Failed to reset password. Verify your token or OTP.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Side Image Banner */}
      <div className="relative hidden min-h-screen overflow-hidden bg-[#0d2218] lg:block">
        <img
          src="/images/download.png"
          alt="Family archive"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d2218]/70 via-transparent to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] px-6 py-10 sm:px-10 lg:px-16">
        {/* Background Decorative Glows */}
        <div className="pointer-events-none absolute right-0 top-0 z-0 h-[400px] w-[400px] rounded-full bg-[#2d6a4f]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 z-0 h-[450px] w-[450px] rounded-full bg-[#d4c9b0]/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-md space-y-6">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-4">
              <BrandLogo markClassName="h-24 w-56" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-[#1a3a2a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Reset Password</h2>
            <p className="mt-1 text-sm text-[#a09080]">
              Create a new secure password for your family tree account.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-3">
              {/* Token Field */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#2d3a2a]">Reset Token</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#a09080]">
                    <Key size={18} />
                  </div>
                  <input
                    {...register('token')}
                    type="text"
                    className="block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="Enter UUID token"
                  />
                </div>
                {errors.token && <p className="text-red-500 text-xs mt-1 ml-1">{errors.token.message}</p>}
              </div>

              {/* OTP Field */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#2d3a2a]">6-Digit OTP Code</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#a09080]">
                    <Hash size={18} />
                  </div>
                  <input
                    {...register('otp_code')}
                    type="text"
                    maxLength={6}
                    className="block w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="e.g. 123456"
                  />
                </div>
                {errors.otp_code && <p className="text-red-500 text-xs mt-1 ml-1">{errors.otp_code.message}</p>}
              </div>

              {/* Password Field */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#2d3a2a]">New Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#a09080]">
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('new_password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-xl py-2.5 pl-10 pr-12 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#a09080] hover:text-[#5a4a3a]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.new_password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.new_password.message}</p>}
              </div>

              {/* Real-time Password Strength Criteria */}
              <div className="rounded-xl border border-[#e8e0d0] bg-[#fff] p-3 text-xs space-y-1.5 text-[#5a4a3a]">
                <p className="font-bold text-[#2d3a2a] mb-1">Password Strength Requirements:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-red-300'}`} />
                    <span>Min 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-red-300'}`} />
                    <span>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${hasLowercase ? 'bg-emerald-500' : 'bg-red-300'}`} />
                    <span>One lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${hasDigit ? 'bg-emerald-500' : 'bg-red-300'}`} />
                    <span>One digit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block h-2 w-2 rounded-full ${hasSpecial ? 'bg-emerald-500' : 'bg-red-300'}`} />
                    <span>One special char</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#2d3a2a]">Confirm Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#a09080]">
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('confirm_password')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="block w-full rounded-xl py-2.5 pl-10 pr-12 text-sm outline-none transition-all duration-200"
                    style={{ background: '#fff', border: '1.5px solid #e8e0d0', color: '#2d3a2a' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#a09080] hover:text-[#5a4a3a]"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirm_password.message}</p>}
              </div>
            </div>

            {errors.root && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                disabled={isResettingPassword}
                type="submit"
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300 disabled:opacity-50"
                style={{ background: '#1a3a2a' }}
              >
                {isResettingPassword ? (
                  <span>Resetting Password...</span>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2d6a4f] hover:underline">
                  <ArrowLeft size={16} />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
