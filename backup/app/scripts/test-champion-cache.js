/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { championCacheService } = require("../src/lib/services/cache/champion");

async function testChampionCache() {
  console.log("Testing Champion Cache System...\n");

  try {
    // Test initialization
    console.log("1. Testing initialization...");
    await championCacheService.initialize();
    console.log("✓ Initialization successful\n");

    // Test getting latest version
    console.log("2. Testing version fetch...");
    const version = await championCacheService.getLatestVersion();
    console.log(`✓ Latest version: ${version}\n`);

    // Test getting a single champion
    console.log("3. Testing single champion download...");
    const aatrox = await championCacheService.getChampionByKey("Aatrox");
    if (aatrox) {
      console.log(`✓ Aatrox downloaded successfully:`);
      console.log(`  - ID: ${aatrox.id}`);
      console.log(`  - Name: ${aatrox.name}`);
      console.log(`  - Spells: ${aatrox.spells?.length || 0} abilities`);
      console.log(`  - Images: ${aatrox.splashImg ? "✓" : "✗"} splash, ${aatrox.squareImg ? "✓" : "✗"} square\n`);
    } else {
      console.log("✗ Failed to download Aatrox\n");
    }

    // Test cache stats
    console.log("4. Testing cache stats...");
    const stats = await championCacheService.getCacheStats();
    if (stats) {
      console.log(`✓ Cache stats:`);
      console.log(`  - Total champions: ${stats.totalChampions}`);
      console.log(`  - Cache size: ${stats.cacheSize}`);
      console.log(`  - Version: ${stats.version}\n`);
    } else {
      console.log("✗ Failed to get cache stats\n");
    }

    console.log("Champion cache test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testChampionCache();
}

module.exports = { testChampionCache };
