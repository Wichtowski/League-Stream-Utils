import { chromium, Page } from 'playwright';
import fs from 'fs';
import OpenAI from "openai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const players = [
  //  Add players here
];

interface PlayerData {
  name: string;
  accountLevel: string;
  career: {
    currentSoloDuoRank: { rank: string; peak: string };
    currentFlexRank: { rank: string; peak: string };
    soloDuo: { season: string; tier: string; lp: string }[];
    flex: { season: string; tier: string; lp: string }[];
  }
}

function normalizeName(name: string): { original: string; normalized: string } {
  const [namePart, tag] = name.split('#');
  const region = tag?.toLowerCase() || 'eune';
  const normalized = namePart.trim().replace(/\s+/g, '-');
  return { original: name, normalized: `${normalized}-${region.toUpperCase()}`};
}

async function scrapePlayerOPGG(page: Page, original: string) {
  const playerData: PlayerData = { 
    name: original, 
    accountLevel: '', 
    career: { 
      currentSoloDuoRank: { rank: '', peak: '' }, 
      currentFlexRank: { rank: '', peak: '' }, 
      soloDuo: [] as any[], 
      flex: [] as any[] 
    } 
  };

  const level = await page.$eval(
    '#content-header > div:nth-child(1) > div > div > div > div.flex.w-full div > div > span',
    el => el.textContent?.trim() || '0'
  );
  playerData.accountLevel = level;

  const peakSoloDuoElement = await page.$('#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(2) > div > div.flex > strong');
  const peakSoloDuoElementLP = await page.$('#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(2) > div > div.flex > span');

  const currentSoloDuoRankElement = await page.$('#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(1) > div.flex.flex-1.items-center.gap-4 > div > strong');
  const currentSoloDuoRank = currentSoloDuoRankElement
    ? (await currentSoloDuoRankElement.textContent())?.trim() || 'Unranked'
    : 'Unranked';
  const peakSoloDuo = peakSoloDuoElement
    ? (await peakSoloDuoElement.textContent())?.trim() || 'Unranked'
    : 'Unranked';
  const peakSoloDuoLP = peakSoloDuoElementLP
    ? (await peakSoloDuoElementLP.textContent())?.trim() || '0 LP'
    : '0 LP';

  playerData.career.currentSoloDuoRank = { rank: currentSoloDuoRank, peak: peakSoloDuo + ' ' + peakSoloDuoLP };

  const peakFlexElement = await page.$('#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(2) > div > div.flex > strong');
  const peakFlexElementLP = await page.$('#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(2) > div > div.flex > span');

  const currentFlexRankElement = await page.$('#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > div > div:nth-child(1) > div.flex.flex-1.items-center.gap-4 > div > strong');
  const currentFlexRank = currentFlexRankElement
    ? (await currentFlexRankElement.textContent())?.trim() || 'Unranked'
    : 'Unranked';
  const peakFlexRank = peakFlexElement
    ? (await peakFlexElement.textContent())?.trim() || 'Unranked'
    : 'Unranked';
  const peakFlexRankLP = peakFlexElementLP
    ? (await peakFlexElementLP.textContent())?.trim() || '0 LP'
    : '0 LP';

  playerData.career.currentFlexRank = { rank: currentFlexRank, peak: peakFlexRank + ' ' + peakFlexRankLP };

  const viewAllSeasons = await page.$('text=View all season tiers');
  if (viewAllSeasons) {
    await viewAllSeasons.click();
    await page.waitForTimeout(500); // wait for animation/content to expand
  }

  const soloDuoSeasons = await page.$$eval(
    '#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(1) strong',
    els => els.map(e => e.textContent?.trim() || 'Unknown')
  );
  const soloDuoTiers = await page.$$eval(
    '#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(2) span',
    els => els.map(e => e.textContent?.trim() || 'Unknown')
  );
  const soloDuoLps = await page.$$eval(
    '#content-container aside > section:nth-child(1) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(3)',
    els => els.map(e => e.textContent?.trim() || '0 LP')
  );
  
  console.log(soloDuoSeasons, soloDuoTiers, soloDuoLps);
  if (soloDuoSeasons.length === 0) {
    playerData.career.soloDuo.push({ season: 'Never played', tier: 'Unranked', lp: '0 LP' });
  } else {
    for (let i = 0; i < soloDuoSeasons.length; i++) {
      playerData.career.soloDuo.push({
        season: soloDuoSeasons[i],
        tier: soloDuoTiers[i] || 'Unranked',
        lp: soloDuoLps[i] || '0 LP',
      });
    }
  }

  const flexSeasons = await page.$$eval(
    '#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(1) strong',
    els => els.map(e => e.textContent?.trim() || 'Unknown')
  );
  const flexTiers = await page.$$eval(
    '#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(2) span',
    els => els.map(e => e.textContent?.trim() || 'Unknown')
  );
  const flexLps = await page.$$eval(
    '#content-container aside > section:nth-child(2) > div.flex.items-center.justify-between.flex-col.gap-3 > table > tbody > tr td:nth-child(3)',
    els => els.map(e => e.textContent?.trim() || '0 LP')
  );

  console.log(flexSeasons, flexTiers, flexLps);
  if (flexSeasons.length === 0) {
    playerData.career.flex.push({ season: 'Never played', tier: 'Unranked', lp: '0 LP' });
  } else {
    for (let i = 0; i < flexSeasons.length; i++) {
      playerData.career.flex.push({
        season: flexSeasons[i],
        tier: flexTiers[i] || 'Unranked',
        lp: flexLps[i] || '0 LP',
      });
    }
  }

  return playerData;
}

function getNextVersionNumber(filePath: string): number {
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const files = fs.readdirSync(dir);
  const versions = files
    .filter(f => f.startsWith(baseName) && f.endsWith(path.extname(filePath)))
    .map(f => {
      const match = f.match(/-v(\d+)\.json$/);
      return match ? parseInt(match[1]) : 0;
    });
  return Math.max(0, ...versions) + 1;
}

function getVersionedFilePath(basePath: string): string {
  const version = getNextVersionNumber(basePath);
  const dir = path.dirname(basePath);
  const ext = path.extname(basePath);
  const baseName = path.basename(basePath, ext);
  return path.join(dir, `${baseName}-v${version}${ext}`);
}

(async () => {
  const skipOpgg = process.argv.includes('--skip-opgg');
  const skipScoring = process.argv.includes('--skip-scoring');
  const skipTeaming = process.argv.includes('--skip-teaming');
  console.log("Amount of players to scrape:", players.length);

  if (!skipOpgg) {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const results = { players: [] as any[] };
    
    const url = `https://op.gg/lol/summoners/eune/Niskrojs-eune`;
    const page = await context.newPage();
    await page.goto(url)
    await page.waitForLoadState('domcontentloaded');
    await page.getByText('Agree').click({ timeout: 50000});
    await page.waitForLoadState('domcontentloaded');
    await page.close();

    // Load existing data if available
    let existingData = { players: [] as any[] };
    try {
      const playersPath = path.join('v1', 'players.json');
      if (fs.existsSync(playersPath)) {
        existingData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
      }
    } catch (err) {
      console.error('Error reading existing players.json:', err);
    }

    for (const player of players) {
      const { original, normalized } = normalizeName(player);
      
      // Check if player already exists in the data
      if (existingData.players.some(p => p.name === original)) {
        console.log(`Skipping ${original} - data already exists`);
        results.players.push(existingData.players.find(p => p.name === original));
        continue;
      }

      try {
        const page = await context.newPage();
        const opgg = `https://op.gg/lol/summoners/eune/${normalized}`;
        await page.goto(opgg)
        await page.waitForLoadState('domcontentloaded');
        const data = await scrapePlayerOPGG(page, original);
        await page.close();

        results.players.push(data);
      } catch (err) {
        console.error(`Error scraping ${original}:`, err);
        results.players.push({ name: original, error: 'Failed to scrape' });
      }
    }

    await browser.close();

    // Merge new results with existing data
    const finalResults = {
      players: [
        ...existingData.players,
        ...results.players.filter(newPlayer => 
          !existingData.players.some(existingPlayer => existingPlayer.name === newPlayer.name)
        )
      ]
    };

    const versionedPath = getVersionedFilePath(path.join('v1', 'players.json'));
    fs.writeFileSync(versionedPath, JSON.stringify(finalResults, null, 2), 'utf-8');
    console.log(`✅ Data saved to ${versionedPath}`);
  }

  if (!skipScoring) {
    // Load data for OpenAI analysis
    let finalResults: PlayerData[];
    try {
      const latestPlayersLog = fs.readdirSync('v1')
        .filter(f => f.startsWith('players-scores-') && f.endsWith('.json'))
        .sort()
        .pop();
      if (!latestPlayersLog) {
        throw new Error('No players file found in v1 directory');
      }
      finalResults = JSON.parse(fs.readFileSync(path.join('v1', latestPlayersLog), 'utf-8'));
    } catch (err) {
      console.error('Error reading players.json:', err);
      process.exit(1);
    }

    const playerPrompt: string = `Analyze these League of Legends players data and assign them a score from 0 to 100 based on their relative skill and competitiveness for a tournament.
    - Benchmarking: The top player(s) should be near 100; the lowest around 0, ensuring a wide score spread.

    Consider:
      - Game Knowleadge: The longer the player has been playing, the higher the score
      - Level is a good indicator of time played
      - Recent changes in the game & meta: Players who were not playing in 2 recent seasons should have small penalty.
      - Current Rank and LP: Higher tiers and LP indicate stronger current form.
      - Solo/Duo is harder to rank than Flex, since on Flex people can play with 5 stack, and on Solo/Duo you can only play solo or duo.
      - Rank Progression: Players who are improving or holding rank show promise
      - Consistency: Players who maintained similar tiers over multiple seasons are more reliable.
      - Historical Performance: Peak ranks in past seasons show potential and experience.
      - Relative Comparison: Compare players against each other, not just in isolation.
    Ranks:
      Master+: 95
      Diamond+: 80
      Emerald: 75
      Platinum+: 70
      Gold+: 60
      Silver+: 50
      Bronze+: 40
      Iron+: 30
      
      Return a JSON array of objects, where each object has:
      - name: string
      - score: number (0-100)
      - explanation: string (why they received this score, referencing their current and past performance)

      Example response format:
      [
        {
          "name": "Robak P",
          "score": 89,
          "explanation": "Robak P has the highest rank in this tournament thus making him a benchmark for the rest of the players."
        },
        {
          "name": "Another Player",
          "score": 75,
          "explanation": "Consistent Diamond player with good historical performance."
        }
      ]
    `;

    const response = await openai.responses.create({
      model: "o3",
      input: [
        {
          "role": "user",
          "content": playerPrompt
        },
        {
          "role": "user",
          "content": JSON.stringify(finalResults)
        }
      ],
      text: {
        "format": {
          "type": "json_object"
        }
      },
      reasoning: {
        "effort": "high"
      },
      tools: [],
      store: true
    });

    console.log('✅ OpenAI API call completed');
    console.log(response.output_text);
    const versionedPath = getVersionedFilePath(path.join('v1', 'player-scores.json'));
    fs.writeFileSync(versionedPath, response.output_text, 'utf-8');
  }
  
  if (!skipTeaming) {
    // Load data for OpenAI analysis
    let finalResults: { players: PlayerData[] };
    try {
      const latestScoresLog = fs.readdirSync('v1')
        .filter(f => f.startsWith('player-scores-') && f.endsWith('.json'))
        .sort()
        .pop();
      if (!latestScoresLog) {
        throw new Error('No player-scores file found in v1 directory');
      }
      finalResults = JSON.parse(fs.readFileSync(path.join('v1', latestScoresLog), 'utf-8'));
    } catch (err) {
      console.error('Error reading player-scores.json:', err);
      process.exit(1);
    }
    const constraints = fs.readFileSync(path.join('v1', 'constraints.csv'), 'utf-8');
    const teamPrompt: string = `Analyze these League of Legends players data and assign them a score from 0 to 100 based on their relative skill and competitiveness for a tournament.
    - Benchmarking: The top player(s) should be near 100; the lowest around 0, ensuring a wide score spread.

    Consider:
      - Each team should have 5 players
      - Each team should have the same sum of scores to make it fair
      - It's only allowed to have above or below difference in team score if player does not have anyone to play with that he wanted to play with
      - We have constraints that some players can't be on the same team
      - We have constraints that some players have to play with each other
      - We have onstraints that some players want to play with each other
      - The '-' means that there is no constraint for that player and he can be on any team
      - People who are left - put them in the bench or in temporary team

      Constraints .csv Table:
        ${constraints}

      Return a JSON array of objects, where each object has:
      - name: string
      - score: number (0-100)
      - explanation: string (why they received this score, referencing their current and past performance)

      Example response format:
      {
        "teams": [
          {
            "name": "Team 1",
            "score": {summary of players scores},
            "players": [
              "Player 1",
              "Player 2",
              "Player 3",
              "Player 4",
              "Player 5",
            ],
            "explanation": "Team 1 has weak side bot but strong top and mid. They have to cooperate to win."
          },
          {
            "name": "Team 2",
            "score": {summary of players scores},
            "players": [
              "Player 6",
              "Player 7",
              "Player 8",
              "Player 9",
              "Player 10",
            ],
            "explanation": "Team 2 has strong top and jungle but mid. They need to focus on the bot lane to win."
          },
          (...)
        ]
      }
    `;

    const response = await openai.responses.create({
      model: "o3",
      input: [
        {
          "role": "user",
          "content": teamPrompt
        },
        {
          "role": "user",
          "content": JSON.stringify(finalResults)
        }
      ],
      text: {
        "format": {
          "type": "json_object"
        }
      },
      reasoning: {
        "effort": "medium"
      },
      tools: [],
      store: true
    });

    console.log('✅ OpenAI API call completed');
    console.log(response.output_text);
    const versionedPath = getVersionedFilePath(path.join('v1', 'team-assignments.json'));
    fs.writeFileSync(versionedPath, response.output_text, 'utf-8');
  }
  console.log('✅ Done');
})();