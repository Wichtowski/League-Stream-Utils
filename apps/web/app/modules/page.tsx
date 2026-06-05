"use client";

import Link from "next/link";

import { useTeams, useTournaments } from "@lsu/api-client/hooks";
import { useTranslation } from "@lsu/i18n";

import { PageWrapper } from "@/_components/page-wrapper";

import { ModuleStats } from "./_components/module-stats";
import { WelcomeScreen } from "./_components/welcome-screen";

const modules = [
  { nameKey: "draft_name", href: "/modules/draft", descKey: "draft_desc" },
  { nameKey: "tournaments_name", href: "/modules/tournaments", descKey: "tournaments_desc" },
  { nameKey: "teams_name", href: "/modules/teams", descKey: "teams_desc" },
  { nameKey: "cameras_name", href: "/modules/cameras", descKey: "cameras_desc" },
  { nameKey: "commentators_name", href: "/modules/commentators", descKey: "commentators_desc" },
  { nameKey: "admin_name", href: "/modules/admin", descKey: "admin_desc" },
] as const;

export default function ModulesPage() {
  const { data: teams, isPending: teamsPending } = useTeams();
  const { data: tournaments, isPending: tournamentsPending } = useTournaments();
  const { t } = useTranslation("modules");

  const hasData =
    ((teams as unknown[]) ?? []).length > 0 || ((tournaments as unknown[]) ?? []).length > 0;
  const loading = teamsPending || tournamentsPending;

  if (!loading && !hasData) {
    return (
      <PageWrapper title={t("title")} subtitle={t("subtitle")}>
        <WelcomeScreen />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={t("title")} subtitle={t("subtitle")}>
      {hasData && <ModuleStats />}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            prefetch
            className="group rounded-lg border border-border-subtle bg-surface-raised p-5 transition-all duration-150 hover:border-indigo-500/40 hover:bg-surface-overlay"
          >
            <h2 className="text-sm font-semibold group-hover:text-indigo-400 transition-colors">
              {t(m.nameKey)}
            </h2>
            <p className="mt-1 text-xs text-text-muted">{t(m.descKey)}</p>
          </Link>
        ))}
      </div>
    </PageWrapper>
  );
}
