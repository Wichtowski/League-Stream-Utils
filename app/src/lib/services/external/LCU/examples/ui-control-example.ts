import { LCUClient, LCUUIControl } from "../client";
import { findLCUCredentials } from "../helpers";

/**
 * Example usage of the UI control functions
 */
export const uiControlExample = async (): Promise<void> => {
  try {
    // Get LCU credentials
    const credentials = await findLCUCredentials();
    if (!credentials) {
      console.error("League Client not found");
      return;
    }

    // Create LCU client and UI control instance
    const lcuClient = new LCUClient(credentials);
    const uiControl = new LCUUIControl(lcuClient);

    // Example 1: Hide all UI elements
    console.log("Hiding all UI elements...");
    await uiControl.hideAllUI();
    console.log("All UI elements hidden");

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Example 2: Show all UI elements
    console.log("Showing all UI elements...");
    await uiControl.showAllUI();
    console.log("All UI elements shown");

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Example 3: Hide UI but keep essential elements
    console.log("Hiding UI but keeping essentials...");
    await uiControl.hideUIKeepEssentials();
    console.log("UI hidden, keeping: minimap, kill callouts, announcements, neutral timers, quests");

    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Example 4: Get current render settings
    console.log("Getting current render settings...");
    const currentSettings = await uiControl.getCurrentRenderSettings();
    console.log("Current settings:", currentSettings);

    // Example 5: Set custom render settings
    console.log("Setting custom render settings...");
    await uiControl.setCustomRenderSettings({
      interfaceAll: false,
      interfaceMinimap: true,
      interfaceKillCallouts: true,
      interfaceAnnounce: true,
      interfaceNeutralTimers: true,
      interfaceQuests: true,
      interfaceChat: false,
      interfaceFrames: false,
      fieldOfView: 50.0,
      banners: true
    });
    console.log("Custom settings applied");

  } catch (error) {
    console.error("UI control example error:", error);
  }
};

/**
 * API endpoint usage examples
 */
export const apiUsageExamples = {
  // Hide all UI
  hideAllUI: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideAll" })
    });
    const result = await response.json();
    console.log("Hide all UI result:", result);
  },

  // Show all UI
  showAllUI: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "showAll" })
    });
    const result = await response.json();
    console.log("Show all UI result:", result);
  },

  // Hide UI but keep essentials
  hideKeepEssentials: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideKeepEssentials" })
    });
    const result = await response.json();
    console.log("Hide keep essentials result:", result);
  },

  // Get current settings
  getCurrentSettings: async (): Promise<void> => {
    const response = await fetch("/api/v1/leagueclient/ui-control");
    const result = await response.json();
    console.log("Current settings:", result);
  }
};
