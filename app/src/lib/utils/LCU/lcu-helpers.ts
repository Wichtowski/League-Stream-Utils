import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import https from "https";
import { URL } from "url";
import { getLeagueInstallationPaths } from "./league-paths";

const execAsync = promisify(exec);

export interface LCUCredentials {
  port: string;
  password: string;
  protocol: string;
  pid?: string;
}

export interface LCURequestResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Read from lockfile
export const findLCUFromLockfile = async (): Promise<LCUCredentials | null> => {
  const possiblePaths = getLeagueInstallationPaths();

  for (const leaguePath of possiblePaths) {
    try {
      const expandedPath = leaguePath.replace("~", os.homedir());
      const lockfilePath = path.join(expandedPath, "lockfile");

      const lockfileContent = await fs.readFile(lockfilePath, "utf-8");
      const parts = lockfileContent.trim().split(":");

      if (parts.length >= 5) {
        return {
          port: parts[2],
          password: parts[3],
          protocol: parts[4],
          pid: parts[1],
        };
      }
    } catch (_error) {
      continue;
    }
  }

  return null;
};

// Parse from process command line
export const findLCUFromProcess = async (): Promise<LCUCredentials | null> => {
  try {
    const platform = os.platform();
    let command: string;

    if (platform === "win32") {
      command = 'wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline';
    } else if (platform === "darwin") {
      command = "ps -A | grep LeagueClientUx";
    } else {
      command = "ps -ef | grep LeagueClientUx";
    }

    const { stdout } = await execAsync(command);

    // Extract port and auth token from command line
    const portMatch = stdout.match(/--app-port=(\d+)/);
    const tokenMatch = stdout.match(/--remoting-auth-token=([\w-]+)/);

    if (portMatch && tokenMatch) {
      return {
        port: portMatch[1],
        password: tokenMatch[1],
        protocol: "https",
      };
    }
  } catch (error) {
    console.debug("Error getting credentials from process:", error);
  }

  return null;
};

// Find LCU credentials using all available methods
export const findLCUCredentials = async (): Promise<LCUCredentials | null> => {
  // Try process method first (most reliable)
  let credentials = await findLCUFromProcess();

  if (!credentials) {
    // Fallback to lockfile method
    credentials = await findLCUFromLockfile();
  }

  return credentials;
};

// Make LCU request with proper SSL handling
export const makeLCURequest = async <T = unknown>(
  credentials: LCUCredentials,
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE" = "GET",
  body?: unknown,
  timeout = 5000,
): Promise<LCURequestResult<T>> => {
  try {
    const requestUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}${endpoint}`;
    const auth = Buffer.from(`riot:${credentials.password}`).toString("base64");
    const parsedUrl = new URL(requestUrl);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      rejectUnauthorized: false, // Ignore self-signed certificate
    };

    const response = await new Promise<{ statusCode?: number; data: string }>(
      (resolve, reject) => {
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({ statusCode: res.statusCode, data });
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.setTimeout(timeout, () => {
          req.destroy();
          reject(new Error("Request timeout"));
        });

        if (body) {
          req.write(JSON.stringify(body));
        }

        req.end();
      },
    );

    if (response.statusCode === 404) {
      // 404 is normal for some endpoints (e.g., champion select not active)
      return { success: true, data: null as T };
    }

    if (
      response.statusCode &&
      response.statusCode >= 200 &&
      response.statusCode < 400
    ) {
      try {
        const jsonData = JSON.parse(response.data);
        return { success: true, data: jsonData as T };
      } catch (_parseError) {
        // Return raw data if not JSON
        return { success: true, data: response.data as T };
      }
    } else {
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Test LCU connection
export const testLCUConnection = async (
  credentials: LCUCredentials,
): Promise<
  LCURequestResult<{
    displayName: string;
    summonerLevel: number;
    profileIconId: number;
  }>
> => {
  return makeLCURequest(credentials, "/lol-summoner/v1/current-summoner");
};

// Get champion select session
export const getChampSelectSession = async (
  credentials: LCUCredentials,
): Promise<LCURequestResult> => {
  return makeLCURequest(credentials, "/lol-champ-select/v1/session");
};

// Get gameflow phase
export const getGameflowPhase = async (
  credentials: LCUCredentials,
): Promise<LCURequestResult<string>> => {
  return makeLCURequest(credentials, "/lol-gameflow/v1/gameflow-phase");
};
