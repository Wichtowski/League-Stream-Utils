"use client";

import { useState } from "react";

export const SponsorGuidebook = ({ expanded }: { expanded: boolean }) => {
  const [guidebookExpanded, setGuidebookExpanded] = useState(expanded);

  return (
    <div className="bg-green-900 bg-opacity-50 rounded-lg p-4">
      <button
        onClick={() => setGuidebookExpanded(!guidebookExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <h3 className="text-lg font-semibold">📋 Asset Guidebook</h3>
        <span className="text-2xl">{guidebookExpanded ? "−" : "+"}</span>
      </button>
      {guidebookExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Logo Requirements:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Format: PNG with transparent background</li>
              <li>• Max size: 2MB</li>
              <li>• Recommended: 256x128px or 512x256px</li>
              <li>• Aspect ratio: 2:1 (landscape)</li>
              <li>• No text in logo (will be added separately)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Display Layout:</h4>
            <ul className="space-y-1 text-gray-300">
              <li>• Position: Bottom-left corner</li>
              <li>• Size: 256x128px container</li>
              <li>• Background: Optional (can be transparent)</li>
              <li>• Animation: Fade in/out (1s each)</li>
              <li>• Cycle: 3s display per sponsor</li>
              <li>• Name: Optional, left or right of logo</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
