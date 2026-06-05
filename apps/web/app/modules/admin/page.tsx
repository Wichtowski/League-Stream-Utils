"use client";

import { useMemo } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { useTranslation } from "@lsu/i18n";

import { useAuth } from "@/_components/auth-provider";
import { PageWrapper } from "@/_components/page-wrapper";

import { SecurityTab } from "./_components/security-tab";
import { SystemTab } from "./_components/system-tab";
import { TournamentsTab } from "./_components/tournaments-tab";
import { UsersTab } from "./_components/users-tab";

const ALL_TABS = [
  { key: "users", labelKey: "tab_users", developerOnly: false },
  { key: "tournaments", labelKey: "tab_tournaments", developerOnly: false },
  { key: "security", labelKey: "tab_security", developerOnly: true },
  { key: "system", labelKey: "tab_system", developerOnly: false },
] as const;

type TabKey = (typeof ALL_TABS)[number]["key"];

const TAB_COMPONENTS: Record<TabKey, () => JSX.Element> = {
  users: UsersTab,
  tournaments: TournamentsTab,
  security: SecurityTab,
  system: SystemTab,
};

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDeveloper } = useAuth();
  const { t } = useTranslation("admin");

  const tabs = useMemo(
    () => ALL_TABS.filter((t) => !t.developerOnly || isDeveloper),
    [isDeveloper],
  );

  const activeTab = (searchParams.get("tab") as TabKey) || "users";
  const isAllowed = tabs.some((t) => t.key === activeTab);
  const ActiveComponent = isAllowed ? (TAB_COMPONENTS[activeTab] ?? UsersTab) : UsersTab;

  return (
    <PageWrapper title={t("title")} subtitle={t("subtitle")}>
      <nav className="flex gap-1 border-b border-border-subtle pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.replace(`/modules/admin?tab=${tab.key}`)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-500 text-white"
                : "text-text-muted hover:text-gray-300 hover:bg-surface-raised"
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </nav>

      <div className="pt-4">
        <ActiveComponent />
      </div>
    </PageWrapper>
  );
}
