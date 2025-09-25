"use client";

import { useEffect, useState } from "react";
import { TickerFormData } from "@libTournament/types";
import { CarouselTicker } from "./CarouselTicker";

interface TickerPreviewProps {
  formData: TickerFormData;
  className?: string;
}

export const TickerPreview = ({
  formData,
  className = "",
}: TickerPreviewProps) => {
  const [previewKey, setPreviewKey] = useState(0);

  // Reset preview when form data changes significantly
  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [formData.title, formData.titleBackgroundColor, formData.titleTextColor, formData.carouselBackgroundColor]);

  return (
    <div className={`bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      {/* Preview Header */}
      <div className="bg-gray-700 px-4 py-2 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-200">Live Preview</h3>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">LIVE</span>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div
        key={previewKey}
        className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 h-64 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
          `
        }}
      >
        {/* Main Title - Full width like in actual display */}
        {formData.title?.trim() && (
          <div className="absolute bottom-12 left-0 right-0 z-20">
            <div
              className="w-full backdrop-blur-sm border-t border-gray-600/50"
              style={{ backgroundColor: formData.titleBackgroundColor || "#1f2937" }}
            >
              <div className="flex justify-center py-3 px-4">
                <h1
                  className="text-lg font-bold text-center tracking-wide drop-shadow-lg"
                  style={{ color: formData.titleTextColor || "#ffffff" }}
                >
                  {formData.title}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Carousel Ticker at bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <CarouselTicker
            items={formData.carouselItems || []}
            speed={formData.carouselSpeed || 50}
            backgroundColor={formData.carouselBackgroundColor}
          />
        </div>

        {/* Empty State */}
        {!formData.title?.trim() && (formData.carouselItems?.length || 0) === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📺</div>
              <p className="text-lg font-medium">Ticker Preview</p>
              <p className="text-sm">Add a title and carousel items to see the preview</p>
            </div>
          </div>
        )}

        {/* Preview Info Overlay */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-300">
          <div>Speed: {formData.carouselSpeed}px/s</div>
          <div>Items: {formData.carouselItems?.length || 0}</div>
          {process.env.NODE_ENV === 'development' && (
            <>
              <div>Title BG: {formData.titleBackgroundColor}</div>
              <div>Title Text: {formData.titleTextColor}</div>
              <div>Carousel BG: {formData.carouselBackgroundColor}</div>
            </>
          )}
        </div>
      </div>

      {/* Preview Controls */}
      <div className="bg-gray-700 px-4 py-2 border-t border-gray-600">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Speed: {formData.carouselSpeed}px/s</span>
          </div>
          <div className="text-xs text-gray-400">
            Title always visible
          </div>
        </div>
      </div>
    </div>
  );
};