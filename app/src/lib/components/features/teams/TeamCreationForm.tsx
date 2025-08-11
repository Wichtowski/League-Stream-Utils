import React, { useState, useRef } from "react";
import Image from "next/image";
import type { CreateTeamRequest, TeamTier } from "@lib/types";
import { createDefaultTeamRequest } from "@lib/types";
import { useModal } from "@lib/contexts";

interface TeamCreationFormProps {
  onSubmit: (formData: CreateTeamRequest) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

export const TeamCreationForm: React.FC<TeamCreationFormProps> = ({ onSubmit, onCancel, isCreating }) => {
  const { showAlert } = useModal();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState<Partial<CreateTeamRequest>>(createDefaultTeamRequest());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearLogo = () => {
    setFormData({
      ...formData,
      logo: undefined
    });
    setLogoPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setFormData({
      ...formData,
      logo: {
        type: "url",
        url,
        format: "png"
      }
    });
    setLogoPreview(url);
  };

  const handleLogoFileChange = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      await showAlert({
        type: "warning",
        message: "Please select an image file"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      await showAlert({
        type: "warning",
        message: "Image must be smaller than 5MB"
      });
      return;
    }

    const format = file.type.split("/")[1] as "png" | "jpg" | "webp" | "jpeg";
    if (!["png", "jpg", "jpeg", "webp"].includes(format)) {
      await showAlert({
        type: "warning",
        message: "Supported formats: PNG, JPG, WEBP"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFormData({
        ...formData,
        logo: {
          type: "upload",
          data: base64,
          size: file.size,
          format: format === "jpeg" ? "jpg" : format
        }
      });
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const updatePlayer = (index: number, field: "inGameName" | "tag", value: string) => {
    const newPlayers = [...(formData.players?.main || [])];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setFormData({
      ...formData,
      players: { ...formData.players!, main: newPlayers }
    });
  };

  const addSubstitute = () => {
    const newSubs = [...(formData.players?.substitutes || [])];
    newSubs.push({ role: "TOP", inGameName: "", tag: "" });
    setFormData({
      ...formData,
      players: { ...formData.players!, substitutes: newSubs }
    });
  };

  const removeSubstitute = (index: number) => {
    const newSubs = [...(formData.players?.substitutes || [])];
    newSubs.splice(index, 1);
    setFormData({
      ...formData,
      players: { ...formData.players!, substitutes: newSubs }
    });
  };

  const updateSubstitute = (index: number, field: "role" | "inGameName" | "tag", value: string) => {
    const newSubs = [...(formData.players?.substitutes || [])];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setFormData({
      ...formData,
      players: { ...formData.players!, substitutes: newSubs }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData as CreateTeamRequest);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Create New Team</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Team Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Enter team name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Team Tag</label>
            <input
              type="text"
              value={formData.tag}
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Enter team tag"
              maxLength={5}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Region</label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="e.g., EUNE, EUW, NA"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value as TeamTier })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="amateur">Amateur</option>
              <option value="semi-pro">Semi-Professional</option>
              <option value="professional">Professional</option>
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
                onChange={(e) => e.target.files?.[0] && handleLogoFileChange(e.target.files[0])}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-600 file:text-white hover:file:bg-gray-500"
                disabled={formData.logo?.type === "url" && !!formData.logo.url}
                ref={fileInputRef}
              />
              <p className="text-xs text-gray-400 mt-1">Max 5MB • PNG, JPG, WEBP</p>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Or paste URL</label>
              <input
                type="url"
                value={formData.logo?.type === "url" ? formData.logo.url : ""}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                placeholder="https://example.com/logo.png"
                disabled={formData.logo?.type === "upload" && !!formData.logo.data}
              />
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
                <Image
                  src={logoPreview}
                  alt="Logo preview"
                  width={100}
                  height={100}
                  className="rounded-lg object-contain"
                  onError={() => setLogoPreview("")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Team Colors */}
        <div>
          <h3 className="text-lg font-medium mb-3">Team Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Primary Color</label>
              <input
                type="color"
                value={formData.colors?.primary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    colors: { ...formData.colors!, primary: e.target.value }
                  })
                }
                className="w-full h-10 rounded border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Secondary Color</label>
              <input
                type="color"
                value={formData.colors?.secondary}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    colors: { ...formData.colors!, secondary: e.target.value }
                  })
                }
                className="w-full h-10 rounded border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Accent Color</label>
              <input
                type="color"
                value={formData.colors?.accent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    colors: { ...formData.colors!, accent: e.target.value }
                  })
                }
                className="w-full h-10 rounded border-gray-600"
              />
            </div>
          </div>
        </div>

        {/* Main Roster */}
        <div>
          <h3 className="text-lg font-medium mb-3">Main Roster (5 players required)</h3>
          <div className="space-y-3">
            {formData.players?.main.map((player, index) => (
              <div key={player.role} className="grid grid-cols-3 gap-4 items-center">
                <div className="bg-gray-700 px-3 py-2 rounded text-center font-medium">{player.role}</div>
                <input
                  type="text"
                  placeholder="In-game name"
                  value={player.inGameName}
                  onChange={(e) => updatePlayer(index, "inGameName", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Riot tag (e.g., #EUW)"
                  value={player.tag}
                  onChange={(e) => updatePlayer(index, "tag", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                  required
                />
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
              <div key={index} className="grid grid-cols-4 gap-4 items-center">
                <select
                  value={player.role}
                  onChange={(e) => updateSubstitute(index, "role", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white"
                >
                  <option value="TOP">TOP</option>
                  <option value="JUNGLE">JUNGLE</option>
                  <option value="MID">MID</option>
                  <option value="ADC">ADC</option>
                  <option value="SUPPORT">SUPPORT</option>
                </select>
                <input
                  type="text"
                  placeholder="In-game name"
                  value={player.inGameName}
                  onChange={(e) => updateSubstitute(index, "inGameName", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                />
                <input
                  type="text"
                  placeholder="Riot tag"
                  value={player.tag}
                  onChange={(e) => updateSubstitute(index, "tag", e.target.value)}
                  className="bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                />
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
