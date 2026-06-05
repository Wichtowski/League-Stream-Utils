"use client";

import { useTeams, useTournaments } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";

export function ModuleStats() {
  const { data: teams } = useTeams();
  const { data: tournaments } = useTournaments();

  const teamCount = teams?.length ?? 0;
  const tournamentCount = tournaments?.length ?? 0;
  const activeTournaments = tournaments?.filter((t) => t.status === "active").length ?? 0;
  const { t } = useTranslation("modules");

  return (
    <div className="grid grid-cols-3 gap-3">
      <StatCard label={t("stat_teams")} value={teamCount} />
      <StatCard label={t("stat_active_tournaments")} value={activeTournaments} />
      <StatCard label={t("stat_total_tournaments")} value={tournamentCount} />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </div>
  );
}
