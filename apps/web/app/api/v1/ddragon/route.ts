import type { NextRequest } from 'next/server';
import {
  getLatestVersion,
  getAllVersions,
  fetchItems,
  fetchSummonerSpells,
  fetchRunes,
} from '@lsu/riot-api/ddragon';
import { json, error } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const version = request.nextUrl.searchParams.get('version') ?? undefined;

  try {
    switch (type) {
      case 'versions':
        return json(await getAllVersions());
      case 'items':
        return json(await fetchItems(version));
      case 'runes':
        return json(await fetchRunes(version));
      case 'summoner-spells':
        return json(await fetchSummonerSpells(version));
      case 'latest-version':
        return json({ version: await getLatestVersion() });
      default:
        return error(
          'type param required: versions | items | runes | summoner-spells | latest-version',
        );
    }
  } catch {
    return error('Failed to fetch DDragon data', 502);
  }
}
