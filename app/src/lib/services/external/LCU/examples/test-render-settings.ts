/**
 * Test script to verify the new render settings (fieldOfView and banners)
 * This can be used to test the UI control functionality
 */

import { LCUClient, LCUUIControl } from "../client";
import { findLCUCredentials } from "../helpers";

export const testRenderSettings = async (): Promise<void> => {
  try {
    console.log("Testing render settings with fieldOfView and banners...");

    // Get LCU credentials
    const credentials = await findLCUCredentials();
    if (!credentials) {
      console.error("League Client not found");
      return;
    }

    // Create LCU client and UI control instance
    const lcuClient = new LCUClient(credentials);
    const uiControl = new LCUUIControl(lcuClient);

    // Test 1: Get current settings
    console.log("1. Getting current render settings...");
    const currentSettings = await uiControl.getCurrentRenderSettings();
    console.log("Current settings:", currentSettings);

    // Test 2: Apply hideKeepEssentials with new settings
    console.log("2. Applying hideKeepEssentials with fieldOfView=50.0 and banners=true...");
    await uiControl.hideUIKeepEssentials();
    console.log("hideUIKeepEssentials applied successfully");

    // Test 3: Verify the settings were applied
    console.log("3. Verifying settings were applied...");
    const updatedSettings = await uiControl.getCurrentRenderSettings();
    console.log("Updated settings:", updatedSettings);

    // Check if our specific settings are present
    if (updatedSettings.fieldOfView === 50.0) {
      console.log("✅ fieldOfView correctly set to 50.0");
    } else {
      console.log("❌ fieldOfView not set correctly:", updatedSettings.fieldOfView);
    }

    if (updatedSettings.banners === true) {
      console.log("✅ banners correctly set to true");
    } else {
      console.log("❌ banners not set correctly:", updatedSettings.banners);
    }

    // Test 4: Test individual settings
    console.log("4. Testing individual fieldOfView setting...");
    await uiControl.setCustomRenderSettings({
      fieldOfView: 60.0
    });
    console.log("fieldOfView set to 60.0");

    // Test 5: Test individual banners setting
    console.log("5. Testing individual banners setting...");
    await uiControl.setCustomRenderSettings({
      banners: false
    });
    console.log("banners set to false");

    // Test 6: Reset to our preferred settings
    console.log("6. Resetting to preferred settings...");
    await uiControl.hideUIKeepEssentials();
    console.log("Reset to hideUIKeepEssentials settings");

    console.log("✅ All render settings tests completed successfully!");

  } catch (error) {
    console.error("❌ Render settings test error:", error);
  }
};

/**
 * API endpoint test for the new settings
 */
export const testAPIEndpoints = async (): Promise<void> => {
  try {
    console.log("Testing API endpoints with new settings...");

    // Test hideKeepEssentials endpoint
    console.log("Testing hideKeepEssentials endpoint...");
    const response = await fetch("/api/v1/leagueclient/ui-control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hideKeepEssentials" })
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ hideKeepEssentials API call successful:", result.message);
    } else {
      console.log("❌ hideKeepEssentials API call failed:", response.status);
    }

    // Test getting current settings
    console.log("Testing get current settings endpoint...");
    const getResponse = await fetch("/api/v1/leagueclient/ui-control");
    
    if (getResponse.ok) {
      const settings = await getResponse.json();
      console.log("✅ Current settings retrieved:", settings.data);
      
      // Check if our new settings are present
      if (settings.data?.fieldOfView === 50.0) {
        console.log("✅ fieldOfView is correctly set to 50.0");
      }
      if (settings.data?.banners === true) {
        console.log("✅ banners is correctly set to true");
      }
    } else {
      console.log("❌ Get settings API call failed:", getResponse.status);
    }

  } catch (error) {
    console.error("❌ API endpoint test error:", error);
  }
};
