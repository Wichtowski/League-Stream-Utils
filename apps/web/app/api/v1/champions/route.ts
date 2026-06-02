import { NextRequest } from 'next/server';
import { getLatestVersion, fetchChampions, fetchChampionDetail } from '@lsu/riot-api/ddragon';
import { json, error } from '@/api/_helpers';

export async function GET(request: NextRequest) {
  const version = request.nextUrl.searchParams.get('version') ?? undefined;
  const key = request.nextUrl.searchParams.get('key');

  try {
    if (key) {
      const champion = await fetchChampionDetail(key, version);
      if (!champion) return error('Champion not found', 404);
      return json(champion);
    }

    const champions = await fetchChampions(version);
    return json(champions);
  } catch (e) {
    return error('Failed to fetch champion data', 502);
  }
}
