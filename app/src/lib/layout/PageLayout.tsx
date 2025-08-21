import React from "react";
import { Breadcrumbs, BreadcrumbItem, SettingsCog } from "@lib/components/common";
import { useElectron } from "@/libElectron/contexts/ElectronContext";

interface PageLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  loading?: boolean;
  loadingChildren?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  className = "",
  contentClassName = "",
  loading = false,
  loadingChildren
}) => {
  const { isElectron } = useElectron();

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumbs items={[]} />
          </div>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-600 rounded animate-pulse blur-sm w-64"></div>
            </div>
            {actions && <div className="flex items-center space-x-4">{actions}</div>}
            {isElectron && <SettingsCog />}
          </div>
          <div className="space-y-6">{loadingChildren || children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen text-white ${className}`}>
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <Breadcrumbs items={breadcrumbs} />
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
            {isElectron && <SettingsCog />}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
};
