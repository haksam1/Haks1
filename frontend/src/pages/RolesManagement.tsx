import React, { useState } from 'react';
import { useRoles, type Role } from '../hooks/useRoles';
import { Shield, Plus, Trash2, Edit3, Check, Users, ShieldAlert, Sparkles, UserCheck, X, RefreshCw } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '../context/AuthContext';

const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
});

type RoleForm = z.infer<typeof roleSchema>;

const profileBackgroundImage = '/images/d34bb4775f0b3a5d53edac6dcb4b8377.jpg';

const ALL_PERMISSIONS = [
  { key: 'view_dashboard', label: 'View Dashboard', desc: 'Grants access to the main dashboard and family trees' },
  { key: 'view_search', label: 'View Search', desc: 'Allows searching through the family database' },
  { key: 'view_roles', label: 'View Roles & Permissions', desc: 'Allows configuring user roles, access control, and permissions' },
  { key: 'view_settings', label: 'View Settings', desc: 'Grants access to general configuration and settings' },
];

const RolesManagement: React.FC = () => {
  const { user: currentUser } = useAuthContext();
  const {
    useList,
    useUsersList,
    createRole,
    updateRole,
    deleteRole,
    updateUserRole
  } = useRoles();

  const { data: roles = [], isLoading: loadingRoles, refetch: refetchRoles } = useList();
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useUsersList();

  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
  });

  const handleOpenCreateForm = () => {
    setEditingRole(null);
    setSelectedPermissions(['view_dashboard', 'view_search']);
    reset({ name: '' });
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (role: Role) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions);
    reset({ name: role.name });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRole(null);
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((p) => p !== permKey)
        : [...prev, permKey]
    );
  };

  const onSubmit = async (data: RoleForm) => {
    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          name: data.name,
          permissions: selectedPermissions,
        });
      } else {
        await createRole({
          name: data.name,
          permissions: selectedPermissions,
        });
      }
      setIsFormOpen(false);
    } catch (e) {
      // toast inside hook handles this
    }
  };

  const handleDeleteRole = async (roleId: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the role "${name}"? Users assigned to this role will lose their custom permissions.`)) {
      try {
        await deleteRole(roleId);
      } catch (e) {
        // toast inside hook handles this
      }
    }
  };

  const handleRoleChange = async (userId: number, roleIdVal: string) => {
    if (!roleIdVal) return;
    try {
      await updateUserRole(userId, Number(roleIdVal));
    } catch (e) {
      // toast inside hook handles this
    }
  };

  const isDefaultRole = (name: string) => {
    return name.toLowerCase() === 'system admin' || name.toLowerCase() === 'parent admin';
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f7f4ef] md:min-h-screen" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Banner */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundColor: '#0d2218',
          backgroundImage: `linear-gradient(rgba(13, 34, 24, 0.85), rgba(13, 34, 24, 0.92)), url(${profileBackgroundImage})`,
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
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="rounded-full bg-[#1a3a2a] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#95d5b2]">
                Security Portal
              </span>
              <h1
                className="mt-5 text-4xl font-bold leading-tight text-white md:text-5xl"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Roles & Permissions
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#a8b8a8]">
                Define system access privileges and assign specific roles to family tree administrators and members.
              </p>
            </div>

            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: '#1a3a2a', border: '1px solid #2d5040', color: '#95d5b2' }}
            >
              <Shield size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-[#e8e0d0] bg-white sticky top-0 z-30 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'border-[#1a3a2a] text-[#1a3a2a]'
                  : 'border-transparent text-[#a09080] hover:text-[#5a4a3a]'
              }`}
            >
              <Shield size={16} />
              <span>Roles List</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'border-[#1a3a2a] text-[#1a3a2a]'
                  : 'border-transparent text-[#a09080] hover:text-[#5a4a3a]'
              }`}
            >
              <Users size={16} />
              <span>User Assignments</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                refetchRoles();
                refetchUsers();
              }}
              title="Refresh Data"
              className="p-2 rounded-xl text-[#5a4a3a] hover:bg-[#f7f4ef] border border-transparent hover:border-[#e8e0d0] transition-all cursor-pointer"
            >
              <RefreshCw size={16} />
            </button>

            {activeTab === 'roles' && (
              <button
                onClick={handleOpenCreateForm}
                className="flex items-center gap-2 rounded-xl bg-[#1a3a2a] px-4 py-2 text-xs font-bold text-white hover:bg-[#2d6a4f] transition-all duration-200 cursor-pointer shadow-sm"
              >
                <Plus size={14} />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === 'roles' ? (
          /* ======================================================== */
          /* ROLES TAB                                                */
          /* ======================================================== */
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Roles Listing Grid */}
            <div className="lg:col-span-2 space-y-6">
              {loadingRoles ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-[#e8e0d0] text-[#a09080]">
                  <RefreshCw size={36} className="animate-spin text-[#2d6a4f] mb-3" />
                  <p className="text-sm font-semibold">Loading system roles...</p>
                </div>
              ) : roles.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#e8e0d0]">
                  <p className="text-[#a09080]">No roles configured.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {roles.map((role) => {
                    const isSystem = isDefaultRole(role.name);
                    return (
                      <div
                        key={role.id}
                        className="group flex flex-col justify-between rounded-2xl bg-white p-6 shadow-sm border border-[#e8e0d0] hover:border-[#2d6a4f]/40 hover:shadow-md transition-all duration-300 relative overflow-hidden"
                      >
                        {isSystem && (
                          <div className="absolute top-0 right-0 bg-[#e8f5ee] border-b border-l border-[#c8e6d0] text-[#2d6a4f] text-[9px] font-extrabold uppercase px-2.5 py-1 tracking-wider rounded-bl-xl">
                            Default Role
                          </div>
                        )}

                        <div>
                          <div className="flex items-start justify-between">
                            <h3 className="text-lg font-bold text-[#1a3a2a] group-hover:text-[#2d6a4f] transition-colors leading-none pr-12">
                              {role.name}
                            </h3>
                          </div>

                          <div className="mt-4 space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a09080]">
                              Granted Permissions
                            </span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {ALL_PERMISSIONS.map((perm) => {
                                const hasPerm = role.permissions.includes(perm.key);
                                return (
                                  <span
                                    key={perm.key}
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all ${
                                      hasPerm
                                        ? 'bg-[#e8f5ee] text-[#2d6a4f] border-[#c8e6d0]'
                                        : 'bg-[#f7f4ef] text-[#a09080]/60 border-transparent line-through'
                                    }`}
                                  >
                                    {perm.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#f0ece4] flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(role)}
                            className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#e8e0d0] bg-[#f7f4ef] px-3.5 py-2 text-xs font-bold text-[#5a4a3a] hover:bg-[#e8e0d0] transition-all"
                          >
                            <Edit3 size={12} />
                            <span>Modify</span>
                          </button>

                          {!isSystem && (
                            <button
                              onClick={() => handleDeleteRole(role.id, role.name)}
                              className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 hover:text-red-700 transition-all"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Create / Modify Form Panel */}
            <div className="lg:col-span-1">
              {isFormOpen ? (
                <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-md border border-[#e8e0d0] space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-[#f0ece4]">
                    <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      <Sparkles size={16} className="text-[#2d6a4f]" />
                      <span>{editingRole ? 'Modify Role' : 'Create Custom Role'}</span>
                    </h2>
                    <button
                      onClick={handleCloseForm}
                      className="p-1.5 rounded-xl text-[#a09080] hover:bg-[#f7f4ef] transition-all cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-[#2d3a2a]">Role Name *</label>
                      <input
                        {...register('name')}
                        placeholder="e.g. Tree Editor"
                        className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all bg-[#f7f4ef] border border-[#e8e0d0] focus:border-[#2d6a4f]"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-[#2d3a2a]">Assign Permissions</label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {ALL_PERMISSIONS.map((perm) => {
                          const isChecked = selectedPermissions.includes(perm.key);
                          return (
                            <button
                              type="button"
                              key={perm.key}
                              onClick={() => togglePermission(perm.key)}
                              className={`w-full text-left rounded-xl p-3 border transition-all flex items-start gap-3 cursor-pointer ${
                                isChecked
                                  ? 'bg-[#e8f5ee] border-[#2d6a4f] text-[#1a3a2a]'
                                  : 'bg-[#f7f4ef] border-[#e8e0d0] text-[#5a4a3a] hover:bg-[#e8ece4]'
                              }`}
                            >
                              <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                                isChecked ? 'bg-[#2d6a4f] border-[#2d6a4f] text-white' : 'border-[#a09080] bg-white'
                              }`}>
                                {isChecked && <Check size={10} strokeWidth={3} />}
                              </div>
                              <div>
                                <p className="text-xs font-bold leading-none">{perm.label}</p>
                                <p className="text-[10px] text-[#a09080] mt-1 leading-normal">{perm.desc}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-[#1a3a2a] py-3 text-xs font-bold text-white hover:bg-[#2d6a4f] transition-all cursor-pointer"
                      >
                        {editingRole ? 'Save Changes' : 'Create Role'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseForm}
                        className="flex-1 rounded-xl bg-[#f0ece4] py-3 text-xs font-bold text-[#5a4a3a] hover:bg-[#e8e0d0] transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#e8e0d0] bg-white p-6 text-center space-y-4">
                  <ShieldAlert className="mx-auto text-[#a09080]" size={36} />
                  <div>
                    <h3 className="text-sm font-bold text-[#1a3a2a]">Access Settings</h3>
                    <p className="text-xs text-[#a09080] mt-1.5 leading-relaxed">
                      Select a role to modify its permissions, or click the "Create Custom Role" button to define a new access tier.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateForm}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#1a3a2a] px-4 py-2.5 text-xs font-bold text-[#1a3a2a] hover:bg-[#1a3a2a] hover:text-white transition-all duration-200 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Create Custom Role</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* USERS TAB                                                */
          /* ======================================================== */
          <div className="rounded-2xl bg-white border border-[#e8e0d0] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#f0ece4]">
              <h2 className="text-lg font-bold text-[#1a3a2a] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                <UserCheck size={18} className="text-[#2d6a4f]" />
                <span>User Role Assignment</span>
              </h2>
              <p className="text-xs text-[#a09080] mt-1">
                Manage user credentials, review their designated roles, and adjust system permissions access instantly.
              </p>
            </div>

            {loadingUsers ? (
              <div className="flex flex-col items-center justify-center p-16 text-[#a09080]">
                <RefreshCw size={36} className="animate-spin text-[#2d6a4f] mb-3" />
                <p className="text-sm font-semibold">Loading system users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-[#a09080]">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#f7f4ef] text-[10px] font-extrabold uppercase tracking-wider text-[#a09080] border-b border-[#e8e0d0]">
                      <th className="px-6 py-4">User Information</th>
                      <th className="px-6 py-4">Designated Role</th>
                      <th className="px-6 py-4">Active Permissions</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ece4]">
                    {users.map((u) => {
                      const isMe = currentUser?.email === u.email;
                      return (
                        <tr key={u.id} className="hover:bg-[#f7f4ef]/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ee] text-xs font-bold text-[#2d6a4f] border border-[#c8e6d0]">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-bold text-[#2d3a2a]">{u.name}</span>
                                  {isMe && (
                                    <span className="rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[9px] font-extrabold text-[#2d6a4f] border border-[#c8e6d0]">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[#a09080]">{u.email}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isDefaultRole(u.roleName)
                                ? 'bg-[#e8f5ee] text-[#2d6a4f]'
                                : 'bg-[#fff6df] text-[#9a6b22]'
                            }`}>
                              {u.roleName}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-sm">
                              {u.permissions.length === 0 ? (
                                <span className="text-xs text-[#a09080] italic">No permissions</span>
                              ) : (
                                u.permissions.map((p) => (
                                  <span
                                    key={p}
                                    className="rounded bg-[#f7f4ef] px-1.5 py-0.5 text-[9px] font-semibold text-[#5a4a3a] border border-[#e8e0d0]"
                                  >
                                    {p}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end items-center gap-3">
                              {isMe ? (
                                <span className="text-xs text-[#a09080] italic">Cannot demote yourself</span>
                              ) : (
                                <select
                                  value={u.roleId || ''}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="rounded-xl px-3 py-1.5 text-xs outline-none bg-[#f7f4ef] border border-[#e8e0d0] text-[#5a4a3a] focus:border-[#2d6a4f] transition-all cursor-pointer"
                                >
                                  <option value="" disabled>-- Assign Role --</option>
                                  {roles.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RolesManagement;
