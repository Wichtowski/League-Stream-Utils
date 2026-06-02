"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout/PageWrapper";

// Dynamic imports for lazy loading
const TournamentCreationForm = dynamic(
  () =>
    import("@libTournament/components/tournament/TournamentCreationForm").then((mod) => ({
      default: mod.TournamentCreationForm
    })),
  {
    loading: () => <LoadingSpinner text="Loading tournament form..." />,
    ssr: false
  }
);

export default function CreateTournamentPage() {
  const router = useRouter();
  const { setActiveModule } = useNavigation();

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  const handleTournamentCreated = (): void => {
    router.push("/modules/tournaments");
  };

  const handleCancel = (): void => {
    router.push("/modules/tournaments");
  };

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Tournaments", href: "/modules/tournaments" },
        { label: "Create Tournament", isActive: true }
      ]}
      title="Tournament Creation"
    >
      <Suspense fallback={<LoadingSpinner text="Loading tournament form..." />}>
        <TournamentCreationForm onTournamentCreated={handleTournamentCreated} onCancel={handleCancel} />
      </Suspense>
    </PageWrapper>
  );
}
