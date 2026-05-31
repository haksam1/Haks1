import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';
import { Link } from 'react-router-dom';
import {
  TreePine, Mail, Phone, Activity, HeartPulse, Send, Check, Search, Calendar
} from 'lucide-react';

const dashboardBackgroundImage = '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg';

const OwnerDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'health' | 'families' | 'invitations' | 'logs'>('health');
  
  // Search terms for different sections
  const [familySearch, setFamilySearch] = useState('');
  const [inviteSearch, setInviteSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Queries
  const { data: health, isLoading: isHealthLoading } = useQuery({
    queryKey: ['owner', 'health'],
    queryFn: async () => {
      const { data } = await api.get<any>('/api/owner/health');
      return data;
    }
  });

  const { data: families, isLoading: isFamiliesLoading } = useQuery({
    queryKey: ['owner', 'families'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/owner/families');
      return data;
    }
  });

  const { data: invitations, isLoading: isInvitationsLoading } = useQuery({
    queryKey: ['owner', 'invitations'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/owner/invitations');
      return data;
    }
  });

  const { data: logs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['owner', 'logs'],
    queryFn: async () => {
      const { data } = await api.get<any[]>('/api/owner/activity-logs');
      return data;
    }
  });

  // Mutations
  const resendMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/api/owner/invitations/${id}/resend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'invitations'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'health'] });
    }
  });

  const activateMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/api/owner/invitations/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'invitations'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'health'] });
    }
  });

  const handleResend = async (id: number, email: string) => {
    const toastId = toast.loading('Resending', `Queuing invitation details for ${email}...`);
    try {
      await resendMutation.mutateAsync(id);
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

  const handleActivate = async (id: number, name: string) => {
    const toastId = toast.loading('Activating', `Manually activating ${name}...`);
    try {
      await activateMutation.mutateAsync(id);
      toast.updateToast(toastId, {
        title: 'Activated',
        message: `${name} has been successfully activated.`,
        variant: 'success',
      });
    } catch (err) {
      toast.updateToast(toastId, {
        title: 'Failed',
        message: getApiErrorMessage(err, 'Failed to activate member.'),
        variant: 'error',
      });
    }
  };

  // Filter lists
  const filteredFamilies = families?.filter(f =>
    f.name.toLowerCase().includes(familySearch.toLowerCase()) ||
    f.headName.toLowerCase().includes(familySearch.toLowerCase())
  );

  const filteredInvitations = invitations?.filter(i =>
    i.email.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    (i.personName && i.personName.toLowerCase().includes(inviteSearch.toLowerCase())) ||
    (i.treeName && i.treeName.toLowerCase().includes(inviteSearch.toLowerCase()))
  );

  const filteredLogs = logs?.filter(l =>
    l.action.toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.userName && l.userName.toLowerCase().includes(logSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f4ef', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      
      {/* Hero / Header Section */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: '#0d2218',
          backgroundImage: `linear-gradient(rgba(13, 34, 24, 0.8), rgba(13, 34, 24, 0.9)), url(${dashboardBackgroundImage})`,
          backgroundPosition: 'center 34%',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      >
        <div className="relative mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase" style={{ background: '#1a3a2a', color: '#95d5b2' }}>
                System Administration
              </span>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Back Office Dashboard
              </h1>
              <p className="mt-2 text-base" style={{ color: '#a8b8a8' }}>
                Monitor system metrics, inspect family trees, and manage invitations across all registration groups.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex gap-4">
              <div className="rounded-2xl px-5 py-3.5 text-center" style={{ background: '#1a3a2a', border: '1px solid #2d5040' }}>
                <p className="text-2xl font-bold text-white">{health?.activeFamilies ?? 0}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#6a9e80' }}>Total Families</p>
              </div>
              <div className="rounded-2xl px-5 py-3.5 text-center" style={{ background: '#1a3a2a', border: '1px solid #2d5040' }}>
                <p className="text-2xl font-bold text-white">{health?.pendingActivations ?? 0}</p>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#6a9e80' }}>Pending Invites</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mx-auto max-w-6xl px-6 mt-8">
        <div className="flex border-b" style={{ borderColor: '#e8e0d0' }}>
          {[
            { id: 'health', label: 'System Health & Metrics', icon: HeartPulse },
            { id: 'families', label: 'Registered Families', icon: TreePine },
            { id: 'invitations', label: 'Invitations Log', icon: Mail },
            { id: 'logs', label: 'Activity Logs', icon: Activity },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition-all"
                style={{
                  borderColor: active ? '#2d6a4f' : 'transparent',
                  color: active ? '#2d6a4f' : '#a09080',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* ───── SYSTEM HEALTH PANEL ───── */}
        {activeTab === 'health' && (
          <div className="space-y-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl p-6 bg-white shadow-sm border" style={{ borderColor: '#e8e0d0' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 rounded-xl bg-green-50 text-green-700">
                    <TreePine size={24} />
                  </span>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
                </div>
                <h3 className="text-sm font-medium text-[#a09080] uppercase tracking-wider">Active Family Trees</h3>
                <p className="text-3xl font-bold mt-1 text-[#1a3a2a]">{isHealthLoading ? '...' : health?.activeFamilies}</p>
              </div>

              <div className="rounded-2xl p-6 bg-white shadow-sm border" style={{ borderColor: '#e8e0d0' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 rounded-xl bg-amber-50 text-amber-700">
                    <Mail size={24} />
                  </span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">Pending</span>
                </div>
                <h3 className="text-sm font-medium text-[#a09080] uppercase tracking-wider">Pending User Activations</h3>
                <p className="text-3xl font-bold mt-1 text-[#1a3a2a]">{isHealthLoading ? '...' : health?.pendingActivations}</p>
              </div>

              <div className="rounded-2xl p-6 bg-white shadow-sm border" style={{ borderColor: '#e8e0d0' }}>
                <div className="flex items-center justify-between mb-4">
                  <span className="p-3 rounded-xl bg-blue-50 text-blue-700">
                    <Activity size={24} />
                  </span>
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">Response</span>
                </div>
                <h3 className="text-sm font-medium text-[#a09080] uppercase tracking-wider">Invitation Acceptance Rate</h3>
                <p className="text-3xl font-bold mt-1 text-[#1a3a2a]">
                  {isHealthLoading ? '...' : `${(health?.invitationResponseRate ?? 0).toFixed(1)}%`}
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: '#e8e0d0' }}>
              <h3 className="text-lg font-bold mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#1a3a2a' }}>
                System Metrics Overview
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#fdfbf7' }}>
                  <span className="text-sm text-[#2d3a2a] font-medium">Total Sent Invitations</span>
                  <span className="font-bold text-[#1a3a2a]">{health?.totalInvitations ?? 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: '#fdfbf7' }}>
                  <span className="text-sm text-[#2d3a2a] font-medium">Accepted Invitations</span>
                  <span className="font-bold text-[#1a3a2a]">{health?.acceptedInvitations ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ───── REGISTERED FAMILIES PANEL ───── */}
        {activeTab === 'families' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09080]" />
                <input
                  type="text"
                  placeholder="Search family name or head..."
                  value={familySearch}
                  onChange={e => setFamilySearch(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-4 text-sm outline-none border"
                  style={{ background: '#fff', borderColor: '#e8e0d0' }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#e8e0d0' }}>
              {isFamiliesLoading ? (
                <div className="p-12 text-center text-sm text-[#a09080]">Loading families...</div>
              ) : filteredFamilies && filteredFamilies.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '1px solid #e8e0d0' }}>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Family Name</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Family Head</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Members</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Created Date</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFamilies.map((fam: any) => (
                      <tr key={fam.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
                        <td className="p-4 font-bold text-[#1a3a2a]">{fam.name}</td>
                        <td className="p-4 text-sm text-[#2d3a2a]">{fam.headName}</td>
                        <td className="p-4 text-sm text-[#a09080]">{fam.headEmail}</td>
                        <td className="p-4 text-sm font-semibold text-[#2d6a4f]">{fam.memberCount}</td>
                        <td className="p-4 text-sm text-[#a09080]">
                          {fam.createdAt ? new Date(fam.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-sm">
                          <Link
                            to={`/trees/${fam.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#2d6a4f] hover:underline"
                          >
                            View Tree
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-sm text-[#a09080]">No family trees registered yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ───── INVITATIONS PANEL ───── */}
        {activeTab === 'invitations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09080]" />
                <input
                  type="text"
                  placeholder="Search invitees, emails, trees..."
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-4 text-sm outline-none border"
                  style={{ background: '#fff', borderColor: '#e8e0d0' }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#e8e0d0' }}>
              {isInvitationsLoading ? (
                <div className="p-12 text-center text-sm text-[#a09080]">Loading invitations log...</div>
              ) : filteredInvitations && filteredInvitations.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '1px solid #e8e0d0' }}>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Invitee Name</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Email / Phone</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Family Tree</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Temporary Password</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Sent Date</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitations.map((inv: any) => (
                      <tr key={inv.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
                        <td className="p-4 font-bold text-[#1a3a2a]">{inv.personName}</td>
                        <td className="p-4 text-sm">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#2d3a2a] font-medium">{inv.email}</span>
                            {inv.phoneNumber && <span className="text-xs text-[#a09080] flex items-center gap-1"><Phone size={10} />{inv.phoneNumber}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#2d3a2a]">{inv.treeName}</td>
                        <td className="p-4 text-xs font-mono bg-slate-50 text-[#8a7a6a]" style={{ letterSpacing: '0.05em' }}>{inv.tempPassword}</td>
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
                        <td className="p-4 text-sm text-right space-x-2">
                          {inv.status !== 'ACCEPTED' && (
                            <>
                              <button
                                onClick={() => handleResend(inv.id, inv.email)}
                                disabled={resendMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border text-[#2d6a4f] hover:bg-[#e8f5ee]"
                                style={{ borderColor: '#2d6a4f' }}
                              >
                                <Send size={10} />
                                <span>Resend</span>
                              </button>
                              <button
                                onClick={() => handleActivate(inv.id, inv.personName)}
                                disabled={activateMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg text-white"
                                style={{ backgroundColor: '#2d6a4f' }}
                              >
                                <Check size={10} />
                                <span>Activate</span>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-sm text-[#a09080]">No invitations logs found.</div>
              )}
            </div>
          </div>
        )}

        {/* ───── AUDITING LOGS PANEL ───── */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a09080]" />
                <input
                  type="text"
                  placeholder="Search user or activity description..."
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                  className="w-full rounded-xl py-2 pl-9 pr-4 text-sm outline-none border"
                  style={{ background: '#fff', borderColor: '#e8e0d0' }}
                />
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: '#e8e0d0' }}>
              {isLogsLoading ? (
                <div className="p-12 text-center text-sm text-[#a09080]">Loading auditing history...</div>
              ) : filteredLogs && filteredLogs.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#fcfaf7', borderBottom: '1px solid #e8e0d0' }}>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Timestamp</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">User ID</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">User Name</th>
                      <th className="p-4 text-xs font-bold text-[#2d3a2a] uppercase tracking-wider">Action Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log: any) => (
                      <tr key={log.id} className="border-b hover:bg-slate-50 transition-colors" style={{ borderColor: '#f0ece4' }}>
                        <td className="p-4 text-sm text-[#a09080] flex items-center gap-1.5">
                          <Calendar size={13} />
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-4 text-sm font-mono text-[#8a7a6a]">{log.userId ? log.userId : 'SYSTEM'}</td>
                        <td className="p-4 text-sm font-semibold text-[#1a3a2a]">{log.userName ? log.userName : 'System Admin'}</td>
                        <td className="p-4 text-sm text-[#2d3a2a] font-medium">{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-sm text-[#a09080]">No system activity logs found.</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerDashboard;
