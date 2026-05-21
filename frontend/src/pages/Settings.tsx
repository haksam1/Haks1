import React from 'react';
import { useAuthContext } from '../context/AuthContext';
import { User, Shield, Bell, Lock } from 'lucide-react';

const Settings: React.FC = () => {
  const { user } = useAuthContext();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f4ef] md:min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div className="relative overflow-hidden bg-[#0d2218]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#a8d5b5 1px, transparent 1px), linear-gradient(90deg, #a8d5b5 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[420px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #2d6a4f 0%, transparent 70%)' }}
        />

        <div className="relative mx-auto max-w-5xl px-6 py-12">
          <span className="rounded-full bg-[#1a3a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#95d5b2]">
            Account
          </span>
          <h1
            className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Account Settings
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a8b8a8]">
            Manage your personal information, security preferences, and app configuration.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="space-y-6">
          {/* Personal Info Card */}
          <div className="rounded-2xl bg-white p-8 shadow-sm" style={{ border: '1px solid #e8e0d0' }}>
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>
              <div className="rounded-xl bg-[#e8f5ee] p-2 text-[#2d6a4f]">
                <User size={18} />
              </div>
              <span>Personal Information</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-[#f7f4ef] p-4" style={{ border: '1px solid #e8e0d0' }}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a09080' }}>Full Name</label>
                <p className="text-lg font-bold" style={{ color: '#2d3a2a' }}>{user?.name}</p>
              </div>
              <div className="rounded-2xl bg-[#f7f4ef] p-4" style={{ border: '1px solid #e8e0d0' }}>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: '#a09080' }}>Email Address</label>
                <p className="text-lg font-bold" style={{ color: '#2d3a2a' }}>{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm" style={{ border: '1px solid #e8e0d0' }}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="flex items-center gap-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>
                <div className="rounded-xl bg-[#fff6df] p-2 text-[#9a6b22]">
                  <Shield size={18} />
                </div>
                <span>Security</span>
              </h2>
              <span className="rounded-full bg-[#fff6df] px-2.5 py-1 text-xs font-bold text-[#9a6b22]" style={{ border: '1px solid #f0dbab' }}>
                Locked
              </span>
            </div>
            <div className="space-y-4 opacity-60">
              <p className="text-sm" style={{ color: '#a09080' }}>Change your password and manage security keys.</p>
              <button disabled className="flex cursor-not-allowed items-center gap-2 rounded-xl px-5 py-2.5 font-bold text-[#a09080]" style={{ background: '#f7f4ef', border: '1px solid #e8e0d0' }}>
                <Lock size={16} />
                <span>Change Password</span>
              </button>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm" style={{ border: '1px solid #e8e0d0' }}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="flex items-center gap-3 text-xl font-bold" style={{ color: '#1a3a2a' }}>
                <div className="rounded-xl bg-[#e8f5ee] p-2 text-[#2d6a4f]">
                  <Bell size={18} />
                </div>
                <span>Notifications</span>
              </h2>
              <span className="rounded-full bg-[#e8f5ee] px-2.5 py-1 text-xs font-bold text-[#2d6a4f]" style={{ border: '1px solid #c8e6d0' }}>
                Locked
              </span>
            </div>
            <div className="space-y-2 opacity-60">
              <p className="text-sm" style={{ color: '#a09080' }}>Configure email and push notifications for family activity.</p>
              <p className="text-xs font-semibold" style={{ color: '#2d6a4f' }}>Notification settings are coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
