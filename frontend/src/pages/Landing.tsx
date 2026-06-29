import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TreePine, Users, ArrowRight, ShieldCheck,Sparkles, Calendar } from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import { useTrees } from '../hooks/useTrees';
import DecompressedImage from '../components/DecompressedImage';
import { FamilyTree } from '../types';



interface PublicTreeCardProps {
  tree: FamilyTree;
}

const PublicTreeCard: React.FC<PublicTreeCardProps> = ({ tree }) => {
  const photos = tree.memberPhotos || [];
  const hasPhotos = photos.length > 0;
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  useEffect(() => {
    if (photos.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [photos.length]);

  return (
    <div
      className="group relative z-10 flex flex-col justify-between rounded-2xl p-8 shadow-sm transition-all duration-300 hover:shadow-xl overflow-hidden min-h-[320px]"
      style={{ 
        border: hasPhotos ? '1px solid #2d5040' : '1px solid #e8e0d0',
        background: hasPhotos ? 'transparent' : 'white',
      }}
    >
      {/* Background Slideshow */}
      {hasPhotos && (
        <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#091a11]/75 z-10 backdrop-blur-[1px] transition-colors duration-300 group-hover:bg-[#091a11]/65" />
          
          {photos.map((photoUrl, idx) => (
            <DecompressedImage
              key={`${photoUrl}-${idx}`}
              photoUrl={photoUrl}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === currentPhotoIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      )}

      <div>
        {/* Icon */}
        <div 
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
          style={{
            background: hasPhotos ? 'rgba(255, 255, 255, 0.15)' : '#e8f5ee',
            color: hasPhotos ? '#95d5b2' : '#2d6a4f',
            border: hasPhotos ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          }}
        >
          <TreePine size={28} />
        </div>

        {/* Glassmorphic Metadata Overlay */}
        {hasPhotos ? (
          <div className="p-5 rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md space-y-2.5 shadow-lg">
            <h3 
              className="text-2xl font-bold leading-snug text-white drop-shadow-md" 
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {tree.name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#95d5b2] font-semibold drop-shadow-sm">
              <p className="flex items-center gap-1.5">
                <Calendar size={13} className="text-[#95d5b2]" />
                <span>
                  {new Date(tree.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </p>
              {tree.memberCount !== undefined && (
                <p className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                  <Users size={13} className="text-[#95d5b2]" />
                  <span>
                    {tree.memberCount} {tree.memberCount === 1 ? 'member' : 'members'}
                  </span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Name */}
            <h3 
              className="mb-3 text-xl font-bold" 
              style={{ 
                color: '#1a3a2a', 
                fontFamily: "'Playfair Display', Georgia, serif" 
              }}
            >
              {tree.name}
            </h3>

            {/* Date */}
            <p 
              className="flex items-center gap-2 text-xs mb-6" 
              style={{ color: '#a09080' }}
            >
              <Calendar size={12} />
              <span>
                Created{' '}
                {new Date(tree.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </p>
          </>
        )}
      </div>

      {/* Footer */}
      <div 
        className="pt-6 border-t" 
        style={{ borderColor: hasPhotos ? 'rgba(255, 255, 255, 0.15)' : '#f0ece4' }}
      >
        <Link
          to={`/public-trees/${tree.id}`}
          className="group/link flex items-center gap-1.5 text-sm font-semibold transition-all"
          style={{ color: hasPhotos ? '#95d5b2' : '#2d6a4f' }}
        >
          <span className={hasPhotos ? 'text-white group-hover/link:text-[#95d5b2] transition-colors' : ''}>
            Explore
          </span>
          <ArrowRight size={14} className="transition-transform duration-200 group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
};

const Landing: React.FC = () => {
  const { usePublicList } = useTrees();
  const { data: publicTrees } = usePublicList();

  const heroSlides = [
    {
      image: '/images/2f5f3d2deab82fb4b80d38ef98c3ac28.jpg',
      label: 'Weave your family story',
      title: 'Preserve Your Legacy, One Generation at a Time.',
      subtitle: 'Build, visualize, and share your family history with our interactive family canvas. Connect with your roots, collaborate with loved ones, and safeguard your stories for generations to come.',
    },
    {
      image: '/images/a6f0ee47983db8d24888b20ba02f9099.jpg',
      label: 'Connect your roots',
      title: 'Trace your ancestry with clarity and care.',
      subtitle: 'Capture names, memories, and relationships with a beautiful, interactive family timeline.',
    },
    {
      image: '/images/a932fee793517b7c13e5bdeceb4d0105.jpg',
      label: 'Celebrate every memory',
      title: 'Turn family history into a shared legacy.',
      subtitle: 'Keep important stories alive by adding photos, notes, and personal milestones for every relative.',
    },
    {
      image: '/images/c8ad0fbf8cba8f1bac3bda230528a341.jpg',
      label: 'Secure and private',
      title: 'Protect your family tree with trusted privacy.',
      subtitle: 'Enjoy secure access, protected sharing, and full control over who can view and edit your family records.',
    },
    {
      image: '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg',
      label: 'Collaborate with family',
      title: 'Invite loved ones to contribute and grow together.',
      subtitle: 'Build a living family archive and keep everyone connected through shared contributions.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [heroSlides.length]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f4ef]" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Decorative Glow Elements */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-[#2d6a4f]/10 blur-3xl" />
      <div className="absolute left-0 top-1/3 -z-10 h-[400px] w-[400px] rounded-full bg-[#d4c9b0]/25 blur-3xl" />

      {/* Hero Section */}
      <main className="w-full px-0">
        <section className="relative min-h-screen overflow-hidden bg-[#f7f4ef]">
          <div className="absolute inset-0 bg-cover bg-center brightness-[0.45] transition-all duration-700" style={{ backgroundImage: `url(${heroSlides[currentSlide].image})` }} />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7f4ef]/90 via-white/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#f7f4ef]/90" />

          <div className="relative z-10 px-6 py-6 sm:px-8 lg:px-12">
            <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3 shadow-sm backdrop-blur-md lg:px-8">
              <div className="flex items-center gap-2 font-bold text-2xl" style={{ color: '#1a3a2a' }}>
                <BrandLogo markClassName="h-12 w-28 sm:h-14 sm:w-32" />
              </div>
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold transition-colors duration-200"
                  style={{ color: '#5a4a3a' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="group flex items-center gap-1 rounded-full bg-[#1a3a2a] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </nav>

            <div className="flex min-h-[calc(100vh-92px)] items-center pt-16 lg:pt-24">
              <div className="max-w-3xl space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: '#e8f5ee', color: '#2d6a4f', border: '1px solid #c8e6d0' }}>
                  <Sparkles size={16} />
                  <span>{heroSlides[currentSlide].label}</span>
                </div>

                <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-[#1a3a2a] md:text-6xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {heroSlides[currentSlide].title}
                </h1>

                <p className="max-w-2xl text-lg leading-relaxed md:text-xl" style={{ color: '#5a4a3a' }}>
                  {heroSlides[currentSlide].subtitle}
                </p>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Link
                    to="/register"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-lg font-bold text-white transition-all duration-300"
                    style={{ background: '#1a3a2a' }}
                  >
                    <span>Create Your Family Free</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
                  </Link>
                </div>

                <div className="flex gap-2">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.label}
                      type="button"
                      onClick={() => setCurrentSlide(index)}
                      className={`h-2.5 w-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-[#1a3a2a]' : 'bg-white/60'}`}
                      aria-label={`Slide ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-left">
                  <div className="rounded-3xl bg-[#f7f4ef]/90 p-5" style={{ border: '1px solid #e8e0d0' }}>
                    <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>100%</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: '#a09080' }}>Private & Secure</p>
                  </div>
                  <div className="rounded-3xl bg-[#f7f4ef]/90 p-5" style={{ border: '1px solid #e8e0d0' }}>
                    <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>Interactive</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: '#a09080' }}>React Flow Canvas</p>
                  </div>
                  <div className="rounded-3xl bg-[#f7f4ef]/90 p-5" style={{ border: '1px solid #e8e0d0' }}>
                    <p className="text-3xl font-black" style={{ color: '#1a3a2a' }}>Unlimited</p>
                    <p className="mt-2 text-sm font-medium" style={{ color: '#a09080' }}>Generations & Members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Public Family Trees Section */}
        {publicTrees && publicTrees.length > 0 && (
          <div className="mt-24">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>
                Explore Public Family Trees
              </h2>
              <p className="text-lg" style={{ color: '#5a4a3a' }}>
                Discover public family stories and legacies shared by our community.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {publicTrees.map((tree) => (
                <PublicTreeCard tree={tree} key={tree.id} />
              ))}
            </div>
          </div>
        )}

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
