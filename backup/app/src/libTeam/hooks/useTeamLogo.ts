import { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "@lib/contexts";
import { LOGO_SQUARE_TOLERANCE, ALLOWED_IMAGE_HOSTS } from "@lib/services/common/constants";
import { isAlmostSquare } from "@lib/services/common/image";
import type { ImageStorage } from "@lib/types/common";

const supportsCORS = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return !ALLOWED_IMAGE_HOSTS.some((noCorsHost) => hostname.includes(noCorsHost));
  } catch {
    return false;
  }
};

interface UseTeamLogoProps {
  initialLogo?: ImageStorage;
  onLogoChange: (logo: ImageStorage | undefined) => void;
}

export const useTeamLogo = ({ initialLogo, onLogoChange }: UseTeamLogoProps) => {
  const { showAlert } = useModal();
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [logoUrlInput, setLogoUrlInput] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlAutoPreviewTimer = useRef<number | null>(null);

  // Initialize logo preview from existing logo
  useEffect(() => {
    if (initialLogo?.type === "url") {
      setLogoPreview(initialLogo.url);
    } else if (initialLogo?.type === "upload") {
      setLogoPreview(initialLogo.data);
    }
  }, [initialLogo]);

  const clearLogo = useCallback((): void => {
    onLogoChange(undefined);
    setLogoPreview("");
    setLogoUrlInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onLogoChange]);

  const clearUrlOnly = useCallback((): void => {
    if (initialLogo?.type === "url") {
      onLogoChange(undefined);
      setLogoPreview("");
    }
    if (logoUrlInput) setLogoUrlInput("");
  }, [initialLogo?.type, logoUrlInput, onLogoChange]);

  const clearFileOnly = useCallback((): void => {
    if (initialLogo?.type === "upload") {
      onLogoChange(undefined);
      setLogoPreview("");
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [initialLogo?.type, onLogoChange]);

  const attemptAutoPreviewUrl = useCallback(
    async (url: string): Promise<void> => {
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

      const logoData: ImageStorage = {
        type: "url",
        url,
        format: "png"
      };
      onLogoChange(logoData);
      setLogoPreview(url);
    },
    [onLogoChange]
  );

  const handleLogoUrlChange = useCallback(
    (url: string): void => {
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
    },
    [clearFileOnly, attemptAutoPreviewUrl]
  );

  const handlePreviewUrl = useCallback(async (): Promise<void> => {
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

    const logoData: ImageStorage = {
      type: "url",
      url,
      format: "png"
    };
    onLogoChange(logoData);
    setLogoPreview(url);
  }, [logoUrlInput, showAlert, onLogoChange]);

  const handleLogoFileChange = useCallback(
    async (file: File): Promise<void> => {
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
              const logoData: ImageStorage = {
                type: "upload",
                data: base64,
                size: file.size,
                format: format === "jpeg" ? "jpg" : format
              };
              onLogoChange(logoData);
              setLogoPreview(base64);
            }, 100);
          };
          img.src = base64;
        } catch {
          setLogoPreview(base64);
        }
      };
      reader.readAsDataURL(file);
    },
    [showAlert, onLogoChange]
  );

  return {
    logoPreview,
    logoUrlInput,
    fileInputRef,
    clearLogo,
    clearUrlOnly,
    clearFileOnly,
    handleLogoUrlChange,
    handlePreviewUrl,
    handleLogoFileChange
  };
};
