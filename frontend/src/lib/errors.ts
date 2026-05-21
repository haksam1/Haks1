import { isAxiosError } from 'axios';

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
  returnMessage?: unknown;
};

const getErrorBody = (data: unknown): ApiErrorBody => {
  if (typeof data === 'object' && data !== null) return data as ApiErrorBody;
  return {};
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) => {
  if (isAxiosError(error)) {
    if (!error.response) {
      return 'Could not reach the server. Make sure the backend is running.';
    }

    const body = getErrorBody(error.response.data);
    const messages = [body.message, body.error, body.returnMessage];
    const message = messages.find((value) => typeof value === 'string' && value.trim());

    if (typeof message === 'string') return message;
    if (error.response.status === 401) return 'Session expired. Please sign in again.';
    if (error.response.status >= 500) return 'The server hit a problem. Please try again.';
  }

  if (error instanceof Error && error.message.trim()) return error.message;

  return fallback;
};
