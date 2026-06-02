import React from "react";
import type { Team, CreateTeamRequest, TeamTier } from "@libTeam/types";
import { COUNTRY_OPTIONS } from "@libTeam/utils/countries";
import { SafeImage } from "@lib/components/common/SafeImage";
import { useTeamLogo, useTeamColors, useTeamForm } from "@libTeam/hooks";

interface TeamEditFormProps {
  team: Team;
  onSave: (team: Partial<CreateTeamRequest>) => Promise<void>;
  onCancel: () => void;
}

export const TeamEditForm: React.FC<TeamEditFormProps> = ({ team, onSave, onCancel }) => {
  const initialFormData: Partial<CreateTeamRequest> = {
    name: team.name,
    tag: team.tag,
    flag: team.flag,
    colors: team.colors,
    players: {
      main: team.players.main.map((p) => ({
        role: p.role,
        inGameName: p.inGameName,
        tag: p.tag,
        country: p.country
      })),
      substitutes: team.players.substitutes.map((p) => ({
        role: p.role,
        inGameName: p.inGameName,
        tag: p.tag,
        country: p.country
      }))
    },
    region: team.region,
    tier: team.tier,
    logo: team.logo,
    socialMedia: team.socialMedia,
    staff: team.staff
  };

  const {
    formData: editFormData,
    isSubmitting: editing,
    updateFormData,
    updatePlayer,
    updateSubstitute,
    addSubstitute,
    removeSubstitute,
    handleSubmit
  } = useTeamForm({
    initialData: initialFormData,
    onSubmit: onSave
  });

  const {
    logoPreview,
    logoUrlInput,
    fileInputRef,
    clearLogo,
    clearUrlOnly,
    clearFileOnly,
    handleLogoUrlChange,
    handlePreviewUrl,
    handleLogoFileChange
  } = useTeamLogo({
    initialLogo: team.logo,
    onLogoChange: (logo) => updateFormData({ logo })
  });

  const { useManualColors, generateColorsFromLogo, handleColorChange, toggleColorMode } = useTeamColors({
    initialColors: team.colors,
    onColorsChange: (colors) => updateFormData({ colors })
  });

  const generateColorsFromCurrentLogo = async (): Promise<void> => {
    await generateColorsFromLogo(logoPreview);
  };

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Team: {team.name}</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Edit Team Information</h2>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team Tag</label>
              <input
                type="text"
                value={editFormData.tag}
                onChange={(e) => updateFormData({ tag: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2"
                maxLength={5}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Region</label>
              <input
                type="text"
                value={editFormData.region}
                onChange={(e) => updateFormData({ region: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="e.g., EUNE, EUW, NA"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tier</label>
              <select
                value={editFormData.tier}
                onChange={(e) => updateFormData({ tier: e.target.value as TeamTier })}
                className="w-full bg-gray-700 rounded px-3 py-2"
              >
                <option value="amateur">Amateur</option>
                <option value="semi-pro">Semi-Professional</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team Flag</label>
              <select
                value={(editFormData.flag as string | undefined) || ""}
                onChange={(e) => updateFormData({ flag: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white border-gray-600"
              >
                <option value="">Select country (optional)</option>
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">Team Logo</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onClick={clearFileOnly}
                  onChange={(e) => {
                    clearUrlOnly();
                    if (e.target.files?.[0]) void handleLogoFileChange(e.target.files[0]);
                  }}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                  ref={fileInputRef}
                />
                <p className="text-xs text-gray-400 mt-1">Min 30KB • Max 5MB • PNG, JPG, WEBP</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <label className="block text-xs text-gray-400">Or Paste URL</label>
                </div>
                <input
                  type="url"
                  value={logoUrlInput}
                  onChange={(e) => handleLogoUrlChange(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  style={{ height: "52px" }}
                  placeholder="https://example.com/logo.png"
                />
                {logoUrlInput && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handlePreviewUrl}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                    >
                      Preview Logo
                    </button>
                    <button
                      type="button"
                      onClick={clearLogo}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
            {logoPreview && (
              <div className="mt-4 flex justify-center">
                <div className="bg-gray-700 rounded-lg p-4 relative">
                  <button
                    type="button"
                    onClick={clearLogo}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    title="Remove logo"
                  >
                    ×
                  </button>
                  <SafeImage
                    src={logoPreview}
                    alt="Logo preview"
                    width={100}
                    height={100}
                    className="rounded-lg object-contain"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Team Colors */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium">Team Colors</h3>
              {logoPreview && (
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      void generateColorsFromCurrentLogo();
                    }}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                  >
                    Extract Most Dominant Colors
                  </button>
                  <button
                    type="button"
                    onClick={toggleColorMode}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      useManualColors ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"
                    }`}
                  >
                    {useManualColors ? "Use Generated Colors" : "Use Manual Colors"}
                  </button>
                </div>
              )}
            </div>

            {logoPreview && (
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Current Team Colors</h4>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-600"
                      style={{ backgroundColor: editFormData.colors?.primary }}
                    />
                    <span className="text-sm text-gray-300">Primary: {editFormData.colors?.primary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-600"
                      style={{ backgroundColor: editFormData.colors?.secondary }}
                    />
                    <span className="text-sm text-gray-300">Secondary: {editFormData.colors?.secondary}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-600"
                      style={{ backgroundColor: editFormData.colors?.accent }}
                    />
                    <span className="text-sm text-gray-300">Accent: {editFormData.colors?.accent}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <input
                  type="color"
                  value={editFormData.colors?.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <input
                  type="color"
                  value={editFormData.colors?.secondary}
                  onChange={(e) => handleColorChange("secondary", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <input
                  type="color"
                  value={editFormData.colors?.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-medium mb-3">Social Media</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Twitter</label>
                <input
                  type="url"
                  value={editFormData.socialMedia?.twitter || ""}
                  onChange={(e) =>
                    updateFormData({
                      socialMedia: { ...editFormData.socialMedia, twitter: e.target.value }
                    })
                  }
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  placeholder="https://twitter.com/team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Discord</label>
                <input
                  type="text"
                  value={editFormData.socialMedia?.discord || ""}
                  onChange={(e) =>
                    updateFormData({
                      socialMedia: { ...editFormData.socialMedia, discord: e.target.value }
                    })
                  }
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  placeholder="Discord server invite"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={editFormData.socialMedia?.website || ""}
                  onChange={(e) =>
                    updateFormData({
                      socialMedia: { ...editFormData.socialMedia, website: e.target.value }
                    })
                  }
                  className="w-full bg-gray-700 rounded px-3 py-2 text-white"
                  placeholder="https://team-website.com"
                />
              </div>
            </div>
          </div>

          {/* Main Roster */}
          <div>
            <h3 className="text-lg font-medium mb-3">Main Roster</h3>
            <div className="space-y-3">
              {editFormData.players?.main.map((player, index) => (
                <div key={player.role} className="grid grid-cols-4 gap-4 items-center">
                  <div className="bg-gray-700 px-3 py-2 rounded text-center font-medium">{player.role}</div>
                  <input
                    type="text"
                    placeholder="In-game name"
                    value={player.inGameName}
                    onChange={(e) => updatePlayer(index, "inGameName", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Riot tag (e.g., #EUW)"
                    value={player.tag}
                    onChange={(e) => updatePlayer(index, "tag", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                    required
                  />
                  <select
                    value={player.country || ""}
                    onChange={(e) => updatePlayer(index, "country", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Substitutes */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Substitutes</h3>
              <button
                type="button"
                onClick={addSubstitute}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
              >
                Add Substitute
              </button>
            </div>
            <div className="space-y-3">
              {editFormData.players?.substitutes.map((player, index) => (
                <div key={index} className="grid grid-cols-5 gap-4 items-center">
                  <select
                    value={player.role}
                    onChange={(e) => updateSubstitute(index, "role", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  >
                    <option value="TOP">TOP</option>
                    <option value="JUNGLE">JUNGLE</option>
                    <option value="MID">MID</option>
                    <option value="BOTTOM">BOTTOM</option>
                    <option value="SUPPORT">SUPPORT</option>
                  </select>
                  <input
                    type="text"
                    placeholder="In-game name"
                    value={player.inGameName}
                    onChange={(e) => updateSubstitute(index, "inGameName", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Riot tag"
                    value={player.tag}
                    onChange={(e) => updateSubstitute(index, "tag", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  />
                  <select
                    value={player.country || ""}
                    onChange={(e) => updateSubstitute(index, "country", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSubstitute(index)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              type="submit"
              disabled={editing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
            >
              {editing ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
