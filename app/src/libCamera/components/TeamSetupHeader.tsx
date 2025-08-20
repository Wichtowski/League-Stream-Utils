"use client";

import React from "react";
import Image from "next/image";
import { Breadcrumbs } from "@lib/components/common";

interface TeamSetupHeaderProps {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  saving: boolean;
  onSave: () => void;
}

export const TeamSetupHeader = ({
  teamId,
  teamName,
  teamLogo,
  saving,
  onSave
}: TeamSetupHeaderProps): React.ReactElement => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        {teamLogo ? (
          <Image src={teamLogo} alt={teamName} width={64} height={64} className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center text-gray-400 text-2xl">
            👥
          </div>
        )}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">{teamName}</h1>
          <p className="text-gray-400">Configure stream URLs</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Breadcrumbs
          items={[
            { label: "Camera Hub", href: "/modules/cameras" },
            { label: "Setup", href: "/modules/cameras/setup" },
            { label: teamName, href: `/modules/cameras/setup/${teamId}`, isActive: true }
          ]}
        />
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};
