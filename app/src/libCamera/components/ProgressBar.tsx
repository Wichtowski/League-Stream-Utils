"use client";

import React from "react";

interface ProgressBarProps {
  completed: number;
  total: number;
}

export const ProgressBar = ({ completed, total }: ProgressBarProps): React.ReactElement => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mb-8 bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-medium">Stream Configuration Progress</span>
        <span className="text-blue-400">
          {completed} / {total}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div className="bg-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

