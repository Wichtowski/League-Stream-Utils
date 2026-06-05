"use client";

import { useMemo, useState } from "react";

import {
  useAdminUsers,
  useAdminUserSessions,
  useAdminLockUser,
  useAdminDeleteUser,
  useAdminSetUserRole,
  useAdminSetUserPlan,
  useAdminForceReset,
  useAdminImpersonate,
  useAdminResendVerification,
} from "@lsu/api-client/hooks";
import type { User } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import { Skeleton } from "@lsu/ui/skeleton";

import { useAuth } from "@/_components/auth-provider";
import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { DataTable } from "@/_components/data-table";
import { Select, Input } from "@/_components/input";

const BASE_ROLE_OPTIONS = [
  { value: "viewer", labelKey: "users_role_viewer" },
  { value: "commentator", labelKey: "users_role_commentator" },
  { value: "moderator", labelKey: "users_role_moderator" },
  { value: "organizer", labelKey: "users_role_organizer" },
  { value: "admin", labelKey: "users_role_admin" },
];

const DEVELOPER_ROLE_OPTION = { value: "developer", labelKey: "users_role_developer" };

const PLAN_OPTIONS = [
  { value: "free", labelKey: "users_plan_free" },
  { value: "pro", labelKey: "users_plan_pro" },
];

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_locked: boolean;
  email_verified?: boolean;
  plan?: string;
  plan_expires_at?: string;
  last_login_at: string | null;
  created_at: string;
}

export function UsersTab() {
  const [search, setSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { isDeveloper } = useAuth();
  const { t } = useTranslation("admin");

  const roleOptions = useMemo(() => {
    const base = isDeveloper ? [...BASE_ROLE_OPTIONS, DEVELOPER_ROLE_OPTION] : BASE_ROLE_OPTIONS;

    return base.map((o) => ({ value: o.value, label: t(o.labelKey) }));
  }, [isDeveloper, t]);

  const planOptions = useMemo(
    () => PLAN_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) })),
    [t],
  );

  const { data: users, isPending, isError } = useAdminUsers();
  const toggleLock = useAdminLockUser();
  const deleteUser = useAdminDeleteUser();
  const changeRole = useAdminSetUserRole();
  const changePlan = useAdminSetUserPlan();
  const forceReset = useAdminForceReset();
  const impersonate = useAdminImpersonate();
  const resendVerification = useAdminResendVerification();

  const filtered = (users ?? []).filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="56px" rounded="lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {t("users_failed_to_load")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder={t("users_search_placeholder")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <DataTable
        columns={[
          {
            key: "username",
            header: t("users_col_username"),
            render: (u: User) => <span className="font-medium">{u.username}</span>,
          },
          {
            key: "email",
            header: t("users_col_email"),
            render: (u: User) => (
              <span className="text-text-muted">
                {u.email}
                {u.email_verified === false && (
                  <Badge variant="warning">{t("users_status_unverified")}</Badge>
                )}
              </span>
            ),
          },
          {
            key: "role",
            header: t("users_col_role"),
            render: (u: User) => (
              <Select
                options={roleOptions}
                value={u.is_admin ? "admin" : "viewer"}
                onChange={(e) => changeRole.mutate({ userId: u.id, role: e.target.value })}
                className="!w-28 !py-1 text-xs"
              />
            ),
            className: "w-36",
          },
          {
            key: "plan",
            header: t("users_col_plan"),
            render: (u: User) => (
              <Select
                options={planOptions}
                value={u.plan ?? "free"}
                onChange={(e) => changePlan.mutate({ userId: u.id, plan: e.target.value })}
                className="!w-20 !py-1 text-xs"
              />
            ),
            className: "w-28",
          },
          {
            key: "status",
            header: t("users_col_status"),
            render: (u: User) =>
              u.is_locked ? (
                <Badge variant="error">{t("users_status_locked")}</Badge>
              ) : (
                <Badge variant="success">{t("users_status_active")}</Badge>
              ),
            className: "w-24",
          },
          {
            key: "lastLogin",
            header: t("users_col_last_login"),
            render: (u: User) => (
              <span className="text-xs text-text-muted">
                {u.last_login_at
                  ? new Date(u.last_login_at).toLocaleDateString()
                  : t("never", { ns: "common" })}
              </span>
            ),
            className: "w-28",
          },
          {
            key: "actions",
            header: "",
            render: (u: User) => (
              <div className="flex flex-wrap gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLock.mutate({ userId: u.id, lock: !u.is_locked });
                  }}
                >
                  {u.is_locked ? t("users_btn_unlock") : t("users_btn_lock")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    impersonate.mutate(u.id);
                  }}
                >
                  {t("users_btn_impersonate")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    forceReset.mutate(u.id);
                  }}
                >
                  {t("users_btn_force_reset")}
                </Button>
                {u.email_verified === false && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resendVerification.mutate(u.id);
                    }}
                  >
                    {t("users_btn_resend_email")}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("confirm_delete", { ns: "common", name: u.username }))) {
                      deleteUser.mutate(u.id);
                    }
                  }}
                >
                  {t("delete", { ns: "common" })}
                </Button>
              </div>
            ),
            className: "w-auto text-right",
          },
        ]}
        data={filtered}
        keyExtractor={(u: User) => u.id}
        onRowClick={(u) => setExpandedUser(expandedUser === u.id ? null : u.id)}
        emptyMessage={t("users_empty")}
      />

      {expandedUser && <UserSessions userId={expandedUser} />}
    </div>
  );
}

function UserSessions({ userId }: { userId: string }) {
  const { data: sessions, isPending } = useAdminUserSessions(userId);
  const { t } = useTranslation("admin");

  if (isPending) return <Skeleton height="40px" rounded="lg" />;

  if (!sessions?.length) {
    return (
      <div className="rounded-lg border border-border-subtle bg-surface-raised p-3 text-sm text-text-muted">
        {t("users_sessions_empty")}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h4 className="mb-2 text-sm font-medium">{t("users_sessions_title")}</h4>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div
            key={String(s.id)}
            className="flex items-center gap-4 rounded bg-surface px-3 py-2 text-xs"
          >
            <span className="text-text-muted">{String(s.ip ?? t("users_session_unknown_ip"))}</span>
            <span className="truncate text-text-muted max-w-48">
              {String(s.user_agent ?? t("users_session_unknown"))}
            </span>
            <span className="ml-auto text-text-muted">
              {t("users_session_last_used")} {new Date(String(s.last_used_at)).toLocaleString()}
            </span>
            {s.impersonated_by && (
              <Badge variant="warning">{t("users_session_impersonated")}</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
