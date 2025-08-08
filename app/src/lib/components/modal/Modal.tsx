'use client';

import { useEffect, useState } from 'react';
import type { BaseModalProps } from '@lib/types';

export function Modal({ isOpen, onClose, title, children, showCloseButton = true }: BaseModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    // Handle modal visibility and animations
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            // Small delay to trigger entrance animation
            setTimeout(() => setIsVisible(true), 10);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            // Wait for exit animation to complete before unmounting
            setTimeout(() => setShouldRender(false), 200);
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
                    isVisible ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`relative bg-gray-800 rounded-xl border border-gray-600 shadow-2xl max-w-md w-full mx-4 transition-all duration-200 ease-out ${
                    isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
                }`}
            >
                {/* Header */}
                {(title || showCloseButton) && (
                    <div className="flex items-center justify-between p-6 pb-4">
                        {title && <h2 className="text-xl font-semibold text-white">{title}</h2>}
                        {showCloseButton && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors p-1"
                                aria-label="Close modal"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={`px-6 ${title || showCloseButton ? 'pb-6' : 'py-6'}`}>{children}</div>
            </div>
        </div>
    );
}
