/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const { championsBlueprintDownloader } = require('../src/lib/services/champions-blueprint-downloader');

async function testChampionsBlueprint() {
    console.log('Testing Champions Blueprint Downloader...\n');

    try {
        // Test downloading champions blueprint for current version
        console.log('1. Downloading champions blueprint...');
        await championsBlueprintDownloader.downloadChampionsBlueprintForCurrentVersion();
        console.log('✅ Champions blueprint downloaded successfully!');

        // Test downloading for specific version
        console.log('\n2. Downloading champions blueprint for version 15.15.1...');
        await championsBlueprintDownloader.downloadChampionsBlueprint('15.15.1');
        console.log('✅ Champions blueprint for 15.15.1 downloaded successfully!');

        console.log('\n🎉 Champions blueprint test completed successfully!');
    } catch (error) {
        console.error('❌ Champions blueprint test failed:', error);
    }
}

// Run the test
testChampionsBlueprint().catch(console.error);

module.exports = { testChampionsBlueprint };
