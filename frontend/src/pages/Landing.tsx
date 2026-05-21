import React from 'react';
import { Link } from 'react-router-dom';
import { TreePine, Users, ArrowRight, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f4ef]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Decorative Glow Elements */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#2d6a4f]/10 blur-3xl" />
      <div className="absolute left-0 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-[#d4c9b0]/25 blur-3xl" />

      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-[#e8e0d0] bg-[#f7f4ef]/90 px-6 py-4 backdrop-blur-md transition-all duration-300">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <BrandLogo markClassName="h-16 w-36 sm:h-20 sm:w-48" />
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="px-4 py-2 font-semibold transition-colors duration-200"
            style={{ color: '#5a4a3a' }}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="group flex items-center gap-1 rounded-xl px-5 py-2.5 font-semibold text-white transition-all duration-300"
            style={{ background: '#1a3a2a' }}
          >
            <span>Get Started</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headline & CTA */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold" style={{ background: '#e8f5ee', color: '#2d6a4f', border: '1px solid #c8e6d0' }}>
              <Sparkles size={14} />
              <span>Weave your family story</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Preserve Your Legacy, <br/>
              <span style={{ color: '#2d6a4f' }}>
                One Generation
              </span>{' '}
              at a Time.
            </h1>
            
            <p className="max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: '#5a4a3a' }}>
              Build, visualize, and share your family history with our interactive family canvas. 
              Connect with your roots, collaborate with loved ones, and safeguard your stories for generations to come.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link 
                to="/register" 
                className="group flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all duration-300"
                style={{ background: '#1a3a2a' }}
              >
                <span>Create Your Family Free</span>
                <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-bold shadow-sm transition-all duration-300"
                style={{ color: '#5a4a3a', border: '1px solid #e8e0d0' }}
              >
                Explore Demo
              </Link>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-6 border-t border-[#e8e0d0] pt-8">
              <div>
                <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>100%</p>
                <p className="text-sm font-medium" style={{ color: '#a09080' }}>Private & Secure</p>
              </div>
              <div>
                <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>Interactive</p>
                <p className="text-sm font-medium" style={{ color: '#a09080' }}>React Flow Canvas</p>
              </div>
              <div>
                <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>Unlimited</p>
                <p className="text-sm font-medium" style={{ color: '#a09080' }}>Generations & Members</p>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image with Floating FX */}
          <div className="lg:col-span-5 relative">
            <div className="absolute inset-0 rounded-3xl bg-[#2d6a4f]/10 blur-2xl" />
            <div className="relative rounded-2xl bg-white p-4 shadow-2xl transition-transform duration-500 hover:scale-[1.02]" style={{ border: '1px solid #e8e0d0' }}>
              <img 
                src="/images/family_tree_hero.png" 
                alt="Interactive family illustration" 
                className="h-auto w-full rounded-xl object-cover"
              />
              
              {/* Overlay Glassmorphic Badge */}
              <div className="absolute -bottom-6 -left-6 hidden items-center gap-3 rounded-2xl bg-white/85 p-4 shadow-lg backdrop-blur-md sm:flex" style={{ border: '1px solid #e8e0d0' }}>
                <div className="rounded-xl bg-[#2d6a4f] p-2.5 text-white">
                  <Heart size={20} className="fill-current text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold leading-none" style={{ color: '#1a3a2a' }}>Collaborative</p>
                  <p className="mt-1 text-xs" style={{ color: '#a09080' }}>Connect multiple families</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>
              Powerful Features to Document Your Ancestry
            </h2>
            <p className="text-lg" style={{ color: '#5a4a3a' }}>
              Everything you need to map, customize, and tell the full story of your family history in one easy-to-use platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl" style={{ border: '1px solid #e8e0d0' }}>
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f5ee] text-[#2d6a4f] transition-transform duration-300 group-hover:scale-110">
                  <TreePine size={28} />
                </div>
                <h3 className="mb-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>Visual Family Canvas</h3>
                <p className="leading-relaxed" style={{ color: '#5a4a3a' }}>
                  Easily build and navigate your family with a drag-and-drop React Flow canvas. Add parents, children, spouses, and siblings dynamically.
                </p>
              </div>
              <div className="pt-6">
                <span className="flex items-center gap-1 text-sm font-semibold group-hover:underline" style={{ color: '#2d6a4f' }}>
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl" style={{ border: '1px solid #e8e0d0' }}>
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff6df] text-[#9a6b22] transition-transform duration-300 group-hover:scale-110">
                  <Users size={28} />
                </div>
                <h3 className="mb-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>Rich Personal Profiles</h3>
                <p className="leading-relaxed" style={{ color: '#5a4a3a' }}>
                  Create deep profiles with avatars, biographies, birth/death dates, locations, and photo galleries to preserve each member's unique stories.
                </p>
              </div>
              <div className="pt-6">
                <span className="flex items-center gap-1 text-sm font-semibold group-hover:underline" style={{ color: '#9a6b22' }}>
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group flex flex-col justify-between rounded-2xl bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl" style={{ border: '1px solid #e8e0d0' }}>
              <div>
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f5ee] text-[#2d6a4f] transition-transform duration-300 group-hover:scale-110">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="mb-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>Privacy & Protection</h3>
                <p className="leading-relaxed" style={{ color: '#5a4a3a' }}>
                  Your family data is sacred. Enjoy secure password hashing, JWT protected sessions, and customizable permissions for viewing and editing.
                </p>
              </div>
              <div className="pt-6">
                <span className="flex items-center gap-1 text-sm font-semibold group-hover:underline" style={{ color: '#2d6a4f' }}>
                  Learn more <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action Footer Card */}
        <div className="relative mt-32 overflow-hidden rounded-2xl bg-[#0d2218] p-12 text-white md:p-16">
          <div className="absolute right-0 top-0 -z-10 h-[400px] w-[400px] rounded-full bg-[#2d6a4f]/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-10 h-[300px] w-[300px] rounded-full bg-[#95d5b2]/10 blur-3xl" />
          
          <div className="max-w-3xl space-y-6 relative">
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Ready to start your family journey?
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-[#a8b8a8]">
              Create a free account and begin building your family record in minutes. Keep your family legacy alive, connected, and secure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/register" 
                className="flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all duration-300"
                style={{ background: '#2d6a4f' }}
              >
                <span>Get Started Now</span>
                <ArrowRight size={20} />
              </Link>
              <Link 
                to="/login" 
                className="flex items-center justify-center rounded-xl px-8 py-4 text-lg font-bold text-white transition-all duration-300"
                style={{ background: '#1a3a2a', border: '1px solid #2d5040' }}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
