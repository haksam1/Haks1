import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersons } from '../hooks/usePersons';
import { ArrowLeft, User, Sparkles, Camera, Phone, Link2, Mail } from 'lucide-react';
import { getApiErrorMessage } from '../lib/errors';
import api from '../api/client';
import DecompressedImage from '../components/DecompressedImage';

const personSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  birthDate: z.string().optional().or(z.literal('')),
  deathDate: z.string().optional().or(z.literal('')),
  gender: z.string().optional(),
  bio: z.string().optional(),
  phoneNumber: z.string().optional().or(z.literal('')),
  relatedPersonId: z.string().optional().or(z.literal('')),
  relationshipType: z.string().optional().or(z.literal('')),
  parentEmail: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.relationshipType && data.relationshipType !== '') {
    return !!data.relatedPersonId && data.relatedPersonId !== '';
  }
  return true;
}, {
  message: 'Please select a family member to connect to',
  path: ['relatedPersonId'],
}).refine((data) => {
  if (data.relationshipType === 'FATHER' || data.relationshipType === 'MOTHER') {
    return !!data.phoneNumber && data.phoneNumber.trim() !== '';
  }
  return true;
}, {
  message: 'Phone number is required for parent registration',
  path: ['phoneNumber'],
}).refine((data) => {
  if (data.parentEmail && data.parentEmail.trim() !== '') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data.parentEmail);
  }
  return true;
}, {
  message: 'Please enter a valid email address',
  path: ['parentEmail'],
});

type PersonForm = z.infer<typeof personSchema>;

const profileBackgroundImage = '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg';

const AddEditPerson: React.FC = () => {
  const { treeId, personId } = useParams();
  const navigate = useNavigate();
  const { create, update, useGet, useList } = usePersons(Number(treeId));
  const isEditing = !!personId;

  const { data: person } = useGet(isEditing ? Number(personId) : undefined);
  const { data: allPersons } = useList();

  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Extract existing relationship if any
  const existingRelation = person?.relationships?.[0];
  const existingRelType = () => {
    if (!person || !existingRelation) return '';
    if (existingRelation.type === 'PARENT') {
      return person.gender === 'FEMALE' ? 'MOTHER' : 'FATHER';
    }
    return existingRelation.type;
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, watch } = useForm<PersonForm>({
    resolver: zodResolver(personSchema),
    values: person ? {
      firstName: person.firstName,
      lastName: person.lastName,
      birthDate: person.birthDate || '',
      deathDate: person.deathDate || '',
      gender: person.gender || 'MALE',
      bio: person.bio || '',
      phoneNumber: person.phoneNumber || '',
      relatedPersonId: existingRelation ? String(existingRelation.relatedPersonId) : '',
      relationshipType: existingRelType(),
      parentEmail: '', // Not stored directly on person
    } : {
      firstName: '',
      lastName: '',
      birthDate: '',
      deathDate: '',
      gender: 'MALE',
      bio: '',
      phoneNumber: '',
      relatedPersonId: '',
      relationshipType: '',
      parentEmail: '',
    },
  });

  const relationshipType = watch('relationshipType');
  const relatedPersonId = watch('relatedPersonId');

  // Handle Photo Preview
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PersonForm) => {
    // 1. Format core details
    const formattedData = {
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate || null,
      deathDate: data.deathDate || null,
      gender: data.relationshipType === 'FATHER' ? 'MALE' : data.relationshipType === 'MOTHER' ? 'FEMALE' : data.gender,
      bio: data.bio || '',
      phoneNumber: data.phoneNumber || '',
    };

    try {
      let savedPerson;
      // 2. Create or Update Person
      if (isEditing) {
        savedPerson = await update({ id: Number(personId), ...formattedData });
      } else {
        savedPerson = await create(formattedData);
      }

      // 3. Upload Photo if selected
      if (photoPreview && savedPerson) {
        const { compressToGzipBlob } = await import('../lib/compression');
        const gzipBlob = await compressToGzipBlob(photoPreview);
        const formData = new FormData();
        formData.append('file', gzipBlob, 'photo.gz');
        formData.append('treeId', String(treeId));
        formData.append('personId', String(savedPerson.id));
        await api.post('/api/upload/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 4. Save Relationship if selected
      if (data.relatedPersonId && data.relationshipType && savedPerson) {
        let backendRelType = data.relationshipType;
        if (backendRelType === 'FATHER' || backendRelType === 'MOTHER') {
          backendRelType = 'PARENT';
        }
        await api.post(`/api/trees/${treeId}/persons/${savedPerson.id}/relationships`, {
          relatedPersonId: Number(data.relatedPersonId),
          type: backendRelType,
        });

        // 5. Trigger Parent Setup API if identified as a parent
        if (data.relationshipType === 'FATHER' || data.relationshipType === 'MOTHER') {
          const fallbackEmail = `${savedPerson.firstName.toLowerCase()}.${savedPerson.lastName.toLowerCase()}@kincore.com`;
          await api.post('/api/parent-setup', {
            personId: savedPerson.id,
            phoneNumber: data.phoneNumber || savedPerson.phoneNumber,
            name: `${savedPerson.firstName} ${savedPerson.lastName}`,
            email: data.parentEmail || fallbackEmail,
          });
        }
      }

      navigate(`/trees/${treeId}`);
    } catch (error) {
      setError('root', {
        message: getApiErrorMessage(error, 'Unable to save the profile. Please try again.'),
      });
    }
  };

  // Filter out the current person from related person list
  const filteredPersonsList = allPersons?.filter(p => !isEditing || p.id !== Number(personId)) || [];
  const selectedRelatedPerson = filteredPersonsList.find((p) => p.id === Number(relatedPersonId));

  const fieldClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all";
  const fieldStyle = {
    background: '#f7f4ef',
    border: '1.5px solid #e8e0d0',
    color: '#2d3a2a',
  };
  const setFocusBorder = (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, color: string) => {
    element.style.borderColor = color;
  };

  return (
    <div
      className="min-h-[calc(100vh-64px)] bg-[#f7f4ef] md:min-h-screen"
      style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
    >
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: '#0d2218',
          backgroundImage: `linear-gradient(rgba(13, 34, 24, 0.78), rgba(13, 34, 24, 0.86)), url(${profileBackgroundImage})`,
          backgroundPosition: 'center 34%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <button
            onClick={() => navigate(-1)}
            className="flex cursor-pointer items-center gap-2 text-sm font-bold transition-colors"
            style={{ color: '#d4c9b0' }}
          >
            <ArrowLeft size={16} />
            <span>Cancel and Go Back</span>
          </button>

          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="rounded-full bg-[#1a3a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#95d5b2]">
                Family Profile
              </span>
              <h1
                className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {isEditing ? 'Edit Family Member' : 'Add Family Member'}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a8b8a8]">
                {isEditing ? 'Update personal details and history' : 'Add a new member to your family'}
              </p>
            </div>

            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: '#1a3a2a', border: '1px solid #2d5040', color: '#95d5b2' }}
            >
              <User size={28} />
            </div>
          </div>
        </div>
      </div>

      <div
        className="pb-12"
        style={{
          backgroundColor: '#f7f4ef',
          backgroundImage: `linear-gradient(rgba(247, 244, 239, 0.8), rgba(247, 244, 239, 0.9)), url(${profileBackgroundImage})`,
          backgroundPosition: 'center 45%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="-mt-8 relative z-10 overflow-hidden rounded-2xl bg-white shadow-xl"
            style={{ border: '1px solid #e8e0d0' }}
          >
            <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: '#e8e0d0' }}>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#e8f5ee] p-2.5 text-[#2d6a4f]">
                  <User size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-none" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {isEditing ? 'Profile Details' : 'New Profile Details'}
                  </h2>
                  <p className="mt-1 text-xs font-semibold" style={{ color: '#a09080' }}>
                    {isEditing ? 'Save changes to this record' : 'Create a new family record'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
                style={{ background: '#f0ece4', color: '#5a4a3a' }}
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
              
              {/* Photo Upload Section */}
              <div className="lg:col-span-2 flex flex-col items-center gap-4 pb-4 border-b border-[#f0ece4]">
                <div className="group relative h-28 w-28 overflow-hidden rounded-2xl bg-[#f7f4ef] border-2 border-[#e8e0d0] shadow-sm flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : person?.photoUrl ? (
                    <DecompressedImage photoUrl={person.photoUrl} fallbackIconSize={40} className="h-full w-full object-cover" />
                  ) : (
                    <User size={40} className="text-[#a09080]" />
                  )}
                  <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/50 text-white opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <Camera size={20} />
                    <span className="mt-1 text-[9px] font-bold">Select Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                </div>
                <span className="text-xs font-semibold text-[#5a4a3a]">Profile Portrait Photo</span>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>First Name *</label>
                <input
                  {...register('firstName')}
                  placeholder="e.g. Mary"
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Last Name *</label>
                <input
                  {...register('lastName')}
                  placeholder="e.g. Smith"
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.lastName.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Birth Date</label>
                <input
                  type="date"
                  {...register('birthDate')}
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Death Date (Optional)</label>
                <input
                  type="date"
                  {...register('deathDate')}
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Gender</label>
                <select
                  {...register('gender')}
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold flex items-center gap-1.5" style={{ color: '#2d3a2a' }}>
                  <Phone size={14} style={{ color: '#2d6a4f' }} />
                  <span>Phone Number</span>
                </label>
                <input
                  {...register('phoneNumber')}
                  placeholder="e.g. +1 555-019-2834"
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600 font-semibold">{errors.phoneNumber.message}</p>
                )}
              </div>

              {/* Family Connection Section */}
              <div className="lg:col-span-2 pt-4 mt-2 border-t border-[#f0ece4] space-y-4">
                <h3 className="text-md font-bold flex items-center gap-2" style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  <Link2 size={16} className="text-[#2d6a4f]" />
                  <span>Family Tree Connection</span>
                </h3>

                {filteredPersonsList.length === 0 ? (
                  <div className="bg-[#fcfbf9] rounded-2xl p-5 border border-[#e8e0d0] text-center space-y-2">
                    <p className="text-sm font-semibold text-[#1a3a2a]">First Member of the Tree</p>
                    <p className="text-xs text-[#7a6a5a] max-w-lg mx-auto leading-relaxed">
                      This is the first profile in your family tree! Once this profile is created, you can connect subsequent family members to this person to expand your tree.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Connect to Family Member</label>
                      <select
                        {...register('relatedPersonId')}
                        className={fieldClass}
                        style={fieldStyle}
                        onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                        onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                      >
                        <option value="">-- Select Member --</option>
                        {filteredPersonsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                      {errors.relatedPersonId && (
                        <p className="mt-1 text-xs text-red-600 font-semibold">{errors.relatedPersonId.message}</p>
                      )}
                      {selectedRelatedPerson && (
                        <div
                          className="mt-3 flex items-center gap-3 rounded-xl bg-[#fcfbf9] p-3"
                          style={{ border: '1px solid #e8e0d0' }}
                        >
                          <div
                            className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl"
                            style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}
                          >
                            <DecompressedImage
                              photoUrl={selectedRelatedPerson.photoUrl}
                              fallbackIconSize={20}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold" style={{ color: '#2d3a2a' }}>
                              {selectedRelatedPerson.firstName} {selectedRelatedPerson.lastName}
                            </p>
                            <p className="mt-0.5 text-xs" style={{ color: '#a09080' }}>
                              {selectedRelatedPerson.birthDate || 'Unknown'} - {selectedRelatedPerson.deathDate || 'Present'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Relationship Type</label>
                      <select
                        {...register('relationshipType')}
                        className={fieldClass}
                        style={fieldStyle}
                        onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                        onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                      >
                        <option value="">-- None --</option>
                        <option value="FATHER">Father (Parent)</option>
                        <option value="MOTHER">Mother (Parent)</option>
                        <option value="CHILD">Child</option>
                        <option value="SPOUSE">Spouse</option>
                        <option value="SIBLING">Sibling</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Conditional Parent Account Setup Fields */}
              {(relationshipType === 'FATHER' || relationshipType === 'MOTHER') && (
                <div className="lg:col-span-2 bg-[#e8f5ee] rounded-2xl p-5 border border-[#c8e6d0] space-y-3">
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: '#1a3a2a' }}>
                    <Mail size={16} className="text-[#2d6a4f]" />
                    <span>Parent Admin Auto-Provisioning</span>
                  </h4>
                  <p className="text-xs text-[#5a4a3a] leading-relaxed">
                    This person will be designated as a parent. Creating/updating their record will generate their unique portal credentials, assign them to the <strong>Parent Admin</strong> role, and log a welcome SMS in the queue to be sent to their phone.
                  </p>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold" style={{ color: '#2d3a2a' }}>Parent portal email (optional, fallback generated if empty)</label>
                    <input
                      {...register('parentEmail')}
                      type="email"
                      placeholder="e.g. parent.portal@example.com"
                      className="w-full rounded-xl px-4 py-2.5 text-sm outline-none bg-white border border-[#c8e6d0]"
                    />
                    {errors.parentEmail && (
                      <p className="mt-1 text-xs text-red-600 font-semibold">{errors.parentEmail.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="lg:col-span-2">
                <label className="mb-1.5 block text-sm font-semibold" style={{ color: '#2d3a2a' }}>Biography</label>
                <textarea
                  {...register('bio')}
                  rows={4}
                  placeholder="Write a brief life story or details..."
                  className={fieldClass}
                  style={fieldStyle}
                  onFocus={(e) => setFocusBorder(e.target, '#2d6a4f')}
                  onBlur={(e) => setFocusBorder(e.target, '#e8e0d0')}
                ></textarea>
              </div>

              {errors.root && (
                <div
                  className="rounded-xl px-4 py-3 text-sm font-medium lg:col-span-2"
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                >
                  {errors.root.message}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:col-span-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200"
                  style={{ background: '#1a3a2a' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#2d6a4f')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1a3a2a')}
                >
                  <Sparkles size={16} />
                  <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Profile'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 cursor-pointer rounded-xl py-3.5 text-sm font-bold transition-all duration-200"
                  style={{ background: '#f0ece4', color: '#5a4a3a' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditPerson;
