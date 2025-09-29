import React from "react";
import { useTheme } from "@lib/hooks/useTheme";
import Link from "next/link";

export type ButtonVariant = "primary" | "secondary" | "success" | "destructive" | "custom";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  href?: string;
  target?: string;
  hoverStyle?: string;
}

export const Button = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  href = "",
  target = "_self",
  hoverStyle = "",
  ...props
}: ButtonProps): React.ReactElement => {
  const theme = useTheme();
  const buttonColors = theme.getButtonColors(variant);
  const providedBg = (props.style && (props.style as React.CSSProperties).backgroundColor
    ? (props.style as React.CSSProperties).backgroundColor
    : undefined) as string | undefined;

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  const baseClasses = "rounded-lg font-medium transition-all duration-200 hover:scale-105 active:scale-95";

  return href && href !== "" ? (
    <Link href={href} target={target}>
      <button
        className={`${baseClasses} ${sizeClasses[size]} ${className}`}
        style={{
          backgroundColor: providedBg ?? buttonColors.bg,
          color: buttonColors.text,
          ...(props.style || {})
        }}
        onMouseEnter={(e) => {
          if (variant === "custom") {
            if (hoverStyle && hoverStyle !== "") {
              e.currentTarget.style.backgroundColor = hoverStyle;
            }
          } else {
            e.currentTarget.style.backgroundColor = buttonColors.hover;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = providedBg ?? buttonColors.bg;
        }}
        {...props}
      >
        {children}
      </button>
    </Link>
  ) : (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: providedBg ?? buttonColors.bg,
        color: buttonColors.text,
        ...(props.style || {})
      }}
      onMouseEnter={(e) => {
        if (variant === "custom") {
          if (hoverStyle && hoverStyle !== "") {
            e.currentTarget.style.backgroundColor = hoverStyle;
          }
        } else {
          e.currentTarget.style.backgroundColor = buttonColors.hover;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = providedBg ?? buttonColors.bg;
      }}
      {...props}
    >
      {children}
    </button>
  );
};
