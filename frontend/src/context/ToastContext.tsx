import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import {
  TOAST_EVENT,
  consumeQueuedToast,
  type ToastEventDetail,
  type ToastVariant,
} from '../lib/toast-events';

type Toast = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  showToast: (toast: ToastEventDetail) => string;
  updateToast: (id: string, toast: ToastEventDetail) => void;
  dismissToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  loading: (title: string, message?: string) => string;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const DEFAULT_DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  error: 6500,
  info: 4500,
  loading: 0,
};

const makeToastId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getToastIcon = (variant: ToastVariant) => {
  if (variant === 'success') return <CheckCircle2 size={20} />;
  if (variant === 'error') return <AlertCircle size={20} />;
  if (variant === 'loading') return <Loader2 size={20} className="animate-spin" />;
  return <Info size={20} />;
};

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-emerald-200 text-emerald-700',
  error: 'border-red-200 text-red-700',
  info: 'border-[#e8e0d0] text-[#2d6a4f]',
  loading: 'border-[#e8e0d0] text-[#2d6a4f]',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const clearTimer = useCallback((id: string) => {
    if (timers.current[id]) {
      window.clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    clearTimer(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, [clearTimer]);

  const scheduleDismiss = useCallback((id: string, duration: number) => {
    clearTimer(id);
    if (duration > 0) {
      timers.current[id] = window.setTimeout(() => dismissToast(id), duration);
    }
  }, [clearTimer, dismissToast]);

  const showToast = useCallback((toast: ToastEventDetail) => {
    const variant = toast.variant ?? 'info';
    const duration = toast.duration ?? DEFAULT_DURATIONS[variant];
    const id = makeToastId();

    setToasts((current) => [
      { id, title: toast.title, message: toast.message, variant, duration },
      ...current,
    ].slice(0, 5));
    scheduleDismiss(id, duration);

    return id;
  }, [scheduleDismiss]);

  const updateToast = useCallback((id: string, toast: ToastEventDetail) => {
    const variant = toast.variant ?? 'info';
    const duration = toast.duration ?? DEFAULT_DURATIONS[variant];

    setToasts((current) =>
      current.map((currentToast) =>
        currentToast.id === id
          ? { ...currentToast, title: toast.title, message: toast.message, variant, duration }
          : currentToast
      )
    );
    scheduleDismiss(id, duration);
  }, [scheduleDismiss]);

  useEffect(() => {
    const queuedToast = consumeQueuedToast();
    if (queuedToast) showToast(queuedToast);
  }, [showToast]);

  useEffect(() => {
    const handleToastEvent = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail;
      if (detail?.title) showToast(detail);
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);
    return () => window.removeEventListener(TOAST_EVENT, handleToastEvent);
  }, [showToast]);

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    showToast,
    updateToast,
    dismissToast,
    success: (title, message) => showToast({ title, message, variant: 'success' }),
    error: (title, message) => showToast({ title, message, variant: 'error' }),
    info: (title, message) => showToast({ title, message, variant: 'info' }),
    loading: (title, message) => showToast({ title, message, variant: 'loading' }),
  }), [dismissToast, showToast, updateToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${variantClasses[toast.variant]}`}
          >
            <div className="mt-0.5 shrink-0">{getToastIcon(toast.variant)}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#1a3a2a]">{toast.title}</p>
              {toast.message && (
                <p className="mt-1 text-sm leading-5 text-[#5a4a3a]">{toast.message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-lg p-1 text-[#a09080] transition hover:bg-[#f7f4ef] hover:text-[#5a4a3a]"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
