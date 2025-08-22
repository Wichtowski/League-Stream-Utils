export type PlayerRole = "TOP" | "JUNGLE" | "MID" | "BOTTOM" | "SUPPORT";
export type GamePhase = "config" | "lobby" | "ban1" | "pick1" | "ban2" | "pick2" | "finalization" | "completed";

export type ImageStorage =
  | {
      type: "upload";
      data: string; // base64 string
      size: number; // size in bytes
      format: "png" | "jpg" | "webp";
      url?: never;
    }
  | {
      type: "url";
      url: string; // external or CDN url
      size?: number;
      format?: "png" | "jpg" | "webp";
      data?: never;
    };
    
export interface TeamColors {
    primary: string;
    secondary: string;
    accent: string;
}
  