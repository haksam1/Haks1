import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface UserRoleDto {
  id: number;
  name: string;
  email: string;
  roleId: number | null;
  roleName: string;
  permissions: string[];
}

export const useRoles = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const useList = () => useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await api.get<Role[]>('/api/roles');
      return data;
    },
  });

  const useUsersList = () => useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<UserRoleDto[]>('/api/users');
      return data;
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (roleData: { name: string; permissions: string[] }) => {
      const { data } = await api.post<Role>('/api/roles', roleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, ...roleData }: { id: number; name: string; permissions: string[] }) => {
      const { data } = await api.put<Role>(`/api/roles/${id}`, roleData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number; roleId: number }) => {
      await api.put(`/api/users/${userId}/role`, { roleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const createRole = async (roleData: { name: string; permissions: string[] }) => {
    const toastId = toast.loading('Creating role', 'Saving the new role...');
    try {
      const role = await createRoleMutation.mutateAsync(roleData);
      toast.updateToast(toastId, {
        title: 'Role created',
        message: `Role "${role.name}" was successfully created.`,
        variant: 'success',
      });
      return role;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not create role',
        message: getApiErrorMessage(error, 'Unable to create the role. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const updateRole = async (roleData: { id: number; name: string; permissions: string[] }) => {
    const toastId = toast.loading('Updating role', 'Saving changes to the role...');
    try {
      const role = await updateRoleMutation.mutateAsync(roleData);
      toast.updateToast(toastId, {
        title: 'Role updated',
        message: `Role "${role.name}" was successfully updated.`,
        variant: 'success',
      });
      return role;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not update role',
        message: getApiErrorMessage(error, 'Unable to update the role. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const deleteRole = async (id: number) => {
    const toastId = toast.loading('Deleting role', 'Removing this role...');
    try {
      await deleteRoleMutation.mutateAsync(id);
      toast.updateToast(toastId, {
        title: 'Role deleted',
        message: 'The role has been deleted.',
        variant: 'success',
      });
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not delete role',
        message: getApiErrorMessage(error, 'Unable to delete the role. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const updateUserRole = async (userId: number, roleId: number) => {
    const toastId = toast.loading('Updating user role', 'Assigning role to user...');
    try {
      await updateUserRoleMutation.mutateAsync({ userId, roleId });
      toast.updateToast(toastId, {
        title: 'User role updated',
        message: 'The user role has been updated successfully.',
        variant: 'success',
      });
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not update user role',
        message: getApiErrorMessage(error, 'Unable to update user role. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  return {
    useList,
    useUsersList,
    createRole,
    updateRole,
    deleteRole,
    updateUserRole,
    isCreating: createRoleMutation.isPending,
    isUpdating: updateRoleMutation.isPending,
    isDeleting: deleteRoleMutation.isPending,
    isUpdatingUserRole: updateUserRoleMutation.isPending,
  };
};
