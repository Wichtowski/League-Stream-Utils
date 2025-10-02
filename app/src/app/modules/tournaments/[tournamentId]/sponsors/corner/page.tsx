"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useCurrentTournament } from "@libTournament/contexts/CurrentTournamentContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { Sponsorship, SponsorFormData } from "@libTournament/types";
import {
  OBSDisplayInfo,
  SponsorWindow,
  SponsorForm,
  SponsorGuidebook,
  SponsorList
} from "@libTournament/components/sponsors";
import { PageWrapper } from "@lib/layout";
import { useParams } from "next/navigation";
import { createDefaultSponsorForm } from "@libTournament/utils/sponsors/defaultValues";

export default function TournamentSponsorsPage(): React.ReactElement {
  const { currentTournament, refreshCurrentTournament, loading: tournamentLoading, error: tournamentError } = useCurrentTournament();
  
  const { setActiveModule } = useNavigation();
  const { showAlert, showConfirm } = useModal();
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  // Sponsor management state
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [sponsorsLoading, setSponsorsLoading] = useState(true);
  const [formData, setFormData] = useState<SponsorFormData>(createDefaultSponsorForm());
  const [editingSponsor, setEditingSponsor] = useState<Sponsorship | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Preview cycling state (index displayed by window)
  const [currentSponsorIndex, setCurrentSponsorIndex] = useState(0);

  const pageProps = useMemo(() => {
    return {
      title: !currentTournament ? (tournamentLoading ? "Sponsors" : "Tournament Not Found") : "Sponsors",
      subtitle: `Manage sponsors ${currentTournament?.abbreviation ? "for " + currentTournament?.abbreviation : ""}`,
      breadcrumbs: [
        { label: "Tournaments", href: "/modules/tournaments" }, 
        currentTournament?.name ?  { label: currentTournament.name , href: `/modules/tournaments/${tournamentId}` } : null,
        { label: "Sponsors", href: `/modules/tournaments/${tournamentId}/sponsors`, isActive: true }],
    }
  }, [currentTournament, tournamentId, tournamentLoading]);

  useEffect(() => {
    setActiveModule("tournaments");
  }, [setActiveModule]);

  useEffect(() => {
    if (tournamentError) {
      showAlert({ type: "error", message: tournamentError });
    }
  }, [tournamentError, showAlert]);

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

  // Cycling effect for sponsor preview with per-sponsor duration
  useEffect(() => {
    if (sponsors.length === 0) return;

    const fadeOutDuration = 1000;
    const fadeInDuration = 1000;

    let timeoutId: NodeJS.Timeout | null = null;

    const runCycle = (index: number): void => {
      const current = sponsors[index];
      const displaySeconds = Math.max(1, current.timeInSeconds ?? 3);
      const displayDuration = displaySeconds * 1000;
      const _totalCycle = fadeOutDuration + displayDuration + fadeInDuration;

      // ensure visible for displayDuration, then fade out, switch, fade in
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setTimeout(() => {
          setCurrentSponsorIndex((prev) => {
            const next = (prev + 1) % sponsors.length;
            // schedule next
            setTimeout(() => runCycle(next), 50);
            return next;
          });
        }, fadeOutDuration);
      }, displayDuration);
    };

    runCycle(currentSponsorIndex);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sponsors, currentSponsorIndex]);

  const handleAddSponsor = async (): Promise<void> => {
    if (!formData.logo) {
      await showAlert({
        type: "error",
        message: "Logo is required"
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
    } catch (error) {
      await showAlert({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to add sponsor"
      });
    }
  };

  const handleUpdateSponsor = async (): Promise<void> => {
    if (!editingSponsor) {
      await showAlert({
        type: "error",
        message: "No sponsor selected"
      });
      return;
    }

    try {
      console.log("Updating sponsor with data:", formData);
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors/${editingSponsor._id}`, {
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
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors/${sponsor._id}`, {
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
      refreshCurrentTournament();
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
      tier: sponsor.tier,
      timeInSeconds: sponsor.timeInSeconds ?? 3,
      variant: sponsor.variant ?? "corner",
      fullwidth: sponsor.fullwidth ?? false
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

  if (tournamentLoading) {
    return (
      <PageWrapper {...pageProps}>
        <LoadingSpinner fullscreen text="Loading tournament..." />
      </PageWrapper>
    );
  }

  if (!currentTournament || currentTournament._id !== tournamentId) {
    return (
      <PageWrapper
        {...pageProps}
      >
        <div className="text-center">
          <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper {...pageProps}>
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
                  <div className={`relative`}>
                    <SponsorWindow
                      sponsors={sponsors}
                      fixed={false}
                      variant="corner"
                      onIndexChange={(i) => setCurrentSponsorIndex(i)}
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
            <OBSDisplayInfo tournamentId={tournamentId} variant="corner"/>
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
