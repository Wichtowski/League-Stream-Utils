"use client";

import { SponsorFormData, Sponsorship } from "@libTournament/types";
import { SponsorWindow } from "./SponsorWindow";

interface SponsorFormProps {
  formData: SponsorFormData;
  setFormData: React.Dispatch<React.SetStateAction<SponsorFormData>>;
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
}: SponsorFormProps): React.ReactElement => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{editingSponsor ? "Edit Sponsor" : "Add New Sponsor"}</h3>
        <button onClick={onCloseForm} className="text-gray-400 hover:text-white text-2xl">
          ×
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              placeholder="Optional sponsor name"
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
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>

          {formData.variant !== "banner" && (
            <div>
              <label className="block text-sm font-medium mb-2">Corner Fill</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={Boolean(formData.fullwidth)}
                  onChange={(e) => setFormData({ ...formData, fullwidth: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm">Make sponsor image fill the corner (cover)</span>
              </label>
            </div>
          )}

        <div>
          <label className="block text-sm font-medium mb-2">Time (seconds)</label>
          <input
            type="number"
            min={1}
            value={formData.timeInSeconds ?? 3}
            onChange={(e) =>
              setFormData({
                ...formData,
                timeInSeconds: Math.max(1, Number(e.target.value || 0))
              })
            }
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            placeholder="e.g. 5"
          />
        </div>

          

          <div>
            <label className="block text-sm font-medium mb-2">Logo</label>
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

        <div className="lg:pl-4">
          <label className="block text-sm font-medium mb-2">Live Preview</label>
          <div className="sticky top-4">
            {formData.logo ? (
              <div className="relative">
                <SponsorWindow
                  sponsors={[{
                    _id: "preview",
                    name: formData.name || "",
                    logo: formData.logo,
                    tier: formData.tier,
                    fullwidth: formData.fullwidth,
                    timeInSeconds: formData.timeInSeconds,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }]}
                  fixed={false}
                  showName={Boolean(formData.name)}
                  variant={formData.variant === "banner" ? "banner" : "corner"}
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
