import React from "react";
import { DownloadProgress } from "@lib/types/progress";

interface DownloadProgressModalProps {
  isOpen: boolean;
  progress: DownloadProgress;
  onCancel?: () => void;
}

const stageLabels = {
  "champion-data": "Downloading champion data",
  "champion-images": "Downloading champion images",
  "ability-images": "Downloading ability images",
  complete: "Download complete"
};

// Type guard for championName
function hasChampionName(
  progress: DownloadProgress | { championName?: string }
): progress is DownloadProgress & { championName: string } {
  return (
    typeof progress === "object" &&
    progress !== null &&
    "championName" in progress &&
    typeof (progress as { championName?: unknown }).championName === "string" &&
    Boolean((progress as { championName?: string }).championName)
  );
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({ isOpen, progress, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white mb-4">Downloading Champion Data</h3>

          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-2">
              {stageLabels[progress.stage as keyof typeof stageLabels] || progress.stage}
            </div>

            {/* Champion Name Progress */}
            {hasChampionName(progress) && (
              <div className="text-sm text-blue-300 mb-2">Processing: {progress.championName}</div>
            )}

            <div className="text-sm text-gray-400 mb-2">
              {progress.current} / {progress.total} champions
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="text-lg font-semibold text-white mb-4">{progress.percentage}%</div>

          {/* Progress Details */}
          <div className="text-xs text-gray-400 space-y-1">
            <div>Stage: {progress.stage}</div>
            <div>
              Progress: {progress.current} of {progress.total}
            </div>
          </div>

          {/* Cancel Button */}
          {onCancel && progress.stage !== "complete" && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Cancel Download
            </button>
          )}

          {/* Close Button when complete */}
          {progress.stage === "complete" && (
            <button
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
