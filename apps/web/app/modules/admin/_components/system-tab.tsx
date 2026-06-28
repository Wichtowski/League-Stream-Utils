"use client";

import { useSystemHealth } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;

  return `${m}m`;
}

export function SystemTab() {
  const { data, isPending, isError } = useSystemHealth();
  const { t } = useTranslation("admin");

  if (isPending) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="120px" rounded="lg" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        {t("system_failed_to_load")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium">{t("system_title")}</h3>
        <Badge variant={data.status === "healthy" ? "success" : "warning"}>{data.status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Section title={t("system_service_checks")}>
          {Object.entries(data.checks).map(([name, check]) => (
            <div key={name} className="flex items-center justify-between py-1.5">
              <span className="text-sm capitalize">{name}</span>
              <Badge variant={check.status === "ok" ? "success" : "error"}>{check.status}</Badge>
            </div>
          ))}
        </Section>

        <Section title={t("system_db_stats")}>
          <StatRow label={t("system_stat_users")} value={data.stats.users} />
          <StatRow label={t("system_stat_tournaments")} value={data.stats.tournaments} />
          <StatRow label={t("system_stat_teams")} value={data.stats.teams} />
          <StatRow label={t("system_stat_sessions")} value={data.stats.activeSessions} />
        </Section>

        <Section title={t("system_runtime")}>
          <StatRow label={t("system_node_version")} value={data.runtime.nodeVersion} />
          <StatRow label={t("system_uptime")} value={formatUptime(data.runtime.uptime)} />
        </Section>

        <Section title={t("system_memory")}>
          <StatRow label={t("system_rss")} value={formatBytes(data.runtime.memoryUsage.rss)} />
          <StatRow
            label={t("system_heap_total")}
            value={formatBytes(data.runtime.memoryUsage.heapTotal)}
          />
          <StatRow
            label={t("system_heap_used")}
            value={formatBytes(data.runtime.memoryUsage.heapUsed)}
          />
          <StatRow
            label={t("system_external")}
            value={formatBytes(data.runtime.memoryUsage.external)}
          />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-text-muted">{title}</h4>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
