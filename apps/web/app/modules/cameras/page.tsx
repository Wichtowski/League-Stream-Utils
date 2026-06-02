'use client';

import { PageWrapper } from '@/_components/page-wrapper';
import { Button } from '@/_components/button';
import { Badge } from '@/_components/badge';
import { EmptyState } from '@/_components/empty-state';
import { useCameraConfigs, useDeleteCameraConfig } from '@lsu/camera/hooks';
import { useTeams } from '@lsu/team/hooks';
import { Skeleton } from '@lsu/ui/skeleton';

const ROLES = ['TOP', 'JUNGLE', 'MID', 'BOTTOM', 'SUPPORT'] as const;

export default function CamerasPage() {
  const { data: configs, isPending } = useCameraConfigs();
  const { data: teams } = useTeams();
  const deleteConfig = useDeleteCameraConfig();

  const teamMap = new Map(((teams as any[]) ?? []).map((t: any) => [t.id, t]));

  return (
    <PageWrapper title="Cameras" subtitle="Configure player stream URLs">
      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} height="120px" rounded="lg" />
          ))}
        </div>
      ) : !configs || configs.length === 0 ? (
        <EmptyState message="No camera configs yet — configure stream URLs from a team's detail page" />
      ) : (
        <div className="space-y-3">
          {(configs as any[]).map((config: any) => {
            const team = teamMap.get(config.teamId);
            return (
              <div
                key={config._id ?? config.teamId}
                className="rounded-lg border border-border-subtle bg-surface-raised p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">{team?.name ?? config.teamId}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this camera config?')) deleteConfig.mutate(config.teamId);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ROLES.map((role) => {
                    const player = config.players?.find((p: any) => p.role === role);
                    return (
                      <div key={role} className="rounded-md bg-surface p-2 text-center">
                        <span className="block text-xs text-text-muted">{role}</span>
                        {player ? (
                          <>
                            <span className="block text-xs font-medium truncate mt-1">
                              {player.playerName ?? '—'}
                            </span>
                            <Badge variant="success">Active</Badge>
                          </>
                        ) : (
                          <span className="block text-xs text-text-muted/50 mt-1">Not set</span>
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
