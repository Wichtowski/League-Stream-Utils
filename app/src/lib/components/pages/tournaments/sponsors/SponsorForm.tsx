"use client";

import type { ImageStorage, Sponsorship } from "@lib/types";
import { SponsorWindow } from "./SponsorWindow";

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

interface SponsorFormProps {
  formData: SponsorFormData;
  setFormData: (data: SponsorFormData) => void;
  editingSponsor: Sponsorship | null;
  onAddSponsor: () => void;
  onUpdateSponsor: () => void;
  onCancelEdit: () => void;
  onCloseForm: () => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleLogoUrlChange: (url: string) => void;
}

export const SponsorForm = ({
  formData,
  setFormData,
  editingSponsor,
  onAddSponsor,
  onUpdateSponsor,
  onCancelEdit,
  onCloseForm,
  handleLogoUpload,
  handleLogoUrlChange
}: SponsorFormProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}</h3>
        <button onClick={onCloseForm} className="text-gray-400 hover:text-white text-2xl">
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            placeholder="Sponsor name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tier</label>
          <select
            value={formData.tier}
            onChange={(e) =>
              setFormData({
                ...formData,
                tier: e.target.value as SponsorFormData["tier"]
              })
            }
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
          >
            <option value="title">Title Sponsor</option>
            <option value="presenting">Presenting Sponsor</option>
            <option value="official">Official Sponsor</option>
            <option value="partner">Partner</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website</label>
          <input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Display Priority</label>
          <input
            type="number"
            value={formData.displayPriority}
            onChange={(e) =>
              setFormData({
                ...formData,
                displayPriority: parseInt(e.target.value) || 0
              })
            }
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            placeholder="0"
          />
          <p className="text-xs text-gray-400 mt-1">Higher numbers display first</p>
        </div>

        <div className="md:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Display Options */}
            <div>
              <label className="block text-sm font-medium mb-2">Display Options</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        showName: e.target.checked,
                        fillContainer: e.target.checked ? false : formData.fillContainer
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Show sponsor name</span>
                </label>
                {formData.showName && (
                  <div className="ml-6">
                    <label className="block text-xs text-gray-400 mb-1">Name position:</label>
                    <select
                      value={formData.namePosition}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          namePosition: e.target.value as "left" | "right"
                        })
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                    >
                      <option value="left">Left of logo</option>
                      <option value="right">Right of logo</option>
                    </select>
                  </div>
                )}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.fillContainer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fillContainer: e.target.checked,
                        showName: e.target.checked ? false : formData.showName
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Fill container (no black background)</span>
                </label>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <label className="block text-sm font-medium mb-2">Live Preview</label>
              {formData.logo ? (
                <div className="relative">
                  <SponsorWindow
                    currentSponsor={{
                      id: "preview",
                      name: formData.name || "Sponsor Name",
                      logo: formData.logo,
                      website: formData.website,
                      tier: formData.tier,
                      displayPriority: formData.displayPriority,
                      showName: formData.showName,
                      namePosition: formData.namePosition,
                      fillContainer: formData.fillContainer
                    }}
                    isVisible={true}
                    fixed={false}
                  />
                </div>
              ) : (
                <div className="w-64 h-32 bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-sm">Upload a logo to see preview</p>
                </div>
              )}
            </div>
          </div>
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
        {editingSponsor && (
          <button onClick={onCancelEdit} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg">
            Cancel
          </button>
        )}
        <button
          onClick={editingSponsor ? onUpdateSponsor : onAddSponsor}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
        >
          {editingSponsor ? "Update Sponsor" : "Add Sponsor"}
        </button>
      </div>
    </div>
  );
};
