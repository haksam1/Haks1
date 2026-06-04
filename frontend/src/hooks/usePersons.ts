import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Person } from '../types';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';

export const usePersons = (treeId?: number) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const getPersonName = (person: Person) =>
    `${person.firstName} ${person.lastName}`.trim() || 'Family member';

  const useList = (isPublic: boolean = false) => useQuery({
    queryKey: [isPublic ? 'public-persons' : 'persons', treeId],
    queryFn: async () => {
      const url = isPublic ? `/api/public/trees/${treeId}/persons` : `/api/trees/${treeId}/persons`;
      const { data } = await api.get<Person[]>(url);
      return data;
    },
    enabled: !!treeId,
  });

  const useGet = (personId?: number, isPublic: boolean = false) => useQuery({
    queryKey: [isPublic ? 'public-persons' : 'persons', treeId, personId],
    queryFn: async () => {
      const url = isPublic ? `/api/public/trees/${treeId}/persons/${personId}` : `/api/trees/${treeId}/persons/${personId}`;
      const { data } = await api.get<Person>(url);
      return data;
    },
    enabled: !!treeId && !!personId,
  });

  const createMutation = useMutation({
    mutationFn: async (personData: any) => {
      const { data } = await api.post<Person>(`/api/trees/${treeId}/persons`, personData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons', treeId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...personData }: any) => {
      const { data } = await api.put<Person>(`/api/trees/${treeId}/persons/${id}`, personData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons', treeId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/trees/${treeId}/persons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons', treeId] });
    },
  });

  const addRelationshipMutation = useMutation({
    mutationFn: async ({ personId, relatedPersonId, type }: any) => {
      await api.post(`/api/trees/${treeId}/persons/${personId}/relationships`, { relatedPersonId, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons', treeId] });
    },
  });

  const useSearch = (q: string) => useQuery({
    queryKey: ['persons', 'search', q],
    queryFn: async () => {
      const { data } = await api.get<Person[]>(`/api/persons/search?q=${q}`);
      return data;
    },
    enabled: q.length > 2,
  });

  const create = async (personData: any) => {
    const toastId = toast.loading('Creating profile', 'Saving the family member details...');

    try {
      const person = await createMutation.mutateAsync(personData);
      toast.updateToast(toastId, {
        title: 'Profile created',
        message: `${getPersonName(person)} was added.`,
        variant: 'success',
      });
      return person;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not create profile',
        message: getApiErrorMessage(error, 'Unable to create the family member. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const update = async (personData: any) => {
    const toastId = toast.loading('Saving profile', 'Updating the family member details...');

    try {
      const person = await updateMutation.mutateAsync(personData);
      toast.updateToast(toastId, {
        title: 'Profile updated',
        message: `${getPersonName(person)} was saved.`,
        variant: 'success',
      });
      return person;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not save profile',
        message: getApiErrorMessage(error, 'Unable to update the family member. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const remove = async (id: number) => {
    const toastId = toast.loading('Deleting profile', 'Removing this family member...');

    try {
      await deleteMutation.mutateAsync(id);
      toast.updateToast(toastId, {
        title: 'Profile deleted',
        message: 'The family member was removed.',
        variant: 'success',
      });
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not delete profile',
        message: getApiErrorMessage(error, 'Unable to delete the family member. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const addRelationship = async (relationshipData: any) => {
    const toastId = toast.loading('Saving relationship', 'Updating family connections...');

    try {
      await addRelationshipMutation.mutateAsync(relationshipData);
      toast.updateToast(toastId, {
        title: 'Relationship saved',
        message: 'The family connection was updated.',
        variant: 'success',
      });
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not save relationship',
        message: getApiErrorMessage(error, 'Unable to update the relationship. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  return {
    useList,
    useGet,
    create,
    update,
    delete: remove,
    addRelationship,
    useSearch,
  };
};
