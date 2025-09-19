"use client";

import React, { useState } from "react";
import { useAuth } from "@lib/contexts/AuthContext";
import { useModal } from "@lib/contexts/ModalContext";
import { Button } from "@lib/components/common";

interface LogoutButtonProps {
  className?: string;
  variant?: "primary" | "secondary" | "success" | "destructive";
  size?: "sm" | "md" | "lg";
  showConfirmation?: boolean;
}

// Error types for better error handling
enum LogoutErrorType {
  NETWORK_ERROR = "NETWORK_ERROR",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  CONFIRMATION_ERROR = "CONFIRMATION_ERROR"
}

interface LogoutError {
  type: LogoutErrorType;
  message: string;
  originalError?: Error;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  variant = "destructive",
  size = "md",
  showConfirmation = false
}) => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { showConfirm, showAlert } = useModal();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  // Helper function to classify and handle different types of errors
  const classifyError = (error: unknown): LogoutError => {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: LogoutErrorType.NETWORK_ERROR,
        message: "Unable to connect to the server. Please check your internet connection and try again.",
        originalError: error as Error
      };
    }

    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return {
          type: LogoutErrorType.SESSION_EXPIRED,
          message: "Your session has already expired. You will be redirected to the login page.",
          originalError: error
        };
      }

      if (error.message.includes('500') || error.message.includes('server')) {
        return {
          type: LogoutErrorType.SERVER_ERROR,
          message: "Server error occurred during logout. Your local session will be cleared.",
          originalError: error
        };
      }

      return {
        type: LogoutErrorType.UNKNOWN_ERROR,
        message: "An unexpected error occurred during logout. Your local session will be cleared.",
        originalError: error
      };
    }

    return {
      type: LogoutErrorType.UNKNOWN_ERROR,
      message: "An unexpected error occurred during logout. Your local session will be cleared."
    };
  };

  // Helper function to log errors securely without exposing sensitive information
  const logError = (error: LogoutError, context: string) => {
    const sanitizedError = {
      type: error.type,
      message: error.message,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      // Only log error name and basic info, not full stack traces or sensitive data
      originalErrorName: error.originalError?.name,
      originalErrorMessage: error.originalError?.message?.substring(0, 100) // Limit message length
    };

    console.error('LogoutButton Error:', sanitizedError);
  };

  // Helper function to show error messages to users
  const showErrorMessage = async (error: LogoutError) => {
    try {
      await showAlert({
        title: "Logout Error",
        message: error.message,
        type: "error",
        timeout: error.type === LogoutErrorType.SESSION_EXPIRED ? 3000 : undefined
      });
    } catch (alertError) {
      // Fallback if modal system fails
      console.error('Failed to show error alert:', alertError);
      // Could implement a toast notification or other fallback here
    }
  };

  const handleLogout = async () => {
    // Prevent multiple simultaneous logout requests
    if (isLoggingOut) return;

    // Clear any previous errors
    setError(null);

    // Show confirmation dialog if showConfirmation prop is true
    if (showConfirmation) {
      setShowConfirmDialog(true);
      try {
        const confirmed = await showConfirm({
          title: "Confirm Logout",
          message: "Are you sure you want to log out? You will need to sign in again to access your account.",
          confirmText: "Logout",
          cancelText: "Cancel",
          type: "danger"
        });

        if (!confirmed) {
          setShowConfirmDialog(false);
          return; // User cancelled, don't proceed with logout
        }
      } catch (confirmError) {
        const error: LogoutError = {
          type: LogoutErrorType.CONFIRMATION_ERROR,
          message: "Error showing confirmation dialog. Please try again.",
          originalError: confirmError as Error
        };
        
        setError(error);
        logError(error, "confirmation_dialog");
        await showErrorMessage(error);
        setShowConfirmDialog(false);
        return;
      } finally {
        setShowConfirmDialog(false);
      }
    }

    // Proceed with logout
    setIsLoggingOut(true);
    
    try {
      await logout();
      // If we reach here, logout was successful
      // The AuthContext logout method handles redirection
    } catch (logoutError) {
      // Classify and handle the error
      const error = classifyError(logoutError);
      setError(error);
      logError(error, "logout_process");

      // Show user-friendly error message
      await showErrorMessage(error);

      // For session expired errors, we don't need to do anything else
      // as the AuthContext logout method already clears local data
      if (error.type === LogoutErrorType.SESSION_EXPIRED) {
        // The logout method in AuthContext already handles cleanup and redirect
        return;
      }

      // For other errors, we still want to ensure local cleanup happens
      // The AuthContext logout method already handles this in the finally block
      // but we can add additional cleanup if needed
      try {
        // Additional local cleanup if needed
        if (typeof window !== 'undefined') {
          // Clear any additional app-specific data that might not be handled by AuthContext
          // This is a safety net in case the AuthContext cleanup fails
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('auth-') || key.startsWith('user-') || key.startsWith('session-'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => {
            try {
              localStorage.removeItem(key);
            } catch (cleanupError) {
              console.warn('Failed to remove localStorage key:', key, cleanupError);
            }
          });

          // Clear sessionStorage as well
          try {
            sessionStorage.clear();
          } catch (sessionError) {
            console.warn('Failed to clear sessionStorage:', sessionError);
          }
        }
      } catch (cleanupError) {
        console.error('Additional cleanup failed:', cleanupError);
        // Don't throw here, as we don't want to prevent the error handling flow
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-2 px-4">
        <svg
          className="animate-spin h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
          role="img"
          aria-label="Loading authentication state"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="ml-2 text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Don't render logout button if user is not authenticated
  if (!user) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">
          You are not currently logged in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleLogout}
        disabled={isLoggingOut || showConfirmDialog}
        variant={variant}
        size={size}
        className={`${className} ${(isLoggingOut || showConfirmDialog) ? 'opacity-75 cursor-not-allowed' : ''} transition-opacity duration-200`}
        aria-busy={isLoggingOut || showConfirmDialog}
        aria-describedby={(isLoggingOut || showConfirmDialog || error) ? "logout-status" : undefined}
        aria-label={
          isLoggingOut 
            ? "Logging out, please wait" 
            : showConfirmDialog 
              ? "Confirmation dialog is open" 
              : error
                ? "Logout failed, click to retry"
                : "Log out of your account"
        }
      >
        {isLoggingOut ? (
          <div className="flex items-center justify-center" id="logout-status">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 transition-transform duration-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
              role="img"
              aria-label="Loading spinner"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="transition-opacity duration-200">Logging out...</span>
          </div>
        ) : showConfirmDialog ? (
          <span className="transition-opacity duration-200" id="logout-status">Confirm logout...</span>
        ) : (
          <span className="transition-opacity duration-200">
            {error ? "Retry Logout" : "Logout"}
          </span>
        )}
      </Button>
      
      {/* Error status indicator - only visible to screen readers */}
      {error && (
        <div 
          id="logout-status" 
          className="sr-only" 
          role="status" 
          aria-live="polite"
        >
          Logout failed: {error.message}. Click the button to retry.
        </div>
      )}
    </div>
  );
};