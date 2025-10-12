import { useState, useEffect } from "react";
import { validateStreamUrl, type UrlValidationResult } from "../utils/urlValidation";

export const useUrlValidation = (url: string) => {
  const [validation, setValidation] = useState<UrlValidationResult>({ isValid: false });
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (url && url.trim() !== "") {
      const trimmedUrl = url.trim();
      const isLongEnough = trimmedUrl.length > 8; // https:// = 8 chars minimum
      
      if (isLongEnough) {
        const result = validateStreamUrl(url);
        // Only update if the result is different
        setValidation(prev => {
          if (prev.isValid !== result.isValid || prev.type !== result.type || prev.error !== result.error) {
            return result;
          }
          return prev;
        });
        setShowValidation(true);
      } else {
        // URL is too short - show "configuring" state
        const configuringState = { isValid: false, error: "URL too short", type: "configuring" as const };
        setValidation(prev => {
          if (prev.type !== "configuring") {
            return configuringState;
          }
          return prev;
        });
        setShowValidation(true);
      }
    } else {
      setShowValidation(false);
    }
  }, [url]);

  const isConfigured = Boolean(url && url.trim() !== "");

  const getInputBorderColor = (): string => {
    if (!showValidation) return "border-gray-600";
    if (validation.type === "configuring") return "border-orange-500";
    return validation.isValid ? "border-green-500" : "border-red-500";
  };

  const getStatusColor = (): string => {
    if (!showValidation) return isConfigured ? "bg-green-500" : "bg-gray-500";
    if (validation.type === "configuring") return "bg-orange-500";
    return validation.isValid ? "bg-green-500" : "bg-red-500";
  };

  const getButtonStyle = (): string => {
    if (!url || url.trim() === "") {
      return "bg-gray-600 hover:bg-gray-700 !cursor-not-allowed text-gray-400";
    }

    if (!validation.isValid) {
      return "bg-red-600 hover:bg-red-700 !cursor-not-allowed text-white";
    }

    return "bg-green-600 hover:bg-green-700 cursor-pointer text-white";
  };

  const isDisabled = (): boolean => {
    if (!url || url.trim() === "") {
      return true;
    }
    return !validation.isValid;
  };

  return {
    validation,
    showValidation,
    isConfigured,
    getInputBorderColor,
    getStatusColor,
    getButtonStyle,
    isDisabled
  };
};
