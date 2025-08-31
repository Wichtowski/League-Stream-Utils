export type PlayerRole = "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
export type GamePhase = "config" | "lobby" | "ban1" | "pick1" | "ban2" | "pick2" | "finalization" | "completed";

export type ImageStorage =
  | {
      type: "upload";
      data: string; // base64 string
      size: string | number; // size in bytes (string for legacy compatibility)
      format: "png" | "jpg" | "webp";
      url?: never;
      // Legacy fields for backward compatibility
      filename?: string;
      originalName?: string;
      mimeType?: string;
      uploadedAt?: Date;
    }
  | {
      type: "url";
      url: string; // external or CDN url
      size?: string | number;
      format?: "png" | "jpg" | "webp";
      data?: never;
      // Legacy fields for backward compatibility
      filename?: string;
      originalName?: string;
      mimeType?: string;
      uploadedAt?: Date;
    };

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}
