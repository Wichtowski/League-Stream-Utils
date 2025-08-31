"use client";

import { useState } from "react";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import type { Sponsorship, Tournament } from "@lib/types";
import type { SponsorFormData } from "@lib/types/forms";
import Image from "next/image";

interface SponsorManagerProps {
  tournamentId: string;
  tournament: Tournament;
  onSponsorsUpdated: () => void;
}

const createDefaultSponsorForm = (): SponsorFormData => ({
  name: "",
  logo: null,
  website: "",
  tier: "bronze",
  startDate: new Date(),
  endDate: new Date(),
  isActive: true
});

export const SponsorManager = ({ tournamentId, tournament: _tournament, onSponsorsUpdated }: SponsorManagerProps) => {
  const [sponsors, setSponsors] = useState<Sponsorship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsorship | null>(null);
  const [formData, setFormData] = useState<SponsorFormData>(createDefaultSponsorForm());
  const { showAlert, showConfirm } = useModal();

  const fetchSponsors = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/v1/tournaments/${tournamentId}/sponsors`);
      if (!response.ok) {
        throw new Error("Failed to fetch sponsors");
      }
      const data = await response.json();
      setSponsors(data.sponsors || []);
      setLoading(false);
    } catch (_error) {
      await showAlert({
        type: "error",
        message: "Failed to load sponsors"
      });
      setLoading(false);
    }
  };

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
      onSponsorsUpdated();
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
      onSponsorsUpdated();
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
      onSponsorsUpdated();
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
      startDate: sponsor.startDate,
      endDate: sponsor.endDate,
      isActive: sponsor.isActive
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

  if (loading) {
    return <LoadingSpinner text="Loading sponsors..." />;
  }

  const sortedSponsors = [...sponsors].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  return (
    <div className="space-y-6">
      {/* OBS Display Info */}
      <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">OBS Display</h3>
        <p className="text-sm text-gray-300 mb-2">Add this URL to OBS as a Browser Source to display your sponsors:</p>
        <div className="bg-gray-800 rounded p-2 font-mono text-sm break-all">
          {`${window.location.origin}/sponsors-display/${tournamentId}`}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          The display will show sponsors in a carousel with fade in/out effects in the bottom-left corner.
        </p>
      </div>

      {/* Add Sponsor Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Sponsors ({sponsors.length})</h2>
        {!showAddForm && !editingSponsor && (
          <button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg">
            Add Sponsor
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingSponsor) && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="Sponsor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tier: e.target.value as Sponsorship["tier"]
                  }))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="platinum">Platinum</option>
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
                <option value="bronze">Bronze</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate.toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: new Date(e.target.value)
                  }))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate.toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    endDate: new Date(e.target.value)
                  }))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Active Status</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked
                    }))
                  }
                  className="mr-2"
                />
                <span className="text-sm">Sponsor is active</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Logo *</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Upload PNG file:</label>
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleLogoUpload}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  />
                </div>
                <div className="text-center text-gray-400">OR</div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Enter URL:</label>
                  <input
                    type="url"
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              {formData.logo && (
                <div className="mt-2">
                  <p className="text-xs text-green-400">✓ Logo selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={editingSponsor ? handleCancelEdit : () => setShowAddForm(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={editingSponsor ? handleUpdateSponsor : handleAddSponsor}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
            >
              {editingSponsor ? "Update Sponsor" : "Add Sponsor"}
            </button>
          </div>
        </div>
      )}

      {/* Sponsors List */}
      {sortedSponsors.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No sponsors added yet.</p>
          <p className="text-sm">Add your first sponsor to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSponsors.map((sponsor) => (
            <div key={sponsor._id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    sponsor.tier === "platinum"
                      ? "bg-purple-600 text-purple-100"
                      : sponsor.tier === "gold"
                        ? "bg-yellow-600 text-yellow-100"
                        : sponsor.tier === "silver"
                          ? "bg-gray-400 text-gray-100"
                          : "bg-amber-600 text-amber-100"
                  }`}
                >
                  {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${sponsor.isActive ? "text-green-400 bg-green-900" : "text-red-400 bg-red-900"}`}
                >
                  {sponsor.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-center mb-3">
                {sponsor.logo.type === "url" ? (
                  <Image
                    src={sponsor.logo.url}
                    alt={sponsor.name}
                    className="max-w-32 max-h-16 mx-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <Image
                    src={`data:image/${sponsor.logo.format};base64,${sponsor.logo.data}`}
                    alt={sponsor.name}
                    className="max-w-32 max-h-16 mx-auto object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                )}
              </div>

              <h4 className="font-semibold text-center mb-1">{sponsor.name}</h4>
              {sponsor.website && <p className="text-xs text-gray-400 text-center mb-3">{sponsor.website}</p>}

              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handleEditSponsor(sponsor)}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSponsor(sponsor)}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
