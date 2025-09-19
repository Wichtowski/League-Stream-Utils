import React from "react";
import { PageLayout } from "./PageLayout";
import { BreadcrumbItem } from "@lib/components/common";
import { AuthGuard } from "@lib/auth/components/AuthGuard";
import { PageLayoutProps } from "./PageLayout";

export const PageWrapper: React.FC<PageLayoutProps> = ({
  children,
  breadcrumbs,
  title,
  subtitle,
  actions,
  className,
  contentClassName,
  requireAuth = true,
  loading = false,
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
    >
      {children}
    </PageLayout>
  );

  if (!requireAuth) {
    return content;
  }

  return <AuthGuard>{content}</AuthGuard>;
};
