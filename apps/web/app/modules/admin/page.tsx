'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PageWrapper } from '@/_components/page-wrapper';
import { useAuth } from '@/_components/auth-provider';
import { UsersTab } from './_components/users-tab';
import { TournamentsTab } from './_components/tournaments-tab';
import { SecurityTab } from './_components/security-tab';
import { SystemTab } from './_components/system-tab';

const ALL_TABS = [
  { key: 'users', label: 'Users', developerOnly: false },
  { key: 'tournaments', label: 'Tournaments', developerOnly: false },
  { key: 'security', label: 'Security', developerOnly: true },
  { key: 'system', label: 'System', developerOnly: false },
] as const;

type TabKey = (typeof ALL_TABS)[number]['key'];

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

  const tabs = useMemo(
    () => ALL_TABS.filter((t) => !t.developerOnly || isDeveloper),
    [isDeveloper],
  );

  const activeTab = (searchParams.get('tab') as TabKey) || 'users';
  const isAllowed = tabs.some((t) => t.key === activeTab);
  const ActiveComponent = isAllowed ? (TAB_COMPONENTS[activeTab] ?? UsersTab) : UsersTab;

  return (
    <PageWrapper title="Admin" subtitle="Users, permissions & system">
      <nav className="flex gap-1 border-b border-border-subtle pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => router.replace(`/modules/admin?tab=${tab.key}`)}
            className={`px-4 py-2 text-sm font-medium transition-colors rounded-t-lg ${
              activeTab === tab.key
                ? 'border-b-2 border-indigo-500 text-white'
                : 'text-text-muted hover:text-gray-300 hover:bg-surface-raised'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="pt-4">
        <ActiveComponent />
      </div>
    </PageWrapper>
  );
}
