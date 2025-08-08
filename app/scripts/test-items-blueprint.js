/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { itemsBlueprintDownloader } = require("../src/lib/services/items-blueprint-downloader");

async function testItemsBlueprint() {
  console.log("Testing Items Blueprint Downloader...\n");

  try {
    // Test getting download progress
    console.log("1. Checking download progress...");
    const version = await itemsBlueprintDownloader.getLatestVersion();
    const progress = await itemsBlueprintDownloader.getDownloadProgress(version);
    console.log(`📊 Download progress: ${progress.downloaded}/${progress.total} (${progress.percentage}%)`);

    // Test downloading items blueprint for current version
    console.log("\n2. Downloading items blueprint...");
    await itemsBlueprintDownloader.downloadBlueprintForCurrentVersion();
    console.log("✅ Items blueprint downloaded successfully!");

    // Test downloading for specific version
    console.log("\n3. Downloading items blueprint for version 15.15.1...");
    await itemsBlueprintDownloader.downloadBlueprint("15.15.1");
    console.log("✅ Items blueprint for 15.15.1 downloaded successfully!");

    // Check progress again after download
    console.log("\n4. Checking download progress after download...");
    const progressAfter = await itemsBlueprintDownloader.getDownloadProgress(version);
    console.log(
      `📊 Download progress after: ${progressAfter.downloaded}/${progressAfter.total} (${progressAfter.percentage}%)`
    );

    console.log("\n🎉 Items blueprint test completed successfully!");
  } catch (error) {
    console.error("❌ Items blueprint test failed:", error);
  }
}

// Run the test
testItemsBlueprint().catch(console.error);

module.exports = { testItemsBlueprint };
