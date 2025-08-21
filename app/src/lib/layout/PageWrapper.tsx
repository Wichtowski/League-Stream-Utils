import React from "react";
import { PageLayout } from "./PageLayout";
import { BreadcrumbItem } from "@lib/components/common";
import { AuthGuard } from "@/lib/auth/components/AuthGuard";

interface PageWrapperProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode | null | undefined;
  className?: string;
  contentClassName?: string;
  requireAuth?: boolean;
  loading?: boolean;
  loadingChildren?: React.ReactNode;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
  contentClassName,
  requireAuth = true,
  loading = false,
  loadingChildren
}) => {
  const content = (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      contentClassName={contentClassName}
      loading={loading}
      loadingChildren={loadingChildren}
    >
      {children}
    </PageLayout>
  );

  if (!requireAuth) {
    return content;
  }

  return <AuthGuard>{content}</AuthGuard>;
};
