import { useMutation } from '@tanstack/react-query';
import api from '../api/client';
import { AuthResponse } from '../types';
import { useAuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/errors';

export const useAuth = () => {
  const { login: setAuth, logout: clearAuth } = useAuthContext();
  const toast = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      const { token, ...user } = data;
      setAuth(token, user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const { data } = await api.post<AuthResponse>('/api/auth/register', userData);
      return data;
    },
    onSuccess: (data) => {
      const { token, ...user } = data;
      setAuth(token, user);
    },
  });

  const login = async (credentials: any) => {
    const toastId = toast.loading('Signing in', 'Checking your account details...');

    try {
      const data = await loginMutation.mutateAsync(credentials);
      toast.updateToast(toastId, {
        title: 'Signed in',
        message: 'Welcome back.',
        variant: 'success',
      });
      return data;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Sign in failed',
        message: getApiErrorMessage(error, 'Invalid email or password'),
        variant: 'error',
      });
      throw error;
    }
  };

  const register = async (userData: any) => {
    const toastId = toast.loading('Creating account', 'Setting up your family archive...');

    try {
      const data = await registerMutation.mutateAsync(userData);
      toast.updateToast(toastId, {
        title: 'Account created',
        message: 'Your account is ready.',
        variant: 'success',
      });
      return data;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Registration failed',
        message: getApiErrorMessage(error, 'Registration failed'),
        variant: 'error',
      });
      throw error;
    }
  };

  return {
    login,
    register,
    logout: clearAuth,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
};
