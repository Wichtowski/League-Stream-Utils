"use client";

import { useState, useEffect } from "react";
import { useElectron } from "@/libElectron/contexts/ElectronContext";

interface MongoDBStatus {
  isRunning: boolean;
  port: number;
  pid?: number;
}

export const MongoDBStatus = () => {
  const { isElectron } = useElectron();
  const [status, setStatus] = useState<MongoDBStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isElectron) return;

    const checkStatus = async () => {
      try {
        setLoading(true);
        if (window.electronAPI?.getMongoDBStatus) {
          const mongoStatus = await window.electronAPI.getMongoDBStatus();
          setStatus(mongoStatus);
        }
      } catch (error) {
        console.error("Failed to get MongoDB status:", error);
        setStatus({ isRunning: false, port: 27017 });
      } finally {
        setLoading(false);
      }
    };

    checkStatus();

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [isElectron]);

  if (!isElectron || !status) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${status.isRunning ? "bg-green-500" : "bg-red-500"}`}></div>
      <span className={status.isRunning ? "text-green-400" : "text-red-400"}>
        MongoDB {status.isRunning ? "Running" : "Stopped"}
      </span>
      {loading && <span className="text-gray-400">(Checking...)</span>}
    </div>
  );
};
