export const DDRAGON_CDN = "https://ddragon.leagueoflegends.com/cdn";
export const DDRAGON_API = "https://ddragon.leagueoflegends.com/api";
export const CDRAGON_RAW = "https://raw.communitydragon.org/latest";

import { i18n } from "@lsu/i18n/instance";

export async function getLatestVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_API}/versions.json`);
  if (!res.ok) throw new Error(i18n.t("electron:fetch_ddragon_failed", { status: res.status }));
  const versions: string[] = await res.json();

  return versions[0]!;
}
