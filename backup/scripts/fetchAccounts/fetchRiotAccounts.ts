import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY!;
const REGION_BASE_URL = 'https://europe.api.riotgames.com'; 

console.log(RIOT_API_KEY);

interface RiotUser {
  gameName: string;
  tagLine: string;
}

const users: RiotUser[] = [
    // Company players
    { gameName: "Robak P", tagLine: "EUNE" },
];

async function fetchRiotAccount(user: RiotUser) {
  const { gameName, tagLine } = user;
  const url = `${REGION_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
      },
    });

    console.log(`✅ ${gameName}#${tagLine} →`, response.data);
  } catch (error: any) {
    if (error.response) {
      console.error(`❌ ${gameName}#${tagLine} →`, error.response.status, error.response.data);
    } else {
      console.error(`❌ ${gameName}#${tagLine} →`, error.message);
    }
  }
}

async function main() {
  for (const user of users) {
    await fetchRiotAccount(user);
  }
}

main();