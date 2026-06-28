"use client";

import { useEffect } from "react";

import { isElectron } from "@lsu/electron-bridge";
import { useSyncStore } from "@lsu/electron-bridge/hooks";
import { useTranslation } from "@lsu/i18n";

function formatRelativeTime(
  isoString: string,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return t("sync_time_just_now");
  if (minutes < 60) return t("sync_time_minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("sync_time_hours", { count: hours });
  const days = Math.floor(hours / 24);

  return t("sync_time_days", { count: days });
}

export function SyncStatusWidget() {
  const { status, syncing, refreshStatus, fullSync } = useSyncStore();
  const { t } = useTranslation("modules");

  useEffect(() => {
    if (!isElectron()) return;
    refreshStatus();
    const interval = setInterval(refreshStatus, 30_000);

    return () => clearInterval(interval);
  }, []);

  if (!isElectron() || !status) return null;

  return (
    <div className="mx-2 mt-1.5 rounded-lg border border-border-subtle bg-surface p-2.5">
      <div className="flex items-center gap-2 mb-1.5">
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className={`shrink-0 ${syncing ? "animate-spin text-indigo-400" : "text-text-muted"}`}
        >
          <path d="M2 8a6 6 0 0 1 10.47-4M14 8a6 6 0 0 1-10.47 4" />
          <path d="M13 2v3h-3M3 14v-3h3" />
        </svg>
        <span className="text-[11px] font-medium text-gray-300 md:hidden lg:inline">
          {t("sync_status_title")}
        </span>
      </div>

      {status.pendingChanges > 0 && (
        <p className="text-[10px] text-amber-300 mb-1 md:hidden lg:block">
          {t("sync_change", { count: status.pendingChanges })} {t("sync_pending")}
        </p>
      )}

      {status.lastSyncedAt && (
        <p className="text-[10px] text-text-muted mb-1.5 md:hidden lg:block">
          {t("sync_last")} {formatRelativeTime(status.lastSyncedAt, t)}
        </p>
      )}

      <button
        onClick={() => fullSync()}
        disabled={syncing}
        className="w-full rounded-md bg-indigo-500/15 px-2 py-1 text-[10px] font-medium text-indigo-300 hover:bg-indigo-500/25 transition-colors disabled:opacity-50 md:hidden lg:block"
      >
        {syncing ? t("sync_syncing") : t("sync_now")}
      </button>
    </div>
  );
}
