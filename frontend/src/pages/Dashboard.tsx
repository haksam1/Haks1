import React, { useState } from 'react';
import { useTrees } from '../hooks/useTrees';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import OwnerDashboard from './OwnerDashboard';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';
import { FamilyTree } from '../types';
import DecompressedImage from '../components/DecompressedImage';
import {
  Plus, TreePine, Trash2, Calendar, ArrowRight,
  Users, Search, X, Leaf, GitBranch, Mail, Send, Phone,
  Eye, EyeOff
} from 'lucide-react';
import { isAxiosError } from 'axios';

const getCreateTreeErrorMessage = (error: unknown) => {
  if (isAxiosError(error)) {
    if (!error.response) return 'Could not reach the server. Make sure the backend is running.';
    if (error.response.status === 401) return 'Session expired. Please sign in again.';
    const message = error.response.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return 'Unable to create the family. Please try again.';
};

const dashboardBackgroundImage = '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg';

const Dashboard: React.FC = () => {
  const { useList, create, delete: deleteTree } = useTrees();
  const { data: trees, isLoading } = useList();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if ((user?.role === 'Family Member' || user?.role === 'Parent Admin') && trees && trees.length > 0) {
      navigate(`/trees/${trees[0].id}`, { replace: true });
    }
  }, [user, trees, navigate]);

  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const toast = useToast();

  const { data: familyInvitations, isLoading: isInvitesLoading, refetch: refetchInvites } = useQuery({
    queryKey: ['family-invitations', trees?.[0]?.id],
    queryFn: async () => {
      if (!trees?.[0]?.id) return [];
      const { data } = await api.get<any[]>(`/api/trees/${trees[0].id}/invitations`);
      return data;
    },
    enabled: !!trees?.[0]?.id && user?.role === 'Family Head',
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!trees?.[0]?.id) return;
      await api.post(`/api/trees/${trees[0].id}/invitations/${id}/resend`);
    },
    onSuccess: () => {
      refetchInvites();
    }
  });

  const handleResendFamilyInvite = async (id: number, email: string) => {
    const toastId = toast.loading('Resending', `Queuing invitation details for ${email}...`);
    try {
      await resendInviteMutation.mutateAsync(id);
      toast.updateToast(toastId, {
        title: 'Sent',
        message: `Invitation resent to ${email}.`,
        variant: 'success',
      });
    } catch (err) {
      toast.updateToast(toastId, {
        title: 'Failed',
        message: getApiErrorMessage(err, 'Failed to resend invitation.'),
        variant: 'error',
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const treeName = newName.trim();
    if (!treeName) { setCreateError('Enter a family name first.'); return; }
    setCreateError(null);
    setIsCreating(true);
    try {
      await create(treeName);
      setNewName('');
    } catch (error) {
      setCreateError(getCreateTreeErrorMessage(error));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      setDeletingId(id);
      await deleteTree(id);
      setDeletingId(null);
    }
  };

  const filteredTrees = trees?.filter((tree) =>
    tree.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: trees?.length || 0,
    recent: trees?.filter((t) => {
      const days = (Date.now() - new Date(t.createdAt).getTime()) / 86400000;
      return days <= 7;
    }).length || 0,
  };

  if (user?.role === 'System Owner') {
    return <OwnerDashboard />;
  }

  if ((user?.role === 'Family Member' || user?.role === 'Parent Admin') && (!trees || trees.length === 0)) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen py-24 gap-4" style={{ backgroundColor: '#f7f4ef' }}>
          <div className="relative h-14 w-14">
            <div
              className="h-14 w-14 animate-spin rounded-full"
              style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
            />
            <TreePine size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: '#2d6a4f' }} />
          </div>
          <p className="text-sm" style={{ color: '#a09080' }}>Loading your family tree...</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-24 gap-6 px-4 text-center" style={{ backgroundColor: '#f7f4ef' }}>
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: '#e8f5ee', border: '1px solid #c8e6d0' }}
        >
          <TreePine size={36} style={{ color: '#2d6a4f' }} />
        </div>
        <div className="max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-[#1a3a2a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            No Family Tree Linked
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#a09080' }}>
            Your account is not currently linked to any family tree. Please ask your Family Head to invite you or link your profile to a family member in their tree.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: '#f7f4ef',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >

      {/* ───── HERO ───── */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: '#0d2218',
          backgroundImage: `linear-gradient(rgba(13, 34, 24, 0.78), rgba(13, 34, 24, 0.86)), url(${dashboardBackgroundImage})`,
          backgroundPosition: 'center 34%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* Glowing orb */}
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-14">
          <div className="mb-6 flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase"
              style={{ background: '#1a3a2a', color: '#95d5b2', letterSpacing: '0.12em' }}
            >
              Heritage Archive
            </span>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h1
                className="mb-4 text-5xl font-bold leading-tight tracking-tight text-white md:text-6xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Your Family <br />
                <span style={{ color: '#95d5b2' }}>Legacy</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: '#a8b8a8' }}>
                Preserve stories, trace lineages, and build an enduring record
                of your family's history for generations to come.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div
                className="rounded-2xl px-6 py-4 text-center"
                style={{ background: '#1a3a2a', border: '1px solid #2d5040' }}
              >
                <p className="mb-0.5 text-3xl font-bold text-white">{stats.total}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#6a9e80' }}>Families</p>
              </div>
              <div
                className="rounded-2xl px-6 py-4 text-center"
                style={{ background: '#1a3a2a', border: '1px solid #2d5040' }}
              >
                <p className="mb-0.5 text-3xl font-bold text-white">{stats.recent}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#6a9e80' }}>This Week</p>
              </div>
            </div>
          </div>

          {/* Decorative leaf strip */}
          <div className="mt-10 flex items-center gap-3 opacity-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <Leaf
                key={i}
                size={10 + (i % 3) * 3}
                className="text-[#95d5b2]"
                style={{ transform: `rotate(${i * 29}deg)` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f7f4ef',
          backgroundImage: `linear-gradient(rgba(247, 244, 239, 0.78), rgba(247, 244, 239, 0.88)), url(${dashboardBackgroundImage})`,
          backgroundPosition: 'center 45%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        {/* ───── ACTIONS BAR ───── */}
        <div className="mx-auto max-w-6xl px-6">
          <div
            className="-mt-5 relative z-10 rounded-2xl p-4 shadow-xl"
            style={{ background: '#ffffff', border: '1px solid #e8e0d0' }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative lg:w-72">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#a09080' }}
                />
                <input
                  type="text"
                  placeholder="Search your families…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                  style={{
                    background: '#f7f4ef',
                    border: '1.5px solid #e8e0d0',
                    color: '#2d3a2a',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                  onBlur={(e) => (e.target.style.borderColor = '#e8e0d0')}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#a09080' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Create form */}
              {user?.role !== 'Family Member' && user?.role !== 'Parent Admin' && (
                <form onSubmit={handleCreate} className="flex flex-1 gap-2 lg:justify-end">
                  <div className="relative flex-1 lg:max-w-xs">
                    <TreePine
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: '#a09080' }}
                    />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Name your new family…"
                      className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none transition-all"
                      style={{
                        background: '#f7f4ef',
                        border: '1.5px solid #e8e0d0',
                        color: '#2d3a2a',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = '#2d6a4f')}
                      onBlur={(e) => (e.target.style.borderColor = '#e8e0d0')}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60"
                    style={{ background: '#1a3a2a' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#2d6a4f')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1a3a2a')}
                  >
                    <Plus size={16} />
                    <span>{isCreating ? 'Creating…' : 'New Family'}</span>
                  </button>
                </form>
              )}
            </div>

            {createError && (
              <div
                className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
              >
                <X size={15} />
                {createError}
              </div>
            )}
          </div>
        </div>

        {/* ───── TREES GRID ───── */}
        <div className="mx-auto max-w-6xl px-6 py-10">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative h-14 w-14">
                <div
                  className="h-14 w-14 animate-spin rounded-full"
                  style={{ border: '3px solid #e8e0d0', borderTopColor: '#2d6a4f' }}
                />
                <TreePine
                  size={20}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ color: '#2d6a4f' }}
                />
              </div>
              <p className="text-sm" style={{ color: '#a09080' }}>Loading your families…</p>
            </div>
          ) : filteredTrees && filteredTrees.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm" style={{ color: '#a09080' }}>
                  {filteredTrees.length} {filteredTrees.length === 1 ? 'family' : 'families'}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
                <div className="flex items-center gap-1.5" style={{ color: '#a09080' }}>
                  <GitBranch size={14} />
                  <span className="text-xs">Sorted by date</span>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTrees.map((tree) => (
                  <TreeCard
                    key={tree.id}
                    tree={tree}
                    onDelete={() => handleDelete(tree.id, tree.name)}
                    isDeleting={deletingId === tree.id}
                    currentUserId={user?.id}
                  />
                ))}

                {/* "Add new" ghost card */}
                {user?.role !== 'Family Member' && user?.role !== 'Parent Admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector<HTMLInputElement>('input[placeholder="Name your new family…"]');
                      input?.focus();
                    }}
                    className="group flex flex-col items-center justify-center gap-3 rounded-2xl py-12 transition-all duration-300"
                    style={{
                      border: '2px dashed #d4c9b0',
                      color: '#a09080',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#2d6a4f';
                      (e.currentTarget as HTMLButtonElement).style.color = '#2d6a4f';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = '#d4c9b0';
                      (e.currentTarget as HTMLButtonElement).style.color = '#a09080';
                    }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300"
                      style={{ background: '#f7f4ef' }}
                    >
                      <Plus size={20} />
                    </div>
                    <span className="text-sm font-medium">Add new family</span>
                  </button>
                )}
              </div>

              {user?.role === 'Family Head' && (
                <div className="mt-12 rounded-2xl border bg-white p-6 shadow-sm" style={{ borderColor: '#e8e0d0' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="rounded-xl bg-[#e8f5ee] p-2.5 text-[#2d6a4f]">
                      <Mail size={22} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold leading-none text-[#1a3a2a]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Family Invitations Log
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-[#a09080]">
                        Track sent invitations, credentials, and acceptance status for your family members.
                      </p>
                    </div>
                  </div>

                  {isInvitesLoading ? (
                    <div className="p-8 text-center text-sm text-[#a09080]">Loading invitations...</div>
                  ) : familyInvitations && familyInvitations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '1px solid #e8e0d0' }}>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Member Name</th>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Email / Phone</th>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Temporary Password</th>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Sent Date</th>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {familyInvitations.map((inv: any) => (
                            <tr key={inv.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
                              <td className="p-4 font-bold text-[#1a3a2a]">{inv.personName}</td>
                              <td className="p-4 text-sm">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[#2d3a2a] font-medium">{inv.email}</span>
                                  {inv.phoneNumber && (
                                    <span className="text-xs text-[#a09080] flex items-center gap-1">
                                      <Phone size={10} />
                                      {inv.phoneNumber}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-xs font-mono bg-slate-50 text-[#8a7a6a]" style={{ letterSpacing: '0.05em' }}>
                                {inv.tempPassword}
                              </td>
                              <td className="p-4 text-sm text-[#a09080]">
                                {inv.sentAt ? new Date(inv.sentAt).toLocaleString() : 'N/A'}
                              </td>
                              <td className="p-4 text-sm">
                                <span
                                  className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                  style={{
                                    backgroundColor: inv.status === 'ACCEPTED' ? '#ecfdf5' : '#fffbeb',
                                    color: inv.status === 'ACCEPTED' ? '#047857' : '#d97706',
                                  }}
                                >
                                  {inv.status}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-right">
                                {inv.status !== 'ACCEPTED' && (
                                  <button
                                    onClick={() => handleResendFamilyInvite(inv.id, inv.email)}
                                    disabled={resendInviteMutation.isPending}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border text-[#2d6a4f] hover:bg-[#e8f5ee] transition-all duration-200 cursor-pointer"
                                    style={{ borderColor: '#2d6a4f' }}
                                  >
                                    <Send size={10} />
                                    <span>Resend</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-sm text-[#a09080]">No invitations sent yet. Add family members below your profile to send invitations.</div>
                  )}
                </div>
              )}
            </>
          ) : (
            <EmptyState searchTerm={searchTerm} />
          )}
        </div>

        {/* ───── FOOTER TIPS ───── */}
        {trees && trees.length > 0 && (
          <div className="mt-6 border-t" style={{ borderColor: '#e8e0d0', background: '#f0ece4' }}>
            <div className="mx-auto max-w-6xl px-6 py-5">
              <div className="flex flex-wrap items-center justify-center gap-8 text-xs" style={{ color: '#a09080' }}>
                {[
                  { dot: '#2d6a4f', text: 'Click any family to start exploring' },
                  { dot: '#6a9e80', text: 'Add members and document relationships' },
                  { dot: '#95d5b2', text: 'Share your heritage with family' },
                ].map(({ dot, text }) => (
                  <span key={text} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ───── FAMILY CARD ───── */
type TreeCardProps = {
  tree: FamilyTree;
  onDelete: () => void;
  isDeleting: boolean;
  currentUserId?: number;
};

const TreeCard: React.FC<TreeCardProps> = ({ tree, onDelete, isDeleting, currentUserId }) => {
  const [hovered, setHovered] = useState(false);
  const [isTogglingView, setIsTogglingView] = useState(false);
  const { updateView } = useTrees();

  const photos = tree.memberPhotos || [];
  const hasPhotos = photos.length > 0;
  const isOwner = currentUserId === tree.ownerId;

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  React.useEffect(() => {
    if (photos.length <= 1) return;
    const interval = window.setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 6000);

    return () => window.clearInterval(interval);
  }, [photos.length]);

  const handleToggleView = async () => {
    setIsTogglingView(true);
    try {
      const nextView = tree.view === 'yes' ? 'no' : 'yes';
      await updateView(tree.id, nextView);
    } catch (e) {
      // toast is already handled inside updateView
    } finally {
      setIsTogglingView(false);
    }
  };

  return (
    <div
      className="group relative z-10 flex flex-col overflow-hidden rounded-2xl transition-all duration-400 min-h-[300px]"
      style={{
        background: hasPhotos ? 'transparent' : '#ffffff',
        border: hasPhotos ? '1px solid #2d5040' : '1px solid #e8e0d0',
        boxShadow: hovered ? '0 20px 40px -12px rgba(13,34,24,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {/* Top color band */}
      {!hasPhotos && (
        <div
          className="h-1 w-full transition-all duration-500"
          style={{
            background: hovered
              ? 'linear-gradient(90deg, #2d6a4f, #95d5b2)'
              : 'linear-gradient(90deg, #1a3a2a, #2d6a4f)',
          }}
        />
      )}

      <div className="flex flex-1 flex-col p-6">
        {/* Icon */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300"
          style={{
            background: hasPhotos ? 'rgba(255, 255, 255, 0.15)' : (hovered ? '#e8f5ee' : '#f0f7f2'),
            color: hasPhotos ? '#95d5b2' : '#2d6a4f',
            border: hasPhotos ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          }}
        >
          <TreePine size={22} style={{ color: hasPhotos ? '#95d5b2' : '#2d6a4f' }} />
        </div>

        {/* Glassmorphic Metadata Overlay */}
        {hasPhotos ? (
          <div className="mb-5 p-5 rounded-2xl bg-black/45 border border-white/15 backdrop-blur-md space-y-2.5 shadow-lg">
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
              <p className="flex items-center gap-1.5 border-l border-white/10 pl-4">
                <Users size={13} className="text-[#95d5b2]" />
                <span>
                  {tree.memberCount !== undefined ? `${tree.memberCount} member${tree.memberCount === 1 ? '' : 's'}` : '0 members'}
                </span>
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Name */}
            <h3
              className="mb-2 text-xl font-bold leading-snug transition-colors duration-200"
              style={{
                color: hovered ? '#1a3a2a' : '#2d3a2a',
                fontFamily: "'Playfair Display', Georgia, serif",
              }}
            >
              {tree.name}
            </h3>

            {/* Meta */}
            <div className="mb-5 space-y-1.5">
              <p className="flex items-center gap-2 text-xs" style={{ color: '#a09080' }}>
                <Calendar size={12} />
                Created{' '}
                {new Date(tree.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="flex items-center gap-2 text-xs" style={{ color: '#a09080' }}>
                <Users size={12} />
                {tree.memberCount !== undefined ? `${tree.memberCount} member${tree.memberCount === 1 ? '' : 's'}` : '0 members'} · Growing
              </p>
            </div>
          </>
        )}

        {/* Divider */}
        <div 
          className="mt-auto pt-4" 
          style={{ borderTop: hasPhotos ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #f0ece4' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={`/trees/${tree.id}`}
                className="group/link flex items-center gap-1.5 text-sm font-semibold transition-all"
                style={{ color: hasPhotos ? '#95d5b2' : '#2d6a4f' }}
              >
                <span className={hasPhotos ? 'text-white group-hover/link:text-[#95d5b2] transition-colors' : ''}>
                  Explore
                </span>
                <ArrowRight size={14} className="transition-transform duration-200 group-hover/link:translate-x-1" />
              </Link>

              {isOwner && (
                <button
                  type="button"
                  onClick={handleToggleView}
                  disabled={isTogglingView}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm transition-all duration-200 disabled:opacity-60 cursor-pointer"
                  style={{
                    backgroundColor: tree.view === 'yes' ? (hasPhotos ? 'rgba(232, 245, 238, 0.2)' : '#e8f5ee') : (hasPhotos ? 'rgba(255, 255, 255, 0.1)' : '#f0ece4'),
                    border: tree.view === 'yes' ? (hasPhotos ? '1px solid rgba(149, 213, 178, 0.3)' : '1px solid #c8e6d0') : (hasPhotos ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #e8e0d0'),
                    color: tree.view === 'yes' ? '#95d5b2' : (hasPhotos ? '#a8b8a8' : '#8a7a6a'),
                  }}
                  title={tree.view === 'yes' ? 'Make tree private' : 'Publish tree to home page'}
                >
                  {isTogglingView ? (
                    <div
                      className="h-3 w-3 animate-spin rounded-full"
                      style={{
                        border: '2px solid currentColor',
                        borderTopColor: 'transparent',
                      }}
                    />
                  ) : tree.view === 'yes' ? (
                    <Eye size={12} />
                  ) : (
                    <EyeOff size={12} />
                  )}
                  <span>{tree.view === 'yes' ? 'Public' : 'Private'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50"
              style={{ color: hasPhotos ? '#a8b8a8' : '#c8bfaa' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                (e.currentTarget as HTMLButtonElement).style.color = '#dc2626';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = hasPhotos ? '#a8b8a8' : '#c8bfaa';
              }}
              title="Delete family"
            >
              {isDeleting ? (
                <div
                  className="h-3.5 w-3.5 animate-spin rounded-full"
                  style={{ border: '2px solid #dc2626', borderTopColor: 'transparent' }}
                />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───── EMPTY STATE ───── */
const EmptyState: React.FC<{ searchTerm: string }> = ({ searchTerm }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div
      className="mb-8 flex h-28 w-28 items-center justify-center rounded-full"
      style={{ background: '#e8f5ee', border: '1px solid #c8e6d0' }}
    >
      <TreePine size={48} style={{ color: '#2d6a4f' }} />
    </div>
    <h3
      className="mb-3 text-2xl font-bold"
      style={{ color: '#1a3a2a', fontFamily: "'Playfair Display', Georgia, serif" }}
    >
      {searchTerm ? 'No families found' : 'Begin your journey'}
    </h3>
    <p className="mb-8 max-w-sm text-base leading-relaxed" style={{ color: '#a09080' }}>
      {searchTerm
        ? `No families match "${searchTerm}". Try a different name.`
        : 'Create your first family to start preserving your heritage and connecting generations.'}
    </p>
    {!searchTerm && (
      <button
        type="button"
        onClick={() =>
          document
            .querySelector<HTMLInputElement>('input[placeholder="Name your new family…"]')
            ?.focus()
        }
        className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200"
        style={{ background: '#1a3a2a' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#2d6a4f')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = '#1a3a2a')}
      >
        <Plus size={16} />
        Create your first family
      </button>
    )}
  </div>
);

export default Dashboard;
