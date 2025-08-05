import os from "os";
import path from "path";

export const getLeagueInstallationPaths = (): string[] => {
  const platform = os.platform();

  if (platform === "win32") {
    const basePaths = [
      "Riot Games\\League of Legends",
      "Program Files\\Riot Games\\League of Legends",
      "Program Files (x86)\\Riot Games\\League of Legends",
    ];

    const paths: string[] = [];

    // Dynamically generate paths for common drive letters
    const driveLetters = ["C", "D", "E", "F", "G", "H"];

    for (const drive of driveLetters) {
      for (const basePath of basePaths) {
        paths.push(`${drive}:\\${basePath}`);
      }
    }

    return paths;
  } else {
    return [
      "/Applications/League of Legends.app",
      "/Applications/League of Legends.app/Contents/LoL",
      path.join(os.homedir(), "Applications/League of Legends.app"),
      path.join(
        os.homedir(),
        "Applications/League of Legends.app/Contents/LoL",
      ),
    ];
  }
};
