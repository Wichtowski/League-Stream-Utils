'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import AlertModal from '@components/common/AlertModal';
import ConfirmModal from '@components/common/ConfirmModal';
import type { AlertOptions, ConfirmOptions, ModalContextType } from '@lib/types';

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        options: AlertOptions;
        resolve?: () => void;
    }>({
        isOpen: false,
        options: { message: '' }
    });

    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        options: ConfirmOptions;
        resolve?: (value: boolean) => void;
    }>({
        isOpen: false,
        options: { message: '' }
    });

    const showAlert = (options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            setAlertState({
                isOpen: true,
                options,
                resolve
            });
        });
    };

    const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                isOpen: true,
                options,
                resolve
            });
        });
    };

    const handleAlertClose = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
        if (alertState.resolve) {
            alertState.resolve();
        }
    };

    const handleConfirmClose = () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        if (confirmState.resolve) {
            confirmState.resolve(false);
        }
    };

    const handleConfirmConfirm = () => {
        if (confirmState.resolve) {
            confirmState.resolve(true);
        }
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={handleAlertClose}
                title={alertState.options.title}
                message={alertState.options.message}
                type={alertState.options.type}
                timeout={alertState.options.timeout}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={handleConfirmClose}
                onConfirm={handleConfirmConfirm}
                title={confirmState.options.title}
                message={confirmState.options.message}
                confirmText={confirmState.options.confirmText}
                cancelText={confirmState.options.cancelText}
                type={confirmState.options.type}
            />
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
} 