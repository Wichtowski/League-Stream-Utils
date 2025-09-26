import type { CreateTeamRequest } from "@libTeam/types";

export const createDefaultTeamRequest = (): Partial<CreateTeamRequest> => {
  const result = {
    name: "",
    tag: "",
    logo: {
      type: "url" as const,
      url: "",
      format: "png" as const
    },
    colors: {
      primary: "#3B82F6",
      secondary: "#1E40AF",
      accent: "#F59E0B"
    },
    players: {
      main: [
        { role: "TOP" as const, inGameName: "", tag: "" },
        { role: "JUNGLE" as const, inGameName: "", tag: "" },
        { role: "MID" as const, inGameName: "", tag: "" },
        { role: "BOTTOM" as const, inGameName: "", tag: "" },
        { role: "SUPPORT" as const, inGameName: "", tag: "" }
      ],
      substitutes: []
    },
    region: "",
    tier: "amateur" as const,
    socialMedia: {
      twitter: "",
      discord: "",
      website: ""
    },
    isStandalone: true
  };

  return result;
};
