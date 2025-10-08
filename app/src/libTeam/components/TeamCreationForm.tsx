import React from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { CreateTeamRequest, TeamTier } from "@libTeam/types";
import { createDefaultTeamRequest } from "@libTeam/utils/defaultValues";
import { ColorPalette } from "./ColorPalette";
import { ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";
import { COUNTRY_OPTIONS } from "@libTeam/utils/countries";
import { useTeamLogo, useTeamColors, useTeamForm } from "@libTeam/hooks";

// Input sanitization functions
const sanitizeText = (text: string): string => {
  return text.trim().replace(/\s+/g, " "); // Trim and normalize whitespace
};

const sanitizeTeamName = (name: string): string => {
  return sanitizeText(name).slice(0, 100); // Limit length
};

const sanitizeTeamTag = (tag: string): string => {
  return sanitizeText(tag).slice(0, 5).toUpperCase(); // Limit length and uppercase
};

const sanitizeRegion = (region: string): string => sanitizeText(region);

const ALLOWED_IMAGE_HOSTS_DISPLAY = ALLOWED_IMAGE_HOSTS.slice(3, ALLOWED_IMAGE_HOSTS.length);

interface TeamCreationFormProps {
  onSubmit: (formData: CreateTeamRequest) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

export const TeamCreationForm: React.FC<TeamCreationFormProps> = ({ onSubmit, onCancel, isCreating }) => {
  const {
    formData,
    updateFormData,
    updatePlayer,
    updateSubstitute,
    addSubstitute,
    removeSubstitute,
    handleSubmit
  } = useTeamForm({
    initialData: createDefaultTeamRequest(),
    onSubmit: async (data) => {
      // Final sanitization before submission
      const sanitizedFormData: CreateTeamRequest = {
        ...data,
        name: sanitizeTeamName(data.name || ""),
        tag: sanitizeTeamTag(data.tag || ""),
        region: sanitizeRegion(data.region || ""),
        flag: (data.flag as string | undefined)?.toUpperCase(),
        players: {
          main: (data.players?.main || []).map((player) => ({
            ...player,
            inGameName: player.inGameName || "",
            tag: player.tag || ""
          })),
          substitutes: (data.players?.substitutes || []).map((player) => ({
            ...player,
            inGameName: player.inGameName || "",
            tag: player.tag || ""
          }))
        }
      } as CreateTeamRequest;
      await onSubmit(sanitizedFormData);
    }
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
    initialLogo: formData.logo,
    onLogoChange: (logo) => updateFormData({ logo })
  });

  const {
    extractedColors,
    useManualColors,
    generateColorsFromLogo,
    handleColorChange,
    toggleColorMode
  } = useTeamColors({
    initialColors: formData.colors,
    onColorsChange: (colors) => updateFormData({ colors })
  });

  const generateColorsFromCurrentLogo = async (): Promise<void> => {
    await generateColorsFromLogo(logoPreview);
  };

  const handleColorsChange = (colors: { primary: string; secondary: string; accent: string }) => {
    updateFormData({ colors });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Create New Team</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium mb-2">
              Team Name
            </label>
            <input
              type="text"
              placeholder="Enter team name"
              value={formData.name || ""}
              onChange={(e) => updateFormData({ name: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
              autoComplete="off"
              id="teamName"
              required
            />
          </div>
          <div>
            <label htmlFor="teamTag" className="block text-sm font-medium mb-2">
              Team Tag
            </label>
            <input
              type="text"
              placeholder="Enter team tag (e.g., TSM)"
              value={formData.tag || ""}
              onChange={(e) => updateFormData({ tag: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
              autoComplete="off"
              id="teamTag"
              required
            />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium mb-2">
              Region
            </label>
            <select
              value={formData.region || ""}
              onChange={(e) => updateFormData({ region: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white border-gray-600 h-[40px]"
              id="region"
              required
            >
              <option value="euw1">EUW - Europe West</option>
              <option value="eun1">EUNE - Europe Nordic & East</option>
              <option value="na1">NA - North America</option>
              <option value="kr">KR - Korea</option>
              <option value="jp1">JP - Japan</option>
              <option value="lan1">LAN - Latin America North</option>
              <option value="las1">LAS - Latin America South</option>
              <option value="br1">BR - Brazil</option>
              <option value="tr1">TR - Turkey</option>
              <option value="ru">RU - Russia</option>
              <option value="oc1">OCE - Oceania</option>
              <option value="pbe1">PBE - Public Beta Environment</option>
            </select>
          </div>
          <div>
            <label htmlFor="teamTier" className="block text-sm font-medium mb-2">
              Team Tier
            </label>
            <select
              value={formData.tier || "amateur"}
              onChange={(e) => updateFormData({ tier: e.target.value as TeamTier })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white border-gray-600 h-[40px]"
              id="teamTier"
              required
            >
              <option value="amateur">Amateur</option>
              <option value="semi-pro">Semi-Pro</option>
              <option value="professional">Professional</option>
            </select>
          </div>
        </div>

        {/* Team Logo */}
        <div>
          <label htmlFor="teamLogo" className="block text-sm font-medium mb-2">
            Team Logo
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="teamLogo" className="block text-xs text-gray-400 mb-1">
                Upload Image
              </label>
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
                id="teamLogo"
              />
              <p className="text-xs text-gray-400 mt-1">Min 30KB • Max 5MB • PNG, JPG, WEBP</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label htmlFor="teamLogoUrl" className="block text-xs text-gray-400">
                  Or Paste URL
                </label>
                <div className="relative group">
                  <svg className="w-4 h-4 text-gray-500 cursor-help" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 w-80">
                    <div className="font-semibold mb-2">Allowed URL&apos;s:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {ALLOWED_IMAGE_HOSTS_DISPLAY.map((host, index) => {
                        return (
                          <div key={index} className="text-gray-300">
                            {host}
                          </div>
                        );
                      })}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
              <input
                type="url"
                value={logoUrlInput}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                style={{ height: "52px" }}
                placeholder="https://example.com/logo.png"
                id="teamLogoUrl"
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

        {/* Team Country Flag */}
        <div>
          <label htmlFor="teamFlag" className="block text-sm font-medium mb-2">
            Team Flag (overrides majority)
          </label>
          <select
            value={(formData.flag as string) || ""}
            onChange={(e) => updateFormData({ flag: e.target.value })}
            className="w-full bg-gray-700 rounded px-3 py-2 text-white border-gray-600"
            id="teamFlag"
          >
            <option value="">Select country (optional)</option>
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">If left empty, majority flag will be used when available.</p>
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

          {/* Always show team colors after providing image */}
          {logoPreview && (
            <div className="mb-4 p-4 bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Current Team Colors</h4>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-600"
                    style={{ backgroundColor: formData.colors?.primary }}
                  />
                  <span className="text-sm text-gray-300">Primary: {formData.colors?.primary}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-600"
                    style={{ backgroundColor: formData.colors?.secondary }}
                  />
                  <span className="text-sm text-gray-300">Secondary: {formData.colors?.secondary}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-8 h-8 rounded border-2 border-gray-600"
                    style={{ backgroundColor: formData.colors?.accent }}
                  />
                  <span className="text-sm text-gray-300">Accent: {formData.colors?.accent}</span>
                </div>
              </div>
            </div>
          )}

          {/* Color Selection Interface */}
          {logoPreview && extractedColors.length > 0 && !useManualColors ? (
            <ColorPalette
              colors={extractedColors}
              primaryColor={formData.colors?.primary || "#3B82F6"}
              secondaryColor={formData.colors?.secondary || "#1E40AF"}
              accentColor={formData.colors?.accent || "#F59E0B"}
              onColorsChange={handleColorsChange}
            />
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="primaryColor" className="block text-sm font-medium mb-2">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.colors?.primary}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                  id="primaryColor"
                />
              </div>
              <div>
                <label htmlFor="secondaryColor" className="block text-sm font-medium mb-2">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={formData.colors?.secondary}
                  onChange={(e) => handleColorChange("secondary", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                  id="secondaryColor"
                />
              </div>
              <div>
                <label htmlFor="accentColor" className="block text-sm font-medium mb-2">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={formData.colors?.accent}
                  onChange={(e) => handleColorChange("accent", e.target.value)}
                  className="w-full h-10 rounded border-gray-600"
                  id="accentColor"
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Roster */}
        <div>
          <h3 className="text-lg font-medium mb-3">Main Roster (5 players required)</h3>
          <div className="space-y-3">
            {formData.players?.main.map((player, index) => (
              <div key={player.role} className="grid grid-cols-4 gap-4 items-center">
                <div className="bg-gray-700 px py-2 rounded text-center font-medium">{player.role}</div>
                <input
                  type="text"
                  placeholder="In-game name"
                  value={player.inGameName}
                  onChange={(e) => updatePlayer(index, "inGameName", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  autoComplete="off"
                  id={`${player.role}-${index}-inGameName`}
                  required
                />
                <input
                  type="text"
                  placeholder="Riot tag (e.g., #EUW)"
                  value={player.tag}
                  onChange={(e) => updatePlayer(index, "tag", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  autoComplete="off"
                  id={`${player.role}-${index}-tag`}
                  required
                />
                <select
                  value={player.country || ""}
                  onChange={(e) => updatePlayer(index, "country", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white"
                  id={`${player.role}-${index}-country`}
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
            {formData.players?.substitutes.map((player, index) => (
              <div key={index} className="grid grid-cols-5 gap-4 items-center">
                <select
                  value={player.role}
                  onChange={(e) => updateSubstitute(index, "role", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white"
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
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  autoComplete="off"
                  id={`${player.role}-${index}-inGameName`}
                />
                <input
                  type="text"
                  placeholder="Riot tag"
                  value={player.tag}
                  onChange={(e) => updateSubstitute(index, "tag", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  autoComplete="off"
                  id={`${player.role}-${index}-tag`}
                />
                  <select
                    value={player.country || ""}
                    onChange={(e) => updateSubstitute(index, "country", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2 text-white"
                    id={`${player.role}-${index}-country`}
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

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg"
          >
            {isCreating ? "Creating..." : "Create Team"}
          </button>
          <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
