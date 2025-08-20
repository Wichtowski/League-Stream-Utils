"use client";

import { useEffect, useState, useCallback } from "react";
import { useTournaments } from "@/libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { Tournament, Sponsorship } from "@lib/types/tournament";
import { ImageStorage } from "@lib/types/common";
import {
  OBSDisplayInfo,
  SponsorWindow,
  SponsorForm,
  SponsorGuidebook,
  SponsorList
} from "@libTournament/components/sponsors";
import { PageWrapper } from "@lib/layout";

interface TournamentSponsorsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

interface SponsorFormData {
  name: string;
  logo: ImageStorage | null;
  website: string;
  tier: "title" | "presenting" | "official" | "partner";
  displayPriority: number;
  showName: boolean;
  namePosition: "left" | "right";
  fillContainer: boolean;
}

const createDefaultSponsorForm = (): SponsorFormData => ({
  name: "",
  logo: null,
  website: "",
  tier: "partner",
  displayPriority: 0,
  showName: true,
  namePosition: "right",
  fillContainer: false
});

export default function TournamentSponsorsPage({ params }: TournamentSponsorsPageProps) {
  const { tournaments, loading: tournamentsLoading, error, refreshTournaments } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert, showConfirm } = useModal();
  const [tournament, setTournament] = useState<Tournament>();
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState<string>("");

  // Sponsor management state
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [formData, setFormData] = useState<SponsorFormData>(createDefaultSponsorForm());
  const [editingSponsor, setEditingSponsor] = useState<Sponsorship | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Preview cycling state
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTournamentId(resolvedParams.tournamentId);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!tournamentsLoading && tournaments.length > 0 && tournamentId) {
      const foundTournament = tournaments.find((t) => t.id === tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      }
      setLoading(false);
    }
  }, [tournaments, tournamentsLoading, tournamentId]);

  useEffect(() => {
    if (error) {
      showAlert({ type: "error", message: error });
    }
  }, [error, showAlert]);

  const fetchSponsors = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors`);
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      const data = await response.json();
      setSponsors(data.sponsors || []);
      setSponsorsLoading(false);
    } catch (_error) {
      await showAlert({
        type: "error",
        message: "Failed to load sponsors"
      });
      setSponsorsLoading(false);
    }
  }, [tournamentId, showAlert]);

  useEffect(() => {
    if (tournamentId) {
      fetchSponsors();
    }
  }, [fetchSponsors, tournamentId]);

  // Cycling effect for sponsor preview
  useEffect(() => {
    if (sponsors.length === 0) return;

    const fadeOutDuration = 1000; // 1 second fade out
    const displayDuration = 3000; // 3 seconds display
    const fadeInDuration = 1000; // 1 second fade in
    const totalCycleDuration = fadeOutDuration + displayDuration + fadeInDuration;

    const cycleSponsors = (): void => {
      // Fade out
      setIsVisible(false);

      setTimeout(() => {
        // Change sponsor
        setCurrentSponsorIndex((prev) => (prev + 1) % sponsors.length);

        // Fade in
        setTimeout(() => {
          setIsVisible(true);
        }, 50); // Small delay to ensure DOM update
      }, fadeOutDuration);
    };

    const interval = setInterval(cycleSponsors, totalCycleDuration);

    return () => clearInterval(interval);
  }, [sponsors]);

  const handleAddSponsor = async (): Promise<void> => {
    if (!formData.name || !formData.logo) {
      await showAlert({
        type: "error",
        message: "Name and logo are required"
      });
      return;
    }

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add sponsor");
      }

      await showAlert({
        type: "success",
        message: "Sponsor added successfully"
      });

      setFormData(createDefaultSponsorForm());
      setShowAddForm(false);
      await fetchSponsors();
      refreshTournaments();
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add sponsor"
      });
    }
  };

  const handleUpdateSponsor = async (): Promise<void> => {
    if (!editingSponsor || !formData.name || !formData.logo) {
      await showAlert({
        type: "error",
        message: "Name and logo are required"
      });
      return;
    }

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors/${editingSponsor.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sponsor");
      }

      await showAlert({
        type: "success",
        message: "Sponsor updated successfully"
      });

      setFormData(createDefaultSponsorForm());
      setEditingSponsor(null);
      await fetchSponsors();
      refreshTournaments();
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update sponsor"
      });
    }
  };

  const handleDeleteSponsor = async (sponsor: Sponsorship): Promise<void> => {
    const confirmed = await showConfirm({
      title: "Delete Sponsor",
      message: `Are you sure you want to delete "${sponsor.name}"?`,
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors/${sponsor.id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sponsor");
      }

      await showAlert({
        type: "success",
        message: "Sponsor deleted successfully"
      });

      await fetchSponsors();
      refreshTournaments();
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete sponsor"
      });
    }
  };

  const handleEditSponsor = (sponsor: Sponsorship): void => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name,
      logo: sponsor.logo,
      website: sponsor.website || "",
      tier: sponsor.tier,
      displayPriority: sponsor.displayPriority,
      showName: sponsor.showName ?? true,
      namePosition: sponsor.namePosition ?? "right",
      fillContainer: sponsor.fillContainer ?? false
    });
  };

  const handleCancelEdit = (): void => {
    setEditingSponsor(null);
    setFormData(createDefaultSponsorForm());
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64Data = result.split(",")[1];

      setFormData((prev) => ({
        ...prev,
        logo: {
          type: "upload",
          data: base64Data,
          size: file.size,
          format: file.type.includes("png")
            ? "png"
            : file.type.includes("jpg") || file.type.includes("jpeg")
              ? "jpg"
              : "webp"
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUrlChange = (url: string): void => {
    setFormData((prev) => ({
      ...prev,
      logo: url
        ? {
            type: "url",
            url,
            format: "png"
          }
        : null
    }));
  };

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  if (!tournament) {
    return (
      <PageWrapper
        title="Tournament Not Found"
        breadcrumbs={[
          { label: "Tournaments", href: `/modules/tournaments` },
          { label: "Sponsors", href: `/modules/tournaments/${tournamentId}/sponsors`, isActive: true }
        ]}
      >
        <div className="text-center">
          <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        { label: "Tournaments", href: `/modules/tournaments` },
        { label: tournament.name, href: `/modules/tournaments/${tournamentId}` },
        { label: "Sponsors", href: `/modules/tournaments/${tournamentId}/sponsors`, isActive: true }
      ]}
      title="Add Tournament Sponsors"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
    >
      <div className="space-y-6">
        <div className="flex gap-6">
          <div className="flex-1 bg-gray-800 rounded-lg p-6 h-[360px] flex flex-col">
            <div className="flex-1 flex flex-col justify-center items-center">
              <h2 className="text-2xl font-semibold text-center mb-3">Sponsor Cycling Preview</h2>
              {sponsors.length > 0 ? (
                <div className="text-center">
                  <h4 className="text-sm font-medium mb-1">All Sponsors Preview (Cycling):</h4>
                  <div className="mt-2 mb-3">
                    <p className="text-xs text-gray-400">
                      Currently showing: {sponsors[currentSponsorIndex]?.name} ({currentSponsorIndex + 1} of{" "}
                      {sponsors.length})
                    </p>
                  </div>
                  <div className="relative">
                    <SponsorWindow
                      currentSponsor={sponsors[currentSponsorIndex] || sponsors[0]}
                      isVisible={isVisible}
                      fixed={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p>No sponsors added yet</p>
                  <p className="text-sm">Add sponsors to see the cycling preview</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <SponsorGuidebook expanded={false} />
            <OBSDisplayInfo tournamentId={tournamentId} />
          </div>
        </div>

        {/* Add Sponsor Button */}
        {!showAddForm && !editingSponsor && (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add New Sponsor</h3>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                Add New Sponsor
              </button>
            </div>
          </div>
        )}

        {/* Add Sponsor Form */}
        {(showAddForm || editingSponsor) && (
          <SponsorForm
            formData={formData}
            setFormData={setFormData}
            editingSponsor={editingSponsor}
            onAddSponsor={handleAddSponsor}
            onUpdateSponsor={handleUpdateSponsor}
            onCancelEdit={handleCancelEdit}
            onCloseForm={() => {
              setShowAddForm(false);
              setEditingSponsor(null);
              setFormData(createDefaultSponsorForm());
            }}
            handleLogoUpload={handleLogoUpload}
            handleLogoUrlChange={handleLogoUrlChange}
          />
        )}

        <SponsorList
          sponsors={sponsors}
          loading={sponsorsLoading}
          onEditSponsor={handleEditSponsor}
          onDeleteSponsor={handleDeleteSponsor}
        />
      </div>
    </PageWrapper>
  );
}
