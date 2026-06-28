"use client";

import { useState, useEffect, useCallback } from "react";

import { isElectron } from "@lsu/electron-bridge";
import { useTranslation } from "@lsu/i18n";

import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { PageWrapper } from "@/_components/page-wrapper";

interface HealthData {
  status: string;
  uptime: number;
  timestamp: string;
  postgres: string;
  websockets: { totalClients: number; activeSessions: number };
}

export default function DevPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation("dev");

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/health");
      const data = await res.json();
      setHealth(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10_000);

    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <PageWrapper
      title={t("title")}
      subtitle={t("subtitle")}
      actions={
        <Button variant="secondary" size="sm" onClick={fetchHealth} disabled={loading}>
          {loading ? t("refreshing", { ns: "common" }) : t("refresh", { ns: "common" })}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <StatusCard title={t("api_health")}>
          {error ? (
            <Badge variant="error">{t("unreachable")}</Badge>
          ) : health ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t("status")}</span>
                <Badge variant={health.status === "ok" ? "success" : "warning"}>
                  {health.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t("uptime")}</span>
                <span className="text-xs font-mono">{formatUptime(health.uptime)}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-text-muted">{t("loading", { ns: "common" })}</span>
          )}
        </StatusCard>

        <StatusCard title={t("postgresql")}>
          {health ? (
            <Badge variant={health.postgres === "connected" ? "success" : "error"}>
              {health.postgres}
            </Badge>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </StatusCard>

        <StatusCard title={t("websocket_connections")}>
          {health?.websockets ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t("clients")}</span>
                <span className="text-sm font-medium">{health.websockets.totalClients}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{t("active_sessions")}</span>
                <span className="text-sm font-medium">{health.websockets.activeSessions}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-text-muted">—</span>
          )}
        </StatusCard>

        <StatusCard title={t("runtime")}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{t("environment")}</span>
              <Badge variant={isElectron() ? "success" : "info"}>
                {isElectron() ? t("electron") : t("web")}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">{t("node_env")}</span>
              <span className="text-xs font-mono">{process.env.NODE_ENV ?? t("unknown")}</span>
            </div>
          </div>
        </StatusCard>
      </div>
    </PageWrapper>
  );
}

function StatusCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${h}h ${m}m ${s}s`;
}
