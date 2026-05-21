import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';

export const useUpload = (treeId: number, personId: number) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { compressToGzipBlob } = await import('../lib/compression');
      const gzipBlob = await compressToGzipBlob(base64DataUrl);

      const formData = new FormData();
      formData.append('file', gzipBlob, 'photo.gz');
      formData.append('treeId', treeId.toString());
      formData.append('personId', personId.toString());

      const { data } = await api.post<{ url: string }>('/api/upload/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons', treeId, personId] });
      queryClient.invalidateQueries({ queryKey: ['persons', treeId] });
    },
  });

  const uploadPhoto = async (file: File) => {
    const toastId = toast.loading('Uploading photo', 'Saving the profile image...');

    try {
      const result = await uploadPhotoMutation.mutateAsync(file);
      toast.updateToast(toastId, {
        title: 'Photo uploaded',
        message: 'The profile image was updated.',
        variant: 'success',
      });
      return result;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Could not upload photo',
        message: getApiErrorMessage(error, 'Unable to upload the photo. Please try again.'),
        variant: 'error',
      });
      throw error;
    }
  };

  return {
    uploadPhoto,
    isUploading: uploadPhotoMutation.isPending,
  };
};
