'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (type: ToastType, message: string) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (type, message) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(type: ToastType, message: string) {
  useToastStore.getState().add(type, message);
}

toast.success = (message: string) => toast('success', message);
toast.error = (message: string) => toast('error', message);
toast.info = (message: string) => toast('info', message);
toast.promise = async <T,>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string },
): Promise<T> => {
  const store = useToastStore.getState();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  store.add('info', messages.loading);
  try {
    const result = await promise;
    store.remove(id);
    toast('success', messages.success);
    return result;
  } catch (err) {
    store.remove(id);
    toast('error', messages.error);
    throw err;
  }
};

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/40 bg-red-500/10 text-red-300',
  info: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300',
};

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition-all duration-200 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      } ${typeStyles[t.type]}`}
    >
      <span className="flex-1">{t.message}</span>
      <button onClick={onDismiss} className="opacity-60 hover:opacity-100 transition-opacity">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
    </div>
  );
}
