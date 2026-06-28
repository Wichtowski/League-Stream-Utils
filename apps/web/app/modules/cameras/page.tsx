"use client";

import { useCameraConfigs, useDeleteCameraConfig } from "@lsu/api-client/hooks";
import { useTeams } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";
import type { Team } from "@lsu/types";
import { Skeleton } from "@lsu/ui/skeleton";

import { Badge } from "@/_components/badge";
import { Button } from "@/_components/button";
import { EmptyState } from "@/_components/empty-state";
import { PageWrapper } from "@/_components/page-wrapper";

const ROLES = ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"] as const;

export default function CamerasPage() {
  const { data: configs, isPending } = useCameraConfigs();
  const { data: teams } = useTeams();
  const deleteConfig = useDeleteCameraConfig();

  const teamMap = new Map(((teams as Team[]) ?? []).map((t: Team) => [t.id, t]));
  const { t } = useTranslation("cameras");

  return (
    <PageWrapper title={t("title")} subtitle={t("subtitle")}>
      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height="120px" rounded="lg" />
          ))}
        </div>
      ) : !configs || configs.length === 0 ? (
        <EmptyState message={t("empty_state")} />
      ) : (
        <div className="space-y-3">
          {configs.map((config) => {
            const team = teamMap.get(config.teamId);

            return (
              <div
                key={config.id ?? config.teamId}
                className="rounded-lg border border-border-subtle bg-surface-raised p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{team?.name ?? config.teamId}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t("confirm_delete"))) deleteConfig.mutate(config.teamId);
                    }}
                  >
                    {t("delete", { ns: "common" })}
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ROLES.map((role) => {
                    const player = config.players?.find(
                      (p: Record<string, unknown>) => p.role === role,
                    );

                    return (
                      <div key={role} className="rounded-md bg-surface p-2 text-center">
                        <span className="block text-xs text-text-muted">{role}</span>
                        {player ? (
                          <>
                            <span className="block text-xs font-medium truncate mt-1">
                              {player.playerName ?? "—"}
                            </span>
                            <Badge variant="success">{t("active")}</Badge>
                          </>
                        ) : (
                          <span className="block text-xs text-text-muted/50 mt-1">
                            {t("not_set")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
}
