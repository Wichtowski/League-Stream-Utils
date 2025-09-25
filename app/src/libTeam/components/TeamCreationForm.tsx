import React, { useState, useRef } from "react";
import { SafeImage } from "@lib/components/common/SafeImage";
import { CreateTeamRequest, TeamTier } from "@libTeam/types";
import { createDefaultTeamRequest } from "@libTeam/utils/defaultValues";
import { useModal } from "@lib/contexts";
import { LOGO_SQUARE_TOLERANCE, ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";
import { isAlmostSquare, extractTeamColorsFromImage } from "@lib/services/common/image";
import { ColorPalette } from "./ColorPalette";

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
  const { showAlert } = useModal();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [useManualColors, setUseManualColors] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateTeamRequest>>(createDefaultTeamRequest());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlAutoPreviewTimer = useRef<number | null>(null);

  const clearLogo = (): void => {
    setFormData({
      ...formData,
      logo: undefined
    });
    setLogoPreview("");
    setLogoUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearUrlOnly = (): void => {
    if (formData.logo?.type === "url") {
      setFormData({ ...formData, logo: undefined });
      setLogoPreview("");
    }
    if (logoUrlInput) setLogoUrlInput("");
  };

  const clearFileOnly = (): void => {
    if (formData.logo?.type === "upload") {
      setFormData({ ...formData, logo: undefined });
      setLogoPreview("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const attemptAutoPreviewUrl = async (url: string): Promise<void> => {
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();

        // Only set crossOrigin for hosts that support CORS
        if (supportsCORS(url)) {
          img.crossOrigin = "anonymous";
        }

        // Add a small delay to ensure image is fully loaded
        img.onload = () => {
          // Wait a bit more for WebP images to fully decode
          setTimeout(() => {
            // Try to get natural dimensions if available
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            // Image dimensions validation

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

  const handleLogoUrlChange = (url: string): void => {
    // Switching to URL entry clears any uploaded file
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

    // Validate aspect ratio before accepting preview
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();

        // Only set crossOrigin for hosts that support CORS
        if (supportsCORS(url)) {
          img.crossOrigin = "anonymous";
        }

        img.onload = () => {
          // Wait a bit more for WebP images to fully decode
          setTimeout(() => {
            // Try to get natural dimensions if available
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            // Image dimensions validation

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

    // Store the URL for display, but we'll transform it when submitting
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
    if (file.size <= 30 * 1024) {
      await showAlert({
        type: "warning",
        message: "Image must be larger than 30KB to be visible"
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
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const img = new Image();
        img.onload = async () => {
          // Wait a bit more for WebP images to fully decode
          setTimeout(async () => {
            // Try to get natural dimensions if available
            const width = img.naturalWidth || img.width;
            const height = img.naturalHeight || img.height;

            // Image dimensions validation

            if (!isAlmostSquare(width, height)) {
              await showAlert({
                type: "warning",
                message: `Logo should be square. Current ratio ${(width / height).toFixed(3)}. Allowed deviation ±${LOGO_SQUARE_TOLERANCE}.`
              });
              return;
            }
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
      setUseManualColors(false); // Switch to generated colors mode

      // Set the first 3 colors as default team colors
      if (colors.length >= 3) {
        setFormData({
          ...formData,
          colors: {
            ...formData.colors!,
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
    setFormData({
      ...formData,
      colors: {
        ...formData.colors!,
        ...colors
      }
    });
  };

  const toggleColorMode = () => {
    setUseManualColors(!useManualColors);
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

    // Final sanitization before submission
    const sanitizedFormData: CreateTeamRequest = {
      ...formData,
      name: sanitizeTeamName(formData.name || ""),
      tag: sanitizeTeamTag(formData.tag || ""),
      region: sanitizeRegion(formData.region || ""),
      players: {
        main: (formData.players?.main || []).map((player) => ({
          ...player,
          inGameName: player.inGameName || "",
          tag: player.tag || ""
        })),
        substitutes: (formData.players?.substitutes || []).map((player) => ({
          ...player,
          inGameName: player.inGameName || "",
          tag: player.tag || ""
        }))
      }
    } as CreateTeamRequest;

    await onSubmit(sanitizedFormData);
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value
                })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tag: e.target.value
                })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  region: e.target.value
                })
              }
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tier: e.target.value as TeamTier
                })
              }
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
                onClick={clearUrlOnly}
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, primary: e.target.value }
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, secondary: e.target.value }
                    })
                  }
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      colors: { ...formData.colors!, accent: e.target.value }
                    })
                  }
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
              <div key={player.role} className="grid grid-cols-3 gap-4 items-center">
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
