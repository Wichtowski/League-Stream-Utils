"use client";

import React from "react";
import { DownloadProgress } from "@/lib/services-old/cache/asset-downloader";

interface AssetDownloadProgressProps {
  progress: DownloadProgress;
  onCancel?: () => void;
  className?: string;
}

const getAssetIcon = (assetType?: string): string => {
  switch (assetType) {
    case "champion-data":
    case "champion-images":
    case "ability-images":
      return "⚔️";
    case "item-data":
    case "item-images":
      return "🛡️";
    case "spell-data":
    case "spell-images":
      return "✨";
    case "rune-data":
    case "rune-images":
      return "🔮";
    case "game-ui":
      return "🎮";
    default:
      return "📦";
  }
};

const getAssetTypeLabel = (assetType?: string): string => {
  switch (assetType) {
    case "champion-data":
      return "Champions";
    case "champion-images":
      return "Champion Images";
    case "ability-images":
      return "Abilities";
    case "item-data":
      return "Items";
    case "item-images":
      return "Item Images";
    case "spell-data":
      return "Spells";
    case "spell-images":
      return "Spell Images";
    case "rune-data":
      return "Runes";
    case "rune-images":
      return "Rune Images";
    case "game-ui":
      return "Game UI Assets";
    default:
      return "Assets";
  }
};

export const AssetDownloadProgress: React.FC<AssetDownloadProgressProps> = ({ progress, onCancel, className = "" }) => {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isComplete = progress.stage === "complete";
  const isError = progress.stage === "error";
  const isDownloading = progress.stage === "downloading";

  return (
    <div className={`bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 max-w-lg w-full mx-4 text-center ${className}`}>
      <div className="mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-600/20 flex items-center justify-center">
          {isComplete ? (
            <div className="w-8 h-8 text-green-400 text-2xl">✓</div>
          ) : isError ? (
            <div className="w-8 h-8 text-red-400 text-2xl">✗</div>
          ) : (
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {isComplete ? "Download Complete" : isError ? "Download Error" : "Downloading Assets"}
        </h2>
        <p className="text-gray-400">{progress.message || "Processing assets..."}</p>
      </div>

      {isDownloading && (
        <div className="space-y-4">
          {/* Asset Type */}
          {progress.assetType && (
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-300">
              <span className="text-lg">{getAssetIcon(progress.assetType)}</span>
              <span>{getAssetTypeLabel(progress.assetType)}</span>
            </div>
          )}

          {/* Current Asset */}
          {progress.currentAsset && (
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Currently Processing</div>
              <div className="text-sm font-semibold text-white">{progress.currentAsset.split(" ")[0]}</div>
            </div>
          )}

          {/* Progress Bar */}
          {progress.total > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progress</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${isError ? "bg-red-500" : "bg-blue-500"}`}
                  style={{ width: `${Math.round(percentage)}%` }}
                ></div>
              </div>
              <div className="text-center text-xs text-gray-400 mt-1">{Math.round(percentage)}% Complete</div>
            </div>
          )}

          {/* Stage Indicator */}
          <div className="flex justify-center">
            <div className="inline-flex items-center space-x-2 bg-gray-700/50 rounded-full px-3 py-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  progress.stage === "checking"
                    ? "bg-yellow-400"
                    : progress.stage === "downloading"
                      ? "bg-blue-400"
                      : progress.stage === "error"
                        ? "bg-red-400"
                        : "bg-green-400"
                }`}
              ></div>
              <span className="text-xs text-gray-300 capitalize">{progress.stage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {isDownloading && onCancel && (
        <div className="mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
          >
            Cancel Download
          </button>
        </div>
      )}

      {/* Complete/Error Button */}
      {(isComplete || isError) && onCancel && (
        <div className="mt-6">
          <button
            onClick={onCancel}
            className={`px-4 py-2 text-white rounded-lg transition-colors text-sm ${
              isComplete ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {isComplete ? "Close" : "Dismiss"}
          </button>
        </div>
      )}
    </div>
  );
};
