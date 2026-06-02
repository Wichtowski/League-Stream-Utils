'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from './button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-xl border border-border-subtle bg-surface-raised p-0 text-gray-100 backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-text-muted hover:bg-surface-overlay hover:text-gray-200 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-6 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
