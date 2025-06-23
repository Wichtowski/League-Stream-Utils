'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from './Modal';
import type { AlertModalProps } from '@lib/types';

export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    timeout
}: AlertModalProps) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);

    // Handle auto-disappear functionality with countdown
    useEffect(() => {
        if (isOpen && timeout && timeout > 0) {
            setRemainingTime(timeout);
            
            // Set the main timeout for closing the modal
            timeoutRef.current = setTimeout(() => {
                onClose();
            }, timeout);

            // Update the countdown every 100ms for smooth progress bar
            const startTime = Date.now();
            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, timeout - elapsed);
                setRemainingTime(remaining);
                
                if (remaining <= 0) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            }, 100);
        } else {
            setRemainingTime(0);
        }

        // Cleanup timeouts on unmount or when modal closes
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isOpen, timeout, onClose]);
    const getIcon = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                );
            case 'error':
                return (
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getButtonColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'warning':
                return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'error':
                return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            default:
                return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    // Calculate progress percentage for countdown
    const progressPercentage = timeout && timeout > 0 ? (remainingTime / timeout) * 100 : 0;
    const secondsRemaining = Math.ceil(remainingTime / 1000);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} showCloseButton={false}>
            <div className="text-center">
                {getIcon()}
                <p className="text-gray-300 mb-6 text-base leading-relaxed">
                    {message}
                </p>
                
                {/* Auto-dismiss countdown indicator */}
                {timeout && timeout > 0 && remainingTime > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                            <span>Auto-closing in:</span>
                            <span className="font-mono">{secondsRemaining}s</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                            <div 
                                className={`h-2 rounded-full transition-all duration-100 ease-linear ${
                                    type === 'success' ? 'bg-green-500' :
                                    type === 'warning' ? 'bg-amber-500' :
                                    type === 'error' ? 'bg-red-500' :
                                    'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className={`w-full px-4 py-2 rounded-lg text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${getButtonColor()}`}
                >
                    OK
                </button>
            </div>
        </Modal>
    );
} 