"use client";

import { useState } from "react";
import { StreamBannerForm } from "./StreamBannerForm";
import { StreamBannerPreview } from "./StreamBannerPreview";
import { createDefaultStreamBannerForm } from "@lib/types/forms";
import type { StreamBannerFormData } from "@lib/types/forms";

export const StreamBannerColorTest = () => {
  const [formData, setFormData] = useState<StreamBannerFormData>(() => ({
    ...createDefaultStreamBannerForm(),
    title: "Test Banner with Custom Colors",
    titleBackgroundColor: "#1e40af", // Blue background for title
    carouselBackgroundColor: "#dc2626", // Red background for carousel
    carouselItems: [
      {
        text: "Welcome to the Championship!",
        backgroundColor: "#059669",
        textColor: "#ffffff",
        order: 0
      },
      {
        text: "Prize Pool: $10,000",
        backgroundColor: "#7c3aed",
        textColor: "#ffffff",
        order: 1
      }
    ]
  }));

  const handleAddBanner = () => {
    console.log("Add banner:", formData);
    alert("Banner would be added with these colors!");
  };

  const handleUpdateBanner = () => {
    console.log("Update banner:", formData);
    alert("Banner would be updated with these colors!");
  };

  const handleCancelEdit = () => {
    console.log("Cancel edit");
  };

  const handleCloseForm = () => {
    console.log("Close form");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stream Banner Color Test</h1>
        
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">New Features:</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>✅ Editable carousel background color (full-width)</li>
            <li>✅ Editable title background color (full-width)</li>
            <li>✅ Title background is now full-width like carousel</li>
            <li>✅ Color picker and hex input for both backgrounds</li>
            <li>✅ Live preview shows actual colors</li>
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Form with Color Controls</h2>
            <StreamBannerForm
              formData={formData}
              setFormData={setFormData}
              editingBanner={null}
              onAddBanner={handleAddBanner}
              onUpdateBanner={handleUpdateBanner}
              onCancelEdit={handleCancelEdit}
              onCloseForm={handleCloseForm}
            />
          </div>

          {/* Preview */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            <StreamBannerPreview
              formData={formData}
              autoPlay={true}
            />
            
            <div className="mt-4 p-4 bg-gray-800 rounded-lg">
              <h3 className="font-semibold mb-2">Current Colors:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>Title Background:</span>
                  <div 
                    className="w-6 h-6 rounded border border-gray-500"
                    style={{ backgroundColor: formData.titleBackgroundColor }}
                  />
                  <span className="font-mono">{formData.titleBackgroundColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Carousel Background:</span>
                  <div 
                    className="w-6 h-6 rounded border border-gray-500"
                    style={{ backgroundColor: formData.carouselBackgroundColor }}
                  />
                  <span className="font-mono">{formData.carouselBackgroundColor}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};