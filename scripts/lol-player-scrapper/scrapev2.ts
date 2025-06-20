import { chromium, ElementHandle, Page } from 'playwright';
import fs from 'fs';
import OpenAI from "openai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

const players = [
    // Add players here
];

interface PlayerData {
    name: string;
    accountLevel: string;
    avgEnemiesRatingInLastTenGames: string;
    quirks: Array<{
        name: string;
        description: string;
        type: 'positive' | 'negative';
    }>;
    career: {
        currentSoloDuoRank: string;
        currentFlexRank: string;
        soloDuo: { season: string; tier: string }[];
        flex: { season: string; tier: string }[];
    }
}

function normalizeName(name: string): { original: string; normalized: string } {
    const [namePart, tag] = name.split('#');
    const region = tag?.toLowerCase() || 'eune';
    const normalized = encodeURIComponent(namePart.trim().replace(/%23/g, '-'));
    return { original: name, normalized: `${normalized}-${region.toUpperCase()}` };
}

async function pageElementToString(element: ElementHandle<Node> | null): Promise<string> {
    return element ? (await element.textContent())?.trim() || 'N/A' : 'N/A';
}

async function scrapePlayerLeagueOfGraphs(page: Page, original: string, normalized: string) {
    const playerData: PlayerData = {
        name: original,
        accountLevel: '',
        avgEnemiesRatingInLastTenGames: '',
        quirks: [],
        career: {
            currentSoloDuoRank: '',
            currentFlexRank: '',
            soloDuo: [] as any[],
            flex: [] as any[]
        }
    };
    // Landing Page
    const leagueOfGraphs = `https://www.leagueofgraphs.com/summoner/eune/${normalized}#championsData-all`;
    await page.goto(leagueOfGraphs)
    await page.waitForTimeout(5000);

    // Level
    const level = await pageElementToString(await page.$('#pageContent .bannerSubtitle'));
    playerData.accountLevel = level.replace('Level ', '').split(' - ')[0].trim();

    // Current Solo/Duo Rank or Flex Rank
    try {
        const personalRating = await page.$eval('.mainRankingDescriptionText div.queueLine span.queue', el => el.textContent?.trim() || 'N/A');
        const rankTier = await page.$eval('#mainContent .summoner-rankings > div.best-league .txt.mainRankingDescriptionText > div.leagueTier', el => el.textContent?.trim().replace(/\s+/g, ' ') || 'N/A');

        if (personalRating == 'Soloqueue') {
            playerData.career.currentSoloDuoRank = rankTier;
            const flexRating = await page.$eval('#mainContent .summoner-rankings .row.other-league-content-row .queueName.text-left.show-for-light-only', el => el.textContent?.trim() || 'N/A');
            if (flexRating == 'Draft Ranked Flex') {
                const flexTier = await page.$eval('#mainContent .summoner-rankings .other-league-content-row .leagueTier', el => el.textContent?.trim().replace(/\s+/g, ' ') || 'N/A');
                playerData.career.currentFlexRank = flexTier;
            }
        } else if (personalRating == 'Draft Ranked Flex') {
            playerData.career.currentSoloDuoRank = 'Unranked';
            playerData.career.currentFlexRank = rankTier;
        } else {
            playerData.career.currentSoloDuoRank = 'Unranked';
            playerData.career.currentFlexRank = 'Unranked';
        }
    } catch (err) {
        console.error(`${original} is currently unranked in some way`);

        playerData.career.currentSoloDuoRank = 'Unranked';
        playerData.career.currentFlexRank = 'Unranked';
    }

    // Avg Enemies Rating
    const avgEnemiesRating = await pageElementToString(await page.$('#mainContent .summoner-rankings .other-league.even.averageEnnemyLine .other-league-content .leagueTier.no-margin-bottom'));
    playerData.avgEnemiesRatingInLastTenGames = avgEnemiesRating;

    // Ranking History
    const rankingHistory = await page.$$eval('.tag.requireTooltip.brown',
        els => els.map(e => {
            const text = e.textContent?.trim() || 'Unranked';
            const tooltip = e.getAttribute('tooltip') || '';
            const soloDuoMatch = tooltip.match(/Ranked Solo\/Duo.*?reached (.*?) during/);
            const flexMatch = tooltip.match(/Ranked Flex.*?reached (.*?) during/);
            return {
                season: text.split(' ').slice(0, -1).join(' ').trim(),
                soloDuoPeak: soloDuoMatch ? soloDuoMatch[1] : 'Unranked',
                flexPeak: flexMatch ? flexMatch[1] : 'Unranked'
            };
        })
    );

    if (rankingHistory.length === 0) {
        playerData.career.soloDuo.push({ season: 'Never played SoloDuo', tier: 'Unranked' });
    } else {
        for (let i = 0; i < rankingHistory.length; i++) {
            console.log(rankingHistory[i]);
            playerData.career.soloDuo.push({ season: rankingHistory[i].season, tier: rankingHistory[i].soloDuoPeak });
            playerData.career.flex.push({ season: rankingHistory[i].season, tier: rankingHistory[i].flexPeak });
        }
    }

    const positiveQuirk = await page.$$eval('.tag.requireTooltip.green',
        els => els.map(e => {
            const tooltip = e.getAttribute('tooltip') || '';
            const nameMatch = tooltip.match(/<itemname class='tagTitle green'>(.*?)<\/itemname>/);
            const descriptionText = tooltip.split('</itemname>')[1]?.replace(/<[^>]*>/g, '').trim() || 'Unknown';

            return {
                name: nameMatch ? nameMatch[1] : 'Unknown',
                description: descriptionText,
                type: 'positive'
            };
        })
    );
    const negativeQuirk = await page.$$eval('.tag.requireTooltip.red',
        els => els.map(e => {
            const tooltip = e.getAttribute('tooltip') || '';
            const nameMatch = tooltip.match(/<itemname class='tagTitle red'>(.*?)<\/itemname>/);
            const descriptionText = tooltip.split('</itemname>')[1]?.replace(/<[^>]*>/g, '').trim() || 'Unknown';

            return {
                name: nameMatch ? nameMatch[1] : 'Unknown',
                description: descriptionText,
                type: 'negative'
            };
        })
    );
    const allPlayerQuirks = [...positiveQuirk, ...negativeQuirk];
    if (allPlayerQuirks.length > 0) {
        playerData.quirks = allPlayerQuirks.map(quirk => ({
            name: quirk.name,
            description: quirk.description,
            type: quirk.type as 'positive' | 'negative'
        }));
    }
    return playerData;
}

(async () => {
    const skipLoG = process.argv.includes('--skip-log');
    const skipScoring = process.argv.includes('--skip-scoring');
    const skipTeaming = process.argv.includes('--skip-teaming');
    console.log("Amount of players to scrape:", players.length);

    if (!skipLoG) {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const results = { players: [] as any[] };

        // Load existing data if available
        let existingData = { players: [] as any[] };
        try {
            const playersLogPath = path.join('v2', 'players-log.json');
            if (fs.existsSync(playersLogPath)) {
                existingData = JSON.parse(fs.readFileSync(playersLogPath, 'utf-8'));
            }
        } catch (err) {
            console.error('Error reading existing players.json:', err);
        }

        for (const player of players) {
            const { original, normalized } = normalizeName(player);
            console.log("Scraping for: ", original);
            // Check if player already exists in the data
            if (existingData.players.some(p => p.name === original)) {
                console.log(`Skipping ${original} - data already exists`);
                results.players.push(existingData.players.find(p => p.name === original));
                continue;
            }

            try {
                const page = await context.newPage();
                const data = await scrapePlayerLeagueOfGraphs(page, original, normalized);
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

        const versionedPath = getVersionedFilePath(path.join('v2', 'players-log.json'));
        fs.writeFileSync(versionedPath, JSON.stringify(finalResults, null, 2), 'utf-8');
        console.log(`✅ Data saved to ${versionedPath}`);
    }

    if (!skipScoring) {
        // Load data for OpenAI analysis
        let finalResults: PlayerData[];
        try {
            const latestPlayersLog = fs.readdirSync('v2')
                .filter(f => f.startsWith('players-log-') && f.endsWith('.json'))
                .sort()
                .pop();
            if (!latestPlayersLog) {
                throw new Error('No players-log file found in v2 directory');
            }
            console.log(latestPlayersLog);
            finalResults = JSON.parse(fs.readFileSync(path.join('v2', latestPlayersLog), 'utf-8'));
        } catch (err) {
            console.error('Error reading players-log.json:', err);
            process.exit(1);
        }

        const playerPrompt: string = `Analyze these League of Legends players data and assign them a score from 0 to 200 based on their relative skill and competitiveness for a tournament.
        Current Season Split: S14 Split 3
        Consider:
            - Only Season 10 and above are considered to the score
            - Benchmarking: The top player(s) should be near 200; the lowest around 0, ensuring a wide score spread.
            - Game Knowledge: The longer the player has been playing, the higher the score (Level is a good indicator of time played)
            - Quirk is a positive or negative trait that can be used to score a player (negatives should take less score than positives gives)
              (If quirk is negative and contains that player is on loosing streak (Cold Streak), it should give no penalty)
            - Solo/Duo should be view as harder to rank up than Flex.
            - Rank Progression: Players who are improving or holding rank should be rewarded.
            - Consistency: Players who maintained similar tiers over multiple seasons are more reliable.
            - Historical Performance: Peak ranks in past seasons show potential and experience.
            - Relative Comparison: Compare players against each other, not just in isolation.
        Penalties:
            - Last 3 splits: Players who were not playing in 3 recent splits should have small penalty.
            - Players that did not have rank in last 3 splits should have small penalty.
            - Current Rank and LP: Current Higher tiers and LP indicate stronger current form.

      
      Return a JSON array of objects, where each object has:
      - name: string
      - score: number (0-200)
      - explanation: string (why they received this score, referencing their current and past performance)

      Example response format:
      [
        {
          "name": "Robak P",
          "score": 192,
          "explanation": "Robak P has the highest rank in this tournament thus making him a benchmark for the rest of the players."
        },
        {
          "name": "The most Average Player",
          "score": 100,
          "explanation": "Consistent player with some good and bad historical performance."
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
        console.log(response);
        const versionedPath = getVersionedFilePath(path.join('v2', 'player-scores-log.json'));
        fs.writeFileSync(versionedPath, response.output_text, 'utf-8');
    }

    if (!skipTeaming) {
        // Load data for OpenAI analysis
        let finalResults: { players: PlayerData[] };
        try {
            const latestScoresLog = fs.readdirSync('v2')
                .filter(f => f.startsWith('player-scores-log-') && f.endsWith('.json'))
                .sort()
                .pop();
            if (!latestScoresLog) {
                throw new Error('No player-scores-log file found in v2 directory');
            }
            console.log(latestScoresLog);
            finalResults = JSON.parse(fs.readFileSync(path.join('v2', latestScoresLog), 'utf-8'));
        } catch (err) {
            console.error('Error reading player-scores-log.json:', err);
            process.exit(1);
        }
        const constraints = fs.readFileSync(path.join('v2', 'constraints.csv'), 'utf-8');
        const teamPrompt: string = `Analyze these League of Legends players data and assign them a score from 0 to 1000 based on their relative skill and competitiveness for a tournament.
    
        Consider:
        - Each team should have 5 players
        - Next to each player place target role that they should play
        - Each team should have the nearly the same sum of scores to make it fair
        - It's only allowed to have above or below difference in team score if player does not have anyone to play with that he wanted to play with
        - We have constraints that some players can't be on the same team
        - We have constraints that some players have to play with each other
        - We have constraints that some players want to play with each other
        - The '-' means that there is no constraint for that player and they can be on any team
        
        Names of players are in table below are matching their data from League of Graphs.

        Constraints .csv Table:
            ${constraints}

        Return a JSON array of objects, where each object has:
        - name: string
        - score: number (0-1000)
        - explanation: string (why they received this score, referencing their current and past performance)

        Example response format:
        {
            "teams": [
            {
                "name": "Team 1",
                "score": {summary of players scores},
                "players": [
                "Player 1 — {rank} — {score}",
                "Player 2 — {rank} — {score}",
                "Player 3 — {rank} — {score}",
                "Player 4 — {rank} — {score}",
                "Player 5 — {rank} — {score}",
                ],
                "explanation": "Team 1 has weak side bot but strong top and mid. They have to cooperate to win."
            },
            {
                "name": "Team 2",
                "score": {summary of players scores},
                "players": [
                "Player 6 — {rank} — {score}",
                "Player 7 — {rank} — {score}",
                "Player 8 — {rank} — {score}",
                "Player 9 — {rank} — {score}",
                "Player 10 — {rank} — {score}",
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
        const versionedPath = getVersionedFilePath(path.join('v2', 'team-assignments-log.json'));
        fs.writeFileSync(versionedPath, response.output_text, 'utf-8');
    }
    console.log('✅ Done');
})();