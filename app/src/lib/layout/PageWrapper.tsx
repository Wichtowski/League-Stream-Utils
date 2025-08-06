import React from "react";
import { AuthGuard } from "../components/auth/AuthGuard";
import { PageLayout } from "./PageLayout";
import { BreadcrumbItem } from "../components/common/Breadcrumbs";

interface PageWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  requireAuth?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  children,
  loadingMessage,
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
  contentClassName,
  requireAuth = true,
}) => {
  const content = (
    <PageLayout
      breadcrumbs={breadcrumbs}
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </PageLayout>
  );

  if (!requireAuth) {
    return content;
  }

  return (
    <AuthGuard loadingMessage={loadingMessage}>
      {content}
    </AuthGuard>
  );
}; 