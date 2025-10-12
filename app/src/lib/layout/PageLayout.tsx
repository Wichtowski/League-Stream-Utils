import React from "react";
import { Breadcrumbs, BreadcrumbItem, LoadingSpinner } from "@lib/components/common";
import { useRouter } from "next/navigation";
import { useErrorHandling } from "../hooks/useErrorHandling";

export interface PageLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  breadcrumbs?: (BreadcrumbItem | null)[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  loading?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  className = "",
  contentClassName = "",
  loading = false
}) => {
  const router = useRouter();
  const { error } = useErrorHandling();

  if (error) {
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white bg-black">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4 flex justify-between items-center"></div>
          <div className="space-y-6">{children}</div>
          <LoadingSpinner fullscreen text="Loading Application..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white bg-black ${className}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumbs items={breadcrumbs.filter(Boolean) as BreadcrumbItem[]} />
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-8 flex items-center justify-between">
            <div>
              {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
              {subtitle && <p className="text-gray-300">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center space-x-4">{actions}</div>}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
};
