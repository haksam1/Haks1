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

  const useGet = (id?: number) => useQuery({
    queryKey: ['trees', id],
    queryFn: async () => {
      const { data } = await api.get<FamilyTree>(`/api/trees/${id}`);
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

  return { useList, useGet, create, delete: remove };
};
