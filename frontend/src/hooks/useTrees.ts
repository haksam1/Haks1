import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { FamilyTree } from '../types';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';

export const useTrees = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const useList = () => useQuery({
    queryKey: ['trees'],
    queryFn: async () => {
      const { data } = await api.get<FamilyTree[]>('/api/trees');
      return data;
    },
  });

  const usePublicList = () => useQuery({
    queryKey: ['public-trees'],
    queryFn: async () => {
      const { data } = await api.get<FamilyTree[]>('/api/public/trees');
      return data;
    },
  });

  const useGet = (id?: number, isPublic: boolean = false) => useQuery({
    queryKey: [isPublic ? 'public-trees' : 'trees', id],
    queryFn: async () => {
      const url = isPublic ? `/api/public/trees/${id}` : `/api/trees/${id}`;
      const { data } = await api.get<FamilyTree>(url);
      return data;
    },
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data } = await api.post<FamilyTree>('/api/trees', { name });
      return data;
    },
    onSuccess: (newTree) => {
      queryClient.setQueryData<FamilyTree[]>(['trees'], (trees) => {
        if (!trees) return [newTree];
        if (trees.some((tree) => tree.id === newTree.id)) return trees;
        return [newTree, ...trees];
      });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/trees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      queryClient.invalidateQueries({ queryKey: ['public-trees'] });
    },
  });

  const updateViewMutation = useMutation({
    mutationFn: async ({ id, view }: { id: number; view: string }) => {
      const { data } = await api.put<FamilyTree>(`/api/trees/${id}/view`, { view });
      return data;
    },
    onSuccess: (updatedTree) => {
      queryClient.setQueryData<FamilyTree[]>(['trees'], (trees) => {
        if (!trees) return [updatedTree];
        return trees.map((tree) => (tree.id === updatedTree.id ? updatedTree : tree));
      });
      queryClient.invalidateQueries({ queryKey: ['trees'] });
      queryClient.invalidateQueries({ queryKey: ['trees', updatedTree.id] });
      queryClient.invalidateQueries({ queryKey: ['public-trees'] });
    },
  });

  const create = async (name: string) => {
    const toastId = toast.loading('Creating family', 'Saving the new family tree...');

    try {
      const tree = await createMutation.mutateAsync(name);
      toast.updateToast(toastId, {
        title: 'Family created',
        message: `${tree.name} is ready.`,
        variant: 'success',
      });
      return tree;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not create family',
        message: getApiErrorMessage(error, 'Unable to create the family. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const remove = async (id: number) => {
    const toastId = toast.loading('Deleting family', 'Removing the selected family tree...');

    try {
      await deleteMutation.mutateAsync(id);
      toast.updateToast(toastId, {
        title: 'Family deleted',
        message: 'The family tree was removed.',
        variant: 'success',
      });
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not delete family',
        message: getApiErrorMessage(error, 'Unable to delete the family. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const updateView = async (id: number, view: string) => {
    const toastId = toast.loading('Updating family settings', 'Saving view settings...');
    try {
      const tree = await updateViewMutation.mutateAsync({ id, view });
      toast.updateToast(toastId, {
        title: 'Settings saved',
        message: `${tree.name} is now ${view === 'yes' ? 'public' : 'private'}.`,
        variant: 'success',
      });
      return tree;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not update settings',
        message: getApiErrorMessage(error, 'Unable to update the family view settings. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  return { useList, usePublicList, useGet, create, delete: remove, updateView };
};
