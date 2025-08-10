import https from "https";
import http from "http";
import { ipcMain } from "electron";
import path from "path";
import fs from "fs";

function registerHostedAssetsHandlers(_mainWindow, assetsPath, assetCachePath) {
  ipcMain.handle("copy-asset-file", async (_event, sourcePath, fileName) => {
    try {
      const destPath = path.join(assetsPath, fileName);
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      let fullSourcePath = sourcePath;
      if (!path.isAbsolute(sourcePath)) {
        fullSourcePath = path.join(__dirname, "..", sourcePath);
      }

      console.log(`Copying asset: ${fullSourcePath} -> ${destPath}`);

      if (!fs.existsSync(fullSourcePath)) {
        console.error(`Source file does not exist: ${fullSourcePath}`);
        return {
          success: false,
          error: `Source file does not exist: ${fullSourcePath}`
        };
      }

      fs.copyFileSync(fullSourcePath, destPath);
      console.log(`Successfully copied: ${fullSourcePath} -> ${destPath}`);
      return { success: true, localPath: destPath };
    } catch (error) {
      console.error(`Failed to copy asset: ${sourcePath} -> ${fileName}`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("save-camera-upload", async (_event, fileBuffer, fileName) => {
    try {
      const camerasPath = path.join(assetsPath, "cameras");
      if (!fs.existsSync(camerasPath)) {
        fs.mkdirSync(camerasPath, { recursive: true });
      }
      const destPath = path.join(camerasPath, fileName);
      fs.writeFileSync(destPath, fileBuffer);
      return {
        success: true,
        localPath: destPath,
        publicPath: `file://${destPath}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("download-asset", async (_event, url, category, assetKey) => {
    try {
      // For game UI assets, we want to use the assetKey as the full path structure
      let targetPath;
      if (category === "overlay" || category === "direct") {
        targetPath = path.join(assetCachePath, assetKey);
      } else {
        // For other assets, use the old logic
        const categoryPath = path.join(assetCachePath, category);
        if (!fs.existsSync(categoryPath)) {
          fs.mkdirSync(categoryPath, { recursive: true });
        }
        const assetKeyParts = assetKey.split("/");
        const fileName = assetKeyParts.pop();
        const subDirectories = assetKeyParts;
        let fullDirectoryPath = categoryPath;
        if (subDirectories.length > 0) {
          fullDirectoryPath = path.join(categoryPath, ...subDirectories);
          if (!fs.existsSync(fullDirectoryPath)) {
            fs.mkdirSync(fullDirectoryPath, { recursive: true });
          }
        }
        const urlExtension = url.split(".").pop();
        const fileNameWithExtension = fileName.includes(".") ? fileName : `${fileName}.${urlExtension}`;
        targetPath = path.join(fullDirectoryPath, fileNameWithExtension);
      }

      // Ensure the directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      if (fs.existsSync(targetPath)) {
        return { success: true, localPath: targetPath };
      }
      return new Promise((resolve) => {
        const file = fs.createWriteStream(targetPath);
        let downloadedBytes = 0;
        const startTime = Date.now();

        // Choose the appropriate protocol based on the URL
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === "https:";
        const requestModule = isHttps ? https : http;

        const request = requestModule.get(
          url,
          {
            timeout: 30000,
            headers: {
              "User-Agent": "League-Stream-Utils/1.0",
              Accept: "*/*",
              "Accept-Encoding": "gzip, deflate, br"
            }
          },
          (response) => {
            if (response.statusCode === 200) {
              response.on("data", (chunk) => {
                downloadedBytes += chunk.length;
              });
              response.pipe(file);
              file.on("finish", async () => {
                file.close();
                const downloadTime = (Date.now() - startTime) / 1000;
                const downloadSpeed = downloadedBytes / downloadTime;
                resolve({
                  success: true,
                  localPath: targetPath,
                  size: downloadedBytes,
                  downloadSpeed: downloadSpeed,
                  downloadTime: downloadTime
                });
              });
            } else {
              file.close();
              if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
              }
              resolve({
                success: false,
                error: `HTTP ${response.statusCode}`,
                statusCode: response.statusCode
              });
            }
          }
        );
        request.on("error", (err) => {
          file.close();
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }
          resolve({
            success: false,
            error: err.message,
            code: err.code
          });
        });
        request.on("timeout", () => {
          request.destroy();
          file.close();
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
          }
          resolve({
            success: false,
            error: "Request timeout",
            code: "TIMEOUT"
          });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Add new IPC handler for saving specific category manifest
  ipcMain.handle("save-category-manifest", async (_event, category, manifestData) => {
    try {
      // The manifestData now contains the full path as the key (e.g., "15.14.1/champions-manifest.json")
      // Extract the actual manifest file path from the keys
      const manifestKeys = Object.keys(manifestData);
      if (manifestKeys.length === 0) {
        return { success: true }; // Nothing to save
      }

      // Use the first key as the manifest file path (there should only be one)
      const manifestFile = manifestKeys[0];
      const manifestPath = path.join(assetCachePath, manifestFile);

      // Ensure the directory exists for versioned manifests
      const manifestDir = path.dirname(manifestPath);
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true });
      }

      // The actual data is in the manifestData[manifestFile].path
      const newData = JSON.parse(manifestData[manifestFile].path);

      // Save the updated manifest (replace entirely since it's a complete manifest)
      fs.writeFileSync(manifestPath, JSON.stringify(newData, null, 2));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Add new IPC handler for loading specific category manifest
  ipcMain.handle("load-category-manifest", async (_event, category) => {
    try {
      // The category parameter now includes the full path (e.g., "15.14.1/champions" or just "champions")
      const manifestFile = `${category}-manifest.json`;
      const manifestPath = path.join(assetCachePath, manifestFile);

      // Ensure the directory exists for versioned manifests
      const manifestDir = path.dirname(manifestPath);
      if (!fs.existsSync(manifestDir)) {
        fs.mkdirSync(manifestDir, { recursive: true });
      }

      if (fs.existsSync(manifestPath)) {
        const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        return { success: true, data };
      }

      return { success: true, data: {} };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Add new IPC handler for getting asset cache statistics
  ipcMain.handle("get-asset-cache-stats", async () => {
    try {
      if (!fs.existsSync(assetCachePath)) {
        return {
          success: true,
          stats: {
            totalSize: 0,
            fileCount: 0,
            formattedSize: "0 B"
          }
        };
      }

      let totalSize = 0;
      let fileCount = 0;

      // Recursive function to scan directory and calculate stats
      function scanDirectory(dirPath) {
        const items = fs.readdirSync(dirPath);
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            totalSize += stat.size;
            fileCount++;
          }
        }
      }

      scanDirectory(assetCachePath);

      // Format the size
      const formatBytes = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
      };

      return {
        success: true,
        stats: {
          totalSize,
          fileCount,
          formattedSize: formatBytes(totalSize)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  });

  // Removed unused batch/scan manifest utilities
}

export { registerHostedAssetsHandlers };
