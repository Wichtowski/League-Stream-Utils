"use client";

import { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { AuthGuard } from "@lib/components/auth/AuthGuard";
import { Breadcrumbs, LoadingSpinner } from "@lib/components/common";

// Dynamic imports for lazy loading
const TournamentCreationForm = dynamic(
  () =>
    import("@lib/components/pages/tournaments/TournamentCreationForm").then((mod) => ({
      default: mod.TournamentCreationForm,
    })),
  {
    loading: () => <LoadingSpinner text="Loading tournament form..." />,
    ssr: false,
  },
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
    <AuthGuard loadingMessage="Loading tournament form...">
      <div className="min-h-screen text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <Breadcrumbs 
              items={[
                { label: "Tournaments", href: "/modules/tournaments" },
                { label: "Create Tournament", isActive: true }
              ]} 
            />
          </div>
          <div className="flex justify-center items-center mb-8">
            <h1 className="text-3xl font-bold">Tournament Creation</h1>
          </div>
          <Suspense
            fallback={<LoadingSpinner text="Loading tournament form..." />}
          >
            <TournamentCreationForm
              onTournamentCreated={handleTournamentCreated}
              onCancel={handleCancel}
            />
          </Suspense>
        </div>
      </div>
    </AuthGuard>
  );
}
