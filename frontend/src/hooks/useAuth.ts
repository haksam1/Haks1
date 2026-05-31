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

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (payload: { email: string }) => {
      const { data } = await api.post('/api/auth/request-password-reset', payload);
      return data;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: { token: string; otp_code: string; new_password: string }) => {
      const { data } = await api.post('/api/auth/reset-password', payload);
      return data;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { newPassword: string }) => {
      const { data } = await api.post('/api/auth/change-password', payload);
      return data;
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

  const requestPasswordReset = async (payload: { email: string }) => {
    const toastId = toast.loading('Sending reset link', 'Checking your account...');

    try {
      const data = await requestPasswordResetMutation.mutateAsync(payload);
      toast.updateToast(toastId, {
        title: 'Email Sent',
        message: 'A password reset link and OTP have been queued for your email.',
        variant: 'success',
      });
      return data;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Request failed',
        message: getApiErrorMessage(error, 'User not found or request failed'),
        variant: 'error',
      });
      throw error;
    }
  };

  const resetPassword = async (payload: { token: string; otp_code: string; new_password: string }) => {
    const toastId = toast.loading('Resetting password', 'Updating your credentials...');

    try {
      const data = await resetPasswordMutation.mutateAsync(payload);
      toast.updateToast(toastId, {
        title: 'Password reset successful',
        message: 'Your password has been changed. You can now log in.',
        variant: 'success',
      });
      return data;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Reset failed',
        message: getApiErrorMessage(error, 'Password reset failed. Check your token or OTP.'),
        variant: 'error',
      });
      throw error;
    }
  };

  const changePassword = async (payload: { newPassword: string }) => {
    const toastId = toast.loading('Updating password', 'Setting your permanent credentials...');

    try {
      const data = await changePasswordMutation.mutateAsync(payload);
      toast.updateToast(toastId, {
        title: 'Password updated',
        message: 'Your permanent password has been set.',
        variant: 'success',
      });
      return data;
    } catch (error) {
      toast.updateToast(toastId, {
        title: 'Update failed',
        message: getApiErrorMessage(error, 'Password update failed.'),
        variant: 'error',
      });
      throw error;
    }
  };

  return {
    login,
    register,
    requestPasswordReset,
    resetPassword,
    changePassword,
    logout: clearAuth,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isRequestingReset: requestPasswordResetMutation.isPending,
    isResettingPassword: resetPasswordMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
  };
};
