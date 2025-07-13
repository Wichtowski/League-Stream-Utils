const { runesBlueprintDownloader } = require('../src/app/lib/services/runes-blueprint-downloader.ts');

async function testRunesDownloader() {
    console.log('Testing Runes Blueprint Downloader...');

    try {
        // Test downloading runes blueprint
        console.log('Downloading runes blueprint...');
        await runesBlueprintDownloader.downloadBlueprintForCurrentVersion();
        console.log('✅ Runes blueprint downloaded successfully!');

        // Test getting cache stats
        console.log('Getting cache stats...');
        const stats = await runesBlueprintDownloader.getCacheStats();
        console.log('Cache stats:', stats);

        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

testRunesDownloader(); 