export type ToastVariant = 'success' | 'error' | 'info' | 'loading';

export type ToastEventDetail = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
};

export const TOAST_EVENT = 'family-tree:toast';

const QUEUED_TOAST_KEY = 'family-tree:queued-toast';
const TOAST_VARIANTS: ToastVariant[] = ['success', 'error', 'info', 'loading'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isToastEventDetail = (value: unknown): value is ToastEventDetail => {
  if (!isRecord(value) || typeof value.title !== 'string') return false;
  if (value.message !== undefined && typeof value.message !== 'string') return false;
  if (value.duration !== undefined && typeof value.duration !== 'number') return false;
  if (value.variant !== undefined && !TOAST_VARIANTS.includes(value.variant as ToastVariant)) return false;

  return true;
};

export const emitToast = (detail: ToastEventDetail) => {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent<ToastEventDetail>(TOAST_EVENT, { detail }));
};

export const queueToast = (detail: ToastEventDetail) => {
  if (typeof window === 'undefined') return;

  window.sessionStorage.setItem(QUEUED_TOAST_KEY, JSON.stringify(detail));
};

export const consumeQueuedToast = () => {
  if (typeof window === 'undefined') return null;

  const value = window.sessionStorage.getItem(QUEUED_TOAST_KEY);
  if (!value) return null;

  window.sessionStorage.removeItem(QUEUED_TOAST_KEY);

  try {
    const parsed = JSON.parse(value) as unknown;
    return isToastEventDetail(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
