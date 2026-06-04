import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePersons } from '../hooks/usePersons';
import { useUpload } from '../hooks/useUpload';
import { useAuthContext } from '../context/AuthContext';
import DecompressedImage from '../components/DecompressedImage';
import { Calendar, Camera, Trash2, Edit2, ArrowLeft, Heart, Users, ScrollText, Flame, Mail, Phone } from 'lucide-react';
import { useTrees } from '../hooks/useTrees';

const profileBackgroundImage = '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg';

const PersonProfile: React.FC = () => {
  const { treeId, personId } = useParams();
  const navigate = useNavigate();
  const isPublic = window.location.pathname.startsWith('/public-trees');
  const { useGet, delete: deletePerson } = usePersons(Number(treeId));
  const { data: person, isLoading } = useGet(Number(personId), isPublic);
  const { uploadPhoto, isUploading } = useUpload(Number(treeId), Number(personId));
  const { useGet: useTreeGet } = useTrees();
  const { data: tree } = useTreeGet(Number(treeId), isPublic);
  const { user } = useAuthContext();

  const canEdit = React.useMemo(() => {
    if (isPublic) return false;
    if (!user) return false;
    if (user.role === 'System Owner') return true;
    if (user.role === 'Family Head' && tree?.ownerId === user.id) return true;
    return user.personId === Number(personId);
  }, [user, personId, isPublic, tree]);

  const computedRelationships = React.useMemo(() => {
    if (!person) return [];
    return person.computedRelationships || [];
  }, [person]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this person?')) {
      await deletePerson(Number(personId));
      navigate(`/trees/${treeId}`);
    }
  };

  if (isLoading || !person) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-[#f7f4ef]">
        <div
          className="h-10 w-10 animate-spin rounded-full"
          style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
        />
        <p className="font-medium" style={{ color: '#a09080' }}>Loading person profile...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f7f4ef] px-4 py-6 sm:px-6 lg:px-8"
      style={{
        fontFamily: "'DM Sans', system-ui, sans-serif",
        backgroundImage: `linear-gradient(rgba(247, 244, 239, 0.82), rgba(247, 244, 239, 0.92)), url(${profileBackgroundImage})`,
        backgroundPosition: 'center 45%',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button 
            onClick={() => navigate(isPublic ? `/public-trees/${treeId}` : `/trees/${treeId}`)}
            className="flex cursor-pointer items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: '#5a4a3a' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Family</span>
          </button>

          <Link to={isPublic ? "/" : "/dashboard"} className="flex items-center">
            <img
              src="/kincore_logo_v4.svg"
              alt="KinCore logo"
              className="h-14 w-40 shrink-0 object-contain"
            />
          </Link>
        </div>

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl" style={{ border: '1px solid #e8e0d0' }}>
          
          {/* Header Banner */}
          <div
            className="relative h-56 bg-[#0d2218] sm:h-64"
            style={{
              backgroundImage: `linear-gradient(rgba(13, 34, 24, 0.72), rgba(13, 34, 24, 0.86)), url(${profileBackgroundImage})`,
              backgroundPosition: 'center 34%',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `linear-gradient(#a8d5b5 1px, transparent 1px), linear-gradient(90deg, #a8d5b5 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
              }}
            />
            <div className="absolute -bottom-20 left-6 sm:left-8">
              <div className="group relative h-40 w-40 overflow-hidden rounded-2xl border-4 border-white bg-[#f7f4ef] shadow-md">
                <DecompressedImage photoUrl={person.photoUrl} fallbackIconSize={48} className="w-full h-full object-cover" />
                {canEdit && (
                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <Camera size={24} />
                    <span className="mt-1 text-[10px] font-bold">Upload Photo</span>
                    <input type="file" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="px-6 pb-8 pt-24 sm:px-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div className="max-w-3xl">
                <h1
                  className="text-4xl font-bold tracking-tight sm:text-5xl"
                  style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {person.firstName} {person.lastName}
                </h1>
                <div className="mt-2.5 flex flex-wrap gap-3 text-sm font-medium">
                  <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: '#f0ece4', color: '#5a4a3a' }}>
                    <Calendar size={14} />
                    <span>
                      {person.birthDate || 'Unknown'} — {person.deathDate || 'Present'}
                    </span>
                  </span>
                  <span className="rounded-full px-3 py-1 text-xs font-bold capitalize" style={{ background: '#e8f5ee', color: '#2d6a4f', border: '1px solid #c8e6d0' }}>
                    {person.gender?.toLowerCase()}
                  </span>
                  {person.deathDate && (
                    <span className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                      <Flame size={14} className="fill-amber-300" />
                      <span>Deceased</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                {canEdit && (
                  <Link 
                    to={`/trees/${treeId}/persons/${personId}/edit`} 
                    className="cursor-pointer rounded-xl p-3 transition-all duration-200"
                    style={{ color: '#5a4a3a', border: '1px solid #e8e0d0' }}
                    title="Edit Profile"
                  >
                    <Edit2 size={18} />
                  </Link>
                )}
                {(user?.role === 'System Owner' || (user?.role === 'Family Head' && tree?.ownerId === user.id)) && (
                  <button 
                    onClick={handleDelete} 
                    className="cursor-pointer rounded-xl p-3 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                    style={{ color: '#5a4a3a', border: '1px solid #e8e0d0' }}
                    title="Delete Profile"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Grid (Bio & Relationships) */}
            <div className="mt-10 grid gap-8 border-t pt-8 lg:grid-cols-[minmax(0,2fr)_360px]" style={{ borderColor: '#f0ece4' }}>
              {/* Biography Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#1a3a2a' }}>
                    <ScrollText size={18} style={{ color: '#2d6a4f' }} />
                    <span>Biography</span>
                  </h3>
                  <p className="whitespace-pre-line rounded-2xl p-6 text-sm leading-relaxed" style={{ background: '#f7f4ef', border: '1px solid #e8e0d0', color: '#5a4a3a' }}>
                    {person.bio || "No biography details have been added for this family member."}
                  </p>
                </div>

                {(person.email || person.phoneNumber) && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#1a3a2a' }}>
                      <Mail size={18} style={{ color: '#2d6a4f' }} />
                      <span>Contact Information</span>
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {person.email && (
                        <div className="flex items-center gap-3 rounded-2xl bg-[#f7f4ef] p-4" style={{ border: '1px solid #e8e0d0' }}>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2d6a4f]">
                            <Mail size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#a09080]">Email Address</p>
                            <a href={`mailto:${person.email}`} className="text-sm font-bold text-[#2d3a2a] hover:underline break-all">{person.email}</a>
                          </div>
                        </div>
                      )}
                      {person.phoneNumber && (
                        <div className="flex items-center gap-3 rounded-2xl bg-[#f7f4ef] p-4" style={{ border: '1px solid #e8e0d0' }}>
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2d6a4f]">
                            <Phone size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#a09080]">Phone Number</p>
                            <a href={`tel:${person.phoneNumber}`} className="text-sm font-bold text-[#2d3a2a] hover:underline break-all">{person.phoneNumber}</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Relationships Section */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: '#1a3a2a' }}>
                  <Users size={18} style={{ color: '#2d6a4f' }} />
                  <span>Relationships</span>
                </h3>
                
                <div className="space-y-3">
                  {computedRelationships.map((rel) => {
                    return (
                      <Link 
                        key={rel.relatedPersonId} 
                        to={isPublic ? `/public-trees/${treeId}/persons/${rel.relatedPersonId}` : `/trees/${treeId}/persons/${rel.relatedPersonId}`} 
                        className="group flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ border: '1px solid #e8e0d0' }}
                      >
                        <div
                          className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl ${rel.deathDate ? 'grayscale opacity-75' : ''}`}
                          style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}
                        >
                          <DecompressedImage photoUrl={rel.photoUrl} fallbackIconSize={20} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold transition-colors flex items-center gap-1" style={{ color: '#2d3a2a' }}>
                            <span className="truncate">{rel.fullName}</span>
                            {rel.deathDate && (
                              <span title="Deceased" className="flex shrink-0">
                                <Flame size={12} className="text-amber-600 fill-amber-300" />
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Heart size={12} className={['Wife', 'Husband', 'Spouse'].includes(rel.typeLabel) ? 'text-pink-500' : ''} style={['Wife', 'Husband', 'Spouse'].includes(rel.typeLabel) ? undefined : { color: '#2d6a4f' }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#a09080' }}>
                              {rel.typeLabel}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[11px]" style={{ color: '#a09080' }}>
                            {rel.birthDate || 'Unknown'} - {rel.deathDate || 'Present'}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                  
                  {computedRelationships.length === 0 && (
                    <div className="rounded-2xl border border-dashed bg-[#f7f4ef] p-4 py-8 text-center" style={{ borderColor: '#d4c9b0' }}>
                      <p className="text-xs" style={{ color: '#a09080' }}>No relationships defined yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonProfile;
