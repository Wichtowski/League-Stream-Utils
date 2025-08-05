#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Bundle analysis configuration
const BUNDLE_THRESHOLDS = {
  total: 2 * 1024 * 1024, // 2MB
  js: 1.5 * 1024 * 1024, // 1.5MB
  css: 100 * 1024, // 100KB
  images: 500 * 1024, // 500KB
  fonts: 100 * 1024, // 100KB
};

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const analyzeBundle = () => {
  console.log("🔍 Analyzing bundle size...\n");

  try {
    // Build the project first
    console.log("📦 Building project...");
    execSync("npm run build", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });

    // Get bundle stats
    const statsPath = path.join(__dirname, "../.next/build-manifest.json");
    if (!fs.existsSync(statsPath)) {
      console.error('❌ Build manifest not found. Run "npm run build" first.');
      process.exit(1);
    }

    const buildManifest = JSON.parse(fs.readFileSync(statsPath, "utf8"));

    // Analyze bundle sizes
    const analysis = {
      total: 0,
      js: 0,
      css: 0,
      images: 0,
      fonts: 0,
      files: [],
    };

    // Process all pages and chunks
    Object.values(buildManifest).forEach((page) => {
      if (Array.isArray(page)) {
        page.forEach((file) => {
          const filePath = path.join(__dirname, "../.next", file);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const size = stats.size;
            analysis.total += size;

            if (file.endsWith(".js")) {
              analysis.js += size;
            } else if (file.endsWith(".css")) {
              analysis.css += size;
            } else if (file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
              analysis.images += size;
            } else if (file.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
              analysis.fonts += size;
            }

            analysis.files.push({
              name: file,
              size,
              formattedSize: formatBytes(size),
            });
          }
        });
      }
    });

    // Display results
    console.log("📊 Bundle Analysis Results:\n");

    console.log("📦 Total Bundle Size:");
    console.log(
      `   ${formatBytes(analysis.total)} ${analysis.total > BUNDLE_THRESHOLDS.total ? "⚠️" : "✅"}`,
    );

    console.log("\n📄 JavaScript:");
    console.log(
      `   ${formatBytes(analysis.js)} ${analysis.js > BUNDLE_THRESHOLDS.js ? "⚠️" : "✅"}`,
    );

    console.log("\n🎨 CSS:");
    console.log(
      `   ${formatBytes(analysis.css)} ${analysis.css > BUNDLE_THRESHOLDS.css ? "⚠️" : "✅"}`,
    );

    console.log("\n🖼️ Images:");
    console.log(
      `   ${formatBytes(analysis.images)} ${analysis.images > BUNDLE_THRESHOLDS.images ? "⚠️" : "✅"}`,
    );

    console.log("\n🔤 Fonts:");
    console.log(
      `   ${formatBytes(analysis.fonts)} ${analysis.fonts > BUNDLE_THRESHOLDS.fonts ? "⚠️" : "✅"}`,
    );

    // Check for violations
    const violations = [];
    if (analysis.total > BUNDLE_THRESHOLDS.total) {
      violations.push(
        `Total bundle size (${formatBytes(analysis.total)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.total)} threshold`,
      );
    }
    if (analysis.js > BUNDLE_THRESHOLDS.js) {
      violations.push(
        `JavaScript bundle (${formatBytes(analysis.js)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.js)} threshold`,
      );
    }
    if (analysis.css > BUNDLE_THRESHOLDS.css) {
      violations.push(
        `CSS bundle (${formatBytes(analysis.css)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.css)} threshold`,
      );
    }
    if (analysis.images > BUNDLE_THRESHOLDS.images) {
      violations.push(
        `Images (${formatBytes(analysis.images)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.images)} threshold`,
      );
    }
    if (analysis.fonts > BUNDLE_THRESHOLDS.fonts) {
      violations.push(
        `Fonts (${formatBytes(analysis.fonts)}) exceeds ${formatBytes(BUNDLE_THRESHOLDS.fonts)} threshold`,
      );
    }

    if (violations.length > 0) {
      console.log("\n⚠️ Bundle Size Violations:");
      violations.forEach((violation) => console.log(`   • ${violation}`));
    } else {
      console.log("\n✅ All bundle sizes are within acceptable limits!");
    }

    // Show largest files
    console.log("\n📋 Largest Files:");
    analysis.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .forEach((file) => {
        console.log(`   ${file.formattedSize} - ${file.name}`);
      });

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      analysis,
      violations,
      thresholds: BUNDLE_THRESHOLDS,
    };

    const reportPath = path.join(__dirname, "../bundle-analysis-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  } catch (error) {
    console.error("❌ Bundle analysis failed:", error.message);
    process.exit(1);
  }
};

// Run analysis if called directly
if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle, formatBytes };
