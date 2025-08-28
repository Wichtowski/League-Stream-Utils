"use client";

import { useElectron } from "@libElectron/contexts/ElectronContext";
import { useRouter } from "next/navigation";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export const SettingsCog = ({ blured }: { blured?: boolean }) => {
  const { isElectron, useLocalData } = useElectron();
  const router = useRouter();

  return isElectron ? (
    <div className={`flex items-center space-x-2 ${blured ? "blur-sm" : ""}`}>
      <div className="text-right">
        <div className="text-sm text-gray-400">
          Mode:{" "}
          <span className={useLocalData ? "text-green-400" : "text-blue-400"}>
            {useLocalData ? "Local Data" : "Online"}
          </span>
        </div>
      </div>
      <button
        onClick={() => router.push("/settings")}
        className="p-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-600/50 hover:border-gray-500/50 transition-colors"
        title="Settings"
      >
        <Cog6ToothIcon className="w-5 h-5 text-gray-400 hover:text-gray-300" />
      </button>
    </div>
  ) : undefined;
};
