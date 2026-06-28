"use client";

import { useState } from "react";

import { useSecurityEvents, useSessionInfo, useLoginAttempts } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";
import { DataTable } from "@/_components/data-table";
import { Select } from "@/_components/input";

interface SecurityEventRow {
  id: string;
  type: string;
  username?: string;
  ip?: string;
  created_at: string;
}

interface LoginAttemptRow {
  id: string;
  username: string;
  ip: string;
  created_at: string;
}

const eventBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info"> = {
  login_success: "success",
  login_failed: "error",
  user_registered: "info",
  password_changed: "warning",
  impersonation_started: "warning",
};

export function SecurityTab() {
  const [eventType, setEventType] = useState("");
  const { t } = useTranslation("admin");

  const eventTypeOptions = [
    { value: "", label: t("security_filter_all") },
    { value: "login_success", label: t("security_filter_login_success") },
    { value: "login_failed", label: t("security_filter_login_failed") },
    { value: "user_registered", label: t("security_filter_registered") },
    { value: "password_changed", label: t("security_filter_password_changed") },
    { value: "impersonation_started", label: t("security_filter_impersonation") },
  ];

  const { data: events, isPending: eventsLoading } = useSecurityEvents(eventType || undefined);
  const { data: sessionInfo } = useSessionInfo();
  const { data: loginAttempts } = useLoginAttempts();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t("security_stat_sessions")} value={sessionInfo?.activeSessions ?? "—"} />
        <StatCard label={t("security_stat_users")} value={sessionInfo?.totalUsers ?? "—"} />
        <StatCard
          label={t("security_stat_failed")}
          value={loginAttempts?.length ?? "—"}
          variant="error"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t("security_events_title")}</h3>
          <Select
            options={eventTypeOptions}
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="!w-44 !py-1 text-xs"
          />
        </div>

        {eventsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height="40px" rounded="lg" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={[
              {
                key: "event_type",
                header: t("security_col_event"),
                render: (e: SecurityEventRow) => (
                  <Badge variant={eventBadgeVariant[e.type] ?? "default"}>{e.type}</Badge>
                ),
                className: "w-40",
              },
              {
                key: "username",
                header: t("security_col_user"),
                render: (e: SecurityEventRow) => (
                  <span className="text-text-muted">{e.username ?? "—"}</span>
                ),
              },
              {
                key: "ip",
                header: t("security_col_ip"),
                render: (e: SecurityEventRow) => (
                  <span className="font-mono text-xs text-text-muted">{e.ip ?? "—"}</span>
                ),
                className: "w-32",
              },
              {
                key: "created_at",
                header: t("security_col_time"),
                render: (e: SecurityEventRow) => (
                  <span className="text-xs text-text-muted">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                ),
                className: "w-44",
              },
            ]}
            data={(events ?? []) as SecurityEventRow[]}
            keyExtractor={(e: SecurityEventRow) => e.id}
            emptyMessage={t("security_events_empty")}
          />
        )}
      </div>

      {loginAttempts && loginAttempts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">{t("security_failed_title")}</h3>
          <DataTable
            columns={[
              {
                key: "username",
                header: t("security_failed_col_username"),
                render: (a: LoginAttemptRow) => <span className="font-medium">{a.username}</span>,
              },
              {
                key: "ip",
                header: t("security_failed_col_ip"),
                render: (a: LoginAttemptRow) => (
                  <span className="font-mono text-xs text-text-muted">{a.ip}</span>
                ),
                className: "w-32",
              },
              {
                key: "attempted_at",
                header: t("security_failed_col_time"),
                render: (a: LoginAttemptRow) => (
                  <span className="text-xs text-text-muted">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                ),
                className: "w-44",
              },
            ]}
            data={loginAttempts as LoginAttemptRow[]}
            keyExtractor={(a: LoginAttemptRow) => a.id}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string | number;
  variant?: "error";
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${variant === "error" ? "text-red-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}
