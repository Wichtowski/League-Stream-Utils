"use client";

import { ReactNode } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  fullscreen?: boolean;
  centered?: boolean;
  className?: string;
  children?: ReactNode;
  variant?: "primary" | "secondary" | "white";
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12"
};

const colorClasses = {
  primary: "border-blue-400",
  secondary: "border-gray-400",
  white: "border-white"
};

export function LoadingSpinner({
  size = "lg",
  text,
  fullscreen = false,
  centered = false,
  className = "",
  children,
  variant = "primary"
}: LoadingSpinnerProps): React.ReactElement {
  const spinnerClass = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[variant]}`;

  const content = (
    <div className="flex flex-col items-center">
      <div className={spinnerClass} />
      {children || (text && <p className="text-white mt-3 text-sm">{text}</p>)}
    </div>
  );

  if (fullscreen) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${className}`}>
        <div className="text-center">{content}</div>
      </div>
    );
  }

  if (centered) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="text-center">{content}</div>
      </div>
    );
  }

  return <div className={`flex items-center justify-center ${className}`}>{content}</div>;
}

// Inline spinner for buttons and small spaces
export function InlineSpinner({
  size = "sm",
  variant = "white",
  className = ""
}: Pick<LoadingSpinnerProps, "size" | "variant" | "className">): React.ReactElement {
  const spinnerClass = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${colorClasses[variant]}`;

  return <div className={`${spinnerClass} ${className}`} />;
}

// Page-level loading component
export function PageLoader({
  text = "Loading...",
  className = ""
}: Pick<LoadingSpinnerProps, "text" | "className">): React.ReactElement {
  return <LoadingSpinner size="lg" text={text} fullscreen variant="primary" className={className} />;
}

// Modal/overlay loading component
export function OverlayLoader({
  text = "Loading...",
  className = ""
}: Pick<LoadingSpinnerProps, "text" | "className">): React.ReactElement {
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-gray-800 rounded-lg p-8">
        <LoadingSpinner size="xl" text={text} variant="white" centered />
      </div>
    </div>
  );
}
