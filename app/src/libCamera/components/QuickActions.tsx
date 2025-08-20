"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
  teamId: string;
}

export const QuickActions = ({ teamId }: QuickActionsProps): React.ReactElement => {
  const router = useRouter();

  return (
    <div className="mb-8 bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="flex gap-4">
        <button
          onClick={() => router.push(`/modules/cameras/stream/${teamId}`)}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Test Team Stream
        </button>
        <button
          onClick={() => router.push("/modules/cameras/all")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          View All Cameras
        </button>
      </div>
    </div>
  );
};


