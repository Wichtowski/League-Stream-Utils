import React from "react";

type ProgressBarProps = {
  progress: number;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
      <div className="flex justify-between">
        <div
          className="bg-blue-500 h-2 rounded-l-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
        <div className="bg-red-500 h-2 rounded-r-full transition-all duration-1000" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};
