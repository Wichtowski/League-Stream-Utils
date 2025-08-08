export type ModalVariant = 'info' | 'success' | 'warning' | 'error';
export type ConfirmVariant = 'default' | 'danger';

export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    showCloseButton?: boolean;
}

export interface AlertOptions {
    title?: string;
    message: string;
    type?: ModalVariant;
    timeout?: number; // Auto-disappear after X milliseconds
}

export interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmVariant;
}

export interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message: string;
    type?: ModalVariant;
    timeout?: number; // Auto-disappear after X milliseconds
}

export interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: ConfirmVariant;
}

export interface ModalContextType {
    showAlert: (options: AlertOptions) => Promise<void>;
    showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}
