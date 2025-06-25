# League Client API (LCU) Setup Guide

This guide explains how to connect to the League of Legends client to read live champion select data.

## What is the LCU API?

The **League Client Update (LCU) API** is a local REST API that runs alongside the League of Legends client. It allows applications to:

- Read live champion select data (picks, bans, timers)
- Get summoner information
- Access gameflow state
- Interact with various client features

## How to Get LCU Credentials

The League client uses dynamic port numbers and authentication tokens that change every time the client restarts. Here are the methods to get these credentials:

### Method 1: Lockfile (Recommended)

When the League client starts, it creates a `lockfile` containing connection details.

**Windows locations:**
```
C:\Riot Games\League of Legends\lockfile
C:\Program Files\Riot Games\League of Legends\lockfile
C:\Program Files (x86)\Riot Games\League of Legends\lockfile
```

**Mac locations:**
```
/Applications/League of Legends.app/Contents/LoL/lockfile
~/Applications/League of Legends.app/Contents/LoL/lockfile
```

**Linux locations:**
```
~/.wine/drive_c/Riot Games/League of Legends/lockfile
~/Games/league-of-legends/lockfile
```

**Lockfile format:**
```
LeagueClient:1234:49152:authtoken123:https
```

Format: `ProcessName:PID:Port:AuthToken:Protocol`

### Method 2: Process Command Line

Extract credentials from the running LeagueClientUx process:

**Windows (Command Prompt):**
```cmd
wmic PROCESS WHERE name="LeagueClientUx.exe" GET commandline
```

**Windows (PowerShell):**
```powershell
Get-Process LeagueClientUx | Select-Object CommandLine
```

**Mac/Linux:**
```bash
ps -A | grep LeagueClientUx
# or
ps -ef | grep LeagueClientUx
```

Look for these parameters in the command line:
- `--app-port=49152`
- `--remoting-auth-token=authtoken123`

### Method 3: Using Our API

Our application provides an endpoint that automatically detects LCU credentials:

```javascript
// GET request to our API
const response = await fetch('/api/v1/pickban/leagueclient/lcu-credentials');
const data = await response.json();

console.log(data.credentials);
// {
//   port: "49152",
//   password: "authtoken123", 
//   protocol: "https"
// }
```

## Making LCU Requests

### Authentication

The LCU API uses HTTP Basic Authentication:
- **Username:** `riot`
- **Password:** The auth token from lockfile/process

### Example Request

```javascript
const port = "49152";
const authToken = "authtoken123";
const auth = btoa(`riot:${authToken}`); // Base64 encode

const response = await fetch(`https://127.0.0.1:${port}/lol-summoner/v1/current-summoner`, {
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json'
  }
});

const summoner = await response.json();
```

### SSL Certificate

The LCU uses a self-signed SSL certificate. In production, you'll need to:

1. **Ignore SSL verification** (development only)
2. **Use the Riot Games root certificate**
3. **Proxy through a local server** that handles SSL

## Important LCU Endpoints

### Basic Information
- `/lol-summoner/v1/current-summoner` - Current logged-in summoner
- `/lol-gameflow/v1/gameflow-phase` - Current game state

### Champion Select
- `/lol-champ-select/v1/session` - Live champion select data
- `/lol-champ-select/v1/bannable-champions` - Available champions to ban
- `/lol-champ-select/v1/pickable-champions` - Available champions to pick

### Game Information
- `/lol-gameflow/v1/session` - Current game session info
- `/lol-match-history/v1/games/{gameId}` - Match history

## Common Issues & Solutions

### 1. CORS Errors in Browser

**Problem:** Browsers block cross-origin requests to localhost with different ports.

**Solutions:**
- Use Electron app (like our setup)
- Create a local proxy server
- Use a browser extension to disable CORS (development only)

### 2. SSL Certificate Errors

**Problem:** Self-signed certificate warnings.

**Solutions:**
```javascript
// Node.js - Ignore SSL (development only)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Or use agent to ignore SSL
const https = require('https');
const agent = new https.Agent({
  rejectUnauthorized: false
});
```

### 3. Port Changes

**Problem:** Port number changes when client restarts.

**Solution:** Always re-read credentials when reconnecting.

### 4. Client Not Running

**Problem:** No lockfile or process found.

**Solution:** Ensure League client is running and logged in.

## Implementation Examples

### JavaScript/Node.js

```javascript
import fs from 'fs';
import path from 'path';

async function getLCUCredentials() {
  // Try reading lockfile
  const lockfilePath = 'C:\\Riot Games\\League of Legends\\lockfile';
  
  try {
    const content = fs.readFileSync(lockfilePath, 'utf-8');
    const [name, pid, port, password, protocol] = content.split(':');
    
    return { port, password, protocol };
  } catch (error) {
    throw new Error('League client not running or lockfile not found');
  }
}

// Usage
const credentials = await getLCUCredentials();
const lcuClient = new LCUClient(credentials);
const champSelect = await lcuClient.getChampSelectSession();
```

### Python

```python
import requests
import base64
import os

def get_lcu_credentials():
    lockfile_path = r"C:\Riot Games\League of Legends\lockfile"
    
    try:
        with open(lockfile_path, 'r') as f:
            content = f.read().strip()
            
        name, pid, port, password, protocol = content.split(':')
        return {
            'port': port,
            'password': password,
            'protocol': protocol
        }
    except FileNotFoundError:
        raise Exception("League client not running")

# Usage
creds = get_lcu_credentials()
auth = base64.b64encode(f"riot:{creds['password']}".encode()).decode()

response = requests.get(
    f"{creds['protocol']}://127.0.0.1:{creds['port']}/lol-summoner/v1/current-summoner",
    headers={'Authorization': f'Basic {auth}'},
    verify=False  # Ignore SSL certificate
)

summoner = response.json()
```

## Security Considerations

1. **Local Only:** LCU API only accepts connections from localhost (127.0.0.1)
2. **No Network Access:** Cannot be accessed from other machines
3. **Temporary Credentials:** Auth tokens change on each client restart
4. **SSL Required:** All requests must use HTTPS

## Useful Resources

- [Riot Games LCU Documentation](https://developer.riotgames.com/docs/lol#league-client-api)
- [LCU API Explorer](https://lcu.vivide.re/) - Browse available endpoints
- [Rift Explorer](https://github.com/Pupix/rift-explorer) - LCU testing tool
- [HexTech Docs](https://hextechdocs.dev/) - Community documentation

## Rate Limiting

The LCU API has rate limiting, but it's much more generous than the public Riot API:
- Designed for real-time applications
- No API key required
- Higher rate limits for local applications

## Troubleshooting Checklist

1. ✅ League of Legends client is running
2. ✅ Logged into an account (not login screen)
3. ✅ Lockfile exists or process is found
4. ✅ Correct port and auth token
5. ✅ Using HTTPS (not HTTP)
6. ✅ Proper Basic Auth header format
7. ✅ SSL certificate handling configured
8. ✅ CORS issues resolved (if using browser) 