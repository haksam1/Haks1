import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, ArrowRight, Eye, EyeOff, User, Mail, Lock, Calendar, Phone } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.string().min(1, 'Gender is required'),
  birthDate: z.string().min(1, 'Birth date is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
});

type RegisterForm = z.infer<typeof registerSchema>;

type ApiError = {
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

const getRegistrationErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const message = (error as ApiError).response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Registration failed';
};

const Register: React.FC = () => {
  const { register: registerUser, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors }, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      await registerUser({
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        gender: data.gender,
        birthDate: data.birthDate,
        phoneNumber: data.phoneNumber,
      });
      navigate('/dashboard');
    } catch (err) {
      setError('root', { message: getRegistrationErrorMessage(err) });
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative hidden min-h-screen overflow-hidden bg-[#0d2218] lg:block">
        <img
          src="/images/a6f0ee47983db8d24888b20ba02f9099.jpg"
          alt="Family moments"
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

        <div className="relative z-10 w-full max-w-xl space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl mb-6">
              <BrandLogo markClassName="h-24 w-56" />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>Create your account</h2>
            <p className="mt-2 text-sm" style={{ color: '#a09080' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-semibold transition-colors" style={{ color: '#2d6a4f' }}>
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>First Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <User size={18} />
                  </div>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Last Name</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <User size={18} />
                  </div>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Birth Date</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Calendar size={18} />
                  </div>
                  <input
                    {...register('birthDate')}
                    type="date"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                  />
                </div>
                {errors.birthDate && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.birthDate.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Gender</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <User size={18} />
                  </div>
                  <select
                    {...register('gender')}
                    className="block w-full rounded-xl py-3 pl-10 pr-10 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200 appearance-none bg-no-repeat bg-white"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5" style={{ color: '#a09080' }}>
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
                {errors.gender && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.gender.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Phone Number</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Phone size={18} />
                  </div>
                  <input
                    {...register('phoneNumber')}
                    type="tel"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                    placeholder="+1 555-019-2834"
                  />
                </div>
                {errors.phoneNumber && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Email Address</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Mail size={18} />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    className="block w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Password</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5" style={{ color: '#a09080' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full rounded-xl py-3 pl-10 pr-12 text-sm outline-none border-[1.5px] border-[#e8e0d0] focus:border-[#2d6a4f] transition-all duration-200"
                    style={{ background: '#fff', color: '#2d3a2a' }}
                    placeholder="Min. 6 characters"
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
                disabled={isRegistering}
                type="submit"
                className="group relative flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-bold text-white transition-all duration-300 disabled:opacity-50"
                style={{ background: '#1a3a2a' }}
              >
                {isRegistering ? (
                  <span>Creating account...</span>
                ) : (
                  <>
                    <span>Sign Up</span>
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

export default Register;
