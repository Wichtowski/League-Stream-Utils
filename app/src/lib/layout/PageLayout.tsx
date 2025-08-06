import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "../components/common/Breadcrumbs";

interface PageLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  className = "",
  contentClassName = "",
}) => {
  return (
    <div className={`min-h-screen text-white ${className}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumbs items={breadcrumbs} />
            {actions && <div className="flex items-center space-x-4">{actions}</div>}
          </div>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold mb-2">{title}</h1>}
            {subtitle && <p className="text-gray-300">{subtitle}</p>}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}; 