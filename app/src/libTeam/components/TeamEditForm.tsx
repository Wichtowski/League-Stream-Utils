import React, { useState, useRef } from "react";
import type { Team, CreateTeamRequest, TeamTier } from "@libTeam/types";
import { COUNTRY_OPTIONS } from "@libTeam/utils/countries";
import { SafeImage } from "@lib/components/common/SafeImage";
import { useModal } from "@lib/contexts";
import { LOGO_SQUARE_TOLERANCE, ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";
import { isAlmostSquare, extractTeamColorsFromImage } from "@lib/services/common/image";

interface TeamEditFormProps {
  team: Team;
  onSave: (team: Partial<CreateTeamRequest>) => Promise<void>;
  onCancel: () => void;
}

// Helper function to check if a URL supports CORS based on allowed hosts
const supportsCORS = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return !ALLOWED_IMAGE_HOSTS.some((noCorsHost) => hostname.includes(noCorsHost));
  } catch {
    return false;
  }
};

export const TeamEditForm: React.FC<TeamEditFormProps> = ({ team, onSave, onCancel }) => {
  const { showAlert } = useModal();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [useManualColors, setUseManualColors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlAutoPreviewTimer = useRef<number | null>(null);

  const [editFormData, setEditFormData] = useState<Partial<CreateTeamRequest>>({
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
  });
  const [editing, setEditing] = useState(false);

  // Initialize logo preview from existing team logo
  React.useEffect(() => {
    if (team.logo?.type === "url") {
      setLogoPreview(team.logo.url);
    } else if (team.logo?.type === "upload") {
      setLogoPreview(team.logo.data);
    }
  }, [team.logo]);

  const clearLogo = (): void => {
    setEditFormData({
      ...editFormData,
      logo: undefined
    });
    setLogoPreview("");
    setLogoUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearUrlOnly = (): void => {
    if (editFormData.logo?.type === "url") {
      setEditFormData({ ...editFormData, logo: undefined });
      setLogoPreview("");
    }
    if (logoUrlInput) setLogoUrlInput("");
  };

  const clearFileOnly = (): void => {
    if (editFormData.logo?.type === "upload") {
      setEditFormData({ ...editFormData, logo: undefined });
      setLogoPreview("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleLogoUrlChange = (url: string): void => {
    clearFileOnly();
    setLogoUrlInput(url);
    if (urlAutoPreviewTimer.current) {
      window.clearTimeout(urlAutoPreviewTimer.current);
      urlAutoPreviewTimer.current = null;
    }
    const trimmed = url.trim();
    if (trimmed.length > 25 && /^https?:\/\//i.test(trimmed)) {
      urlAutoPreviewTimer.current = window.setTimeout(() => {
        void attemptAutoPreviewUrl(trimmed);
      }, 600);
    } else {
      setLogoPreview("");
    }
  };

  const attemptAutoPreviewUrl = async (url: string): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        if (supportsCORS(url)) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          setTimeout(() => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (!isAlmostSquare(width, height)) {
              reject(
                new Error(`Not square - Width: ${width}, Height: ${height}, Ratio: ${(width / height).toFixed(3)}`)
              );
              return;
            }
            resolve();
          }, 100);
        };
        img.onerror = () => reject(new Error("Failed to load image from URL"));
        img.src = url;
      });
    } catch {
      return;
    }
    setEditFormData({
      ...editFormData,
      logo: {
        type: "url",
        url,
        format: "png"
      }
    });
    setLogoPreview(url);
  };

  const handlePreviewUrl = async (): Promise<void> => {
    const url = logoUrlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      await showAlert({ type: "warning", message: "Please enter a valid http(s) image URL" });
      return;
    }
    try {
      new URL(url);
    } catch {
      await showAlert({ type: "warning", message: "Invalid URL format" });
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        if (supportsCORS(url)) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => {
          setTimeout(() => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (!isAlmostSquare(width, height)) {
              reject(
                new Error(
                  `Logo should be square. Current ratio ${(width / height).toFixed(3)}. Allowed deviation ±${LOGO_SQUARE_TOLERANCE}.`
                )
              );
              return;
            }
            resolve();
          }, 100);
        };
        img.onerror = () => reject(new Error("Failed to load image from URL"));
        img.src = url;
      });
    } catch (err) {
      await showAlert({ type: "warning", message: err instanceof Error ? err.message : "Invalid image URL" });
      return;
    }

    setEditFormData({
      ...editFormData,
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
    if (file.size <= 30 * 1024) {
      await showAlert({
        type: "warning",
        message: "Image must be larger than 30KB to be visible"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
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
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const img = new Image();
        img.onload = async () => {
          setTimeout(async () => {
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;
            if (!isAlmostSquare(width, height)) {
              await showAlert({
                type: "warning",
                message: `Logo should be square. Current ratio ${(width / height).toFixed(3)}. Allowed deviation ±${LOGO_SQUARE_TOLERANCE}.`
              });
              return;
            }
            setEditFormData({
              ...editFormData,
              logo: {
                type: "upload",
                data: base64,
                size: file.size,
                format: format === "jpeg" ? "jpg" : format
              }
            });
            setLogoPreview(base64);
          }, 100);
        };
        img.src = base64;
      } catch {
        setLogoPreview(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateColorsFromCurrentLogo = async (): Promise<void> => {
    if (!logoPreview) return;
    try {
      const colors = await extractTeamColorsFromImage(logoPreview);
      setExtractedColors(colors);
      setUseManualColors(false);

      if (colors.length >= 3) {
        setEditFormData({
          ...editFormData,
          colors: {
            ...editFormData.colors!,
            primary: colors[0],
            secondary: colors[1],
            accent: colors[2]
          }
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate colors from logo";
      await showAlert({ type: "warning", message: errorMessage });
    }
  };

  const handleColorsChange = (colors: { primary: string; secondary: string; accent: string }) => {
    setEditFormData({
      ...editFormData,
      colors: {
        ...editFormData.colors!,
        ...colors
      }
    });
  };

  const toggleColorMode = () => {
    setUseManualColors(!useManualColors);
  };

  const updateEditPlayer = (index: number, field: "inGameName" | "tag" | "country", value: string) => {
    const newPlayers = [...(editFormData.players?.main || [])];
    newPlayers[index] = { ...newPlayers[index], [field]: value };
    setEditFormData({
      ...editFormData,
      players: { ...editFormData.players!, main: newPlayers }
    });
  };

  const updateEditSubstitute = (
    index: number,
    field: "role" | "inGameName" | "tag" | "country",
    value: string
  ) => {
    const newSubs = [...(editFormData.players?.substitutes || [])];
    newSubs[index] = { ...newSubs[index], [field]: value };
    setEditFormData({
      ...editFormData,
      players: { ...editFormData.players!, substitutes: newSubs }
    });
  };

  const addEditSubstitute = () => {
    const newSubs = [...(editFormData.players?.substitutes || [])];
    newSubs.push({ role: "TOP", inGameName: "", tag: "" });
    setEditFormData({
      ...editFormData,
      players: { ...editFormData.players!, substitutes: newSubs }
    });
  };

  const removeEditSubstitute = (index: number) => {
    const newSubs = [...(editFormData.players?.substitutes || [])];
    newSubs.splice(index, 1);
    setEditFormData({
      ...editFormData,
      players: { ...editFormData.players!, substitutes: newSubs }
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(true);
    try {
      await onSave(editFormData);
    } finally {
      setEditing(false);
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Team: {team.name}</h1>

        <form onSubmit={handleEditSave} className="space-y-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Edit Team Information</h2>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team Tag</label>
              <input
                type="text"
                value={editFormData.tag}
                onChange={(e) => setEditFormData({ ...editFormData, tag: e.target.value })}
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
                onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                className="w-full bg-gray-700 rounded px-3 py-2"
                placeholder="e.g., EUNE, EUW, NA"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tier</label>
              <select
                value={editFormData.tier}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tier: e.target.value as TeamTier
                  })
                }
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
                onChange={(e) => setEditFormData({ ...editFormData, flag: e.target.value })}
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
                  onClick={clearUrlOnly}
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
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      colors: { ...editFormData.colors!, primary: e.target.value }
                    })
                  }
                  className="w-full h-10 rounded border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <input
                  type="color"
                  value={editFormData.colors?.secondary}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      colors: { ...editFormData.colors!, secondary: e.target.value }
                    })
                  }
                  className="w-full h-10 rounded border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <input
                  type="color"
                  value={editFormData.colors?.accent}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      colors: { ...editFormData.colors!, accent: e.target.value }
                    })
                  }
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
                    setEditFormData({
                      ...editFormData,
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
                    setEditFormData({
                      ...editFormData,
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
                    setEditFormData({
                      ...editFormData,
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
                    onChange={(e) => updateEditPlayer(index, "inGameName", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Riot tag (e.g., #EUW)"
                    value={player.tag}
                    onChange={(e) => updateEditPlayer(index, "tag", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                    required
                  />
                  <select
                    value={player.country || ""}
                    onChange={(e) => updateEditPlayer(index, "country", e.target.value)}
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
                onClick={addEditSubstitute}
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
                    onChange={(e) => updateEditSubstitute(index, "role", e.target.value)}
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
                    onChange={(e) => updateEditSubstitute(index, "inGameName", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Riot tag"
                    value={player.tag}
                    onChange={(e) => updateEditSubstitute(index, "tag", e.target.value)}
                    className="bg-gray-700 rounded px-3 py-2"
                  />
                  <select
                    value={player.country || ""}
                    onChange={(e) => updateEditSubstitute(index, "country", e.target.value)}
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
                    onClick={() => removeEditSubstitute(index)}
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
