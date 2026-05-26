import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, ArrowRight, Mail } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, isRequestingReset } = useAuth();
  const { register, handleSubmit, formState: { errors }, setError, reset, formState: { isSubmitSuccessful } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await requestPasswordReset(data);
      reset();
    } catch {
      setError('root', { message: 'We could not find an account with that email address.' });
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

        <div className="relative z-10 w-full max-w-md space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-6">
              <BrandLogo markClassName="h-24 w-56" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-[#1a3a2a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Forgot Password</h2>
            <p className="mt-2 text-sm text-[#a09080]">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {isSubmitSuccessful ? (
            <div className="space-y-6 text-center">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-800">
                <p className="font-bold mb-2">Check Your Email Queue</p>
                <p>If the email is registered, password reset instructions containing your reset token and 6-digit OTP code have been queued successfully in the database queue.</p>
              </div>

              <div className="pt-2">
                <Link
                  to="/reset-password"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300"
                  style={{ background: '#1a3a2a' }}
                >
                  <span>Go to Reset Form</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="text-center">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2d6a4f] hover:underline">
                  <ArrowLeft size={16} />
                  <span>Back to login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#2d3a2a]">Email Address</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#a09080]">
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
              </div>

              {errors.root && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-4">
                <button
                  disabled={isRequestingReset}
                  type="submit"
                  className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300 disabled:opacity-50"
                  style={{ background: '#1a3a2a' }}
                >
                  {isRequestingReset ? (
                    <span>Sending Reset Instructions...</span>
                  ) : (
                    <>
                      <span>Send Reset Details</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
