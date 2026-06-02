export const DDRAGON_CDN = 'https://ddragon.leagueoflegends.com/cdn';
export const DDRAGON_API = 'https://ddragon.leagueoflegends.com/api';
export const CDRAGON_RAW = 'https://raw.communitydragon.org/latest';

export async function getLatestVersion(): Promise<string> {
  const res = await fetch(`${DDRAGON_API}/versions.json`);
  if (!res.ok) throw new Error(`Failed to fetch DDragon versions: ${res.status}`);
  const versions: string[] = await res.json();
  return versions[0]!;
}
