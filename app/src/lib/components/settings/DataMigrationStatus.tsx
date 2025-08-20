"use client";

import { useState, useEffect } from "react";
import { useElectron } from "@/libElectron/contexts/ElectronContext";

interface MigrationStatus {
  hasLocalData: boolean;
  isMigrating: boolean;
}

interface MigrationResult {
  success: boolean;
  migratedItems: number;
  errors: string[];
}

export function DataMigrationStatus(): React.ReactNode | null {
  const { isElectron, useLocalData } = useElectron();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isElectron && useLocalData) {
      checkMigrationStatus();
    }
  }, [isElectron, useLocalData]);

  const checkMigrationStatus = async (): Promise<void> => {
    try {
      const response = await fetch("/api/v1/migration");
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error("Failed to check migration status:", error);
    }
  };

  const handleMigration = async (): Promise<void> => {
    setIsLoading(true);
    setMigrationResult(null);

    try {
      const response = await fetch("/api/v1/migration", {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        setMigrationResult({
          success: true,
          migratedItems: data.data.migratedItems,
          errors: data.data.errors
        });

        // Refresh status after migration
        setTimeout(() => {
          checkMigrationStatus();
        }, 1000);
      } else {
        setMigrationResult({
          success: false,
          migratedItems: 0,
          errors: [data.error || "Migration failed"]
        });
      }
    } catch (_error) {
      setMigrationResult({
        success: false,
        migratedItems: 0,
        errors: ["Network error during migration"]
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in Electron with local data mode
  if (!isElectron || !useLocalData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Migration Status</h3>

      {status && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">localStorage Data Found:</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status.hasLocalData
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {status.hasLocalData ? "Yes" : "No"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Migration Status:</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                status.isMigrating
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : status.hasLocalData
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {status.isMigrating ? "In Progress" : status.hasLocalData ? "Pending" : "Complete"}
            </span>
          </div>

          {status.hasLocalData && !status.isMigrating && (
            <div className="mt-4">
              <button
                onClick={handleMigration}
                disabled={isLoading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Migrating...
                  </>
                ) : (
                  "Migrate to MongoDB"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {migrationResult && (
        <div
          className={`mt-4 p-4 rounded-md ${
            migrationResult.success
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {migrationResult.success ? (
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3
                className={`text-sm font-medium ${
                  migrationResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                }`}
              >
                {migrationResult.success
                  ? `Successfully migrated ${migrationResult.migratedItems} items`
                  : "Migration failed"}
              </h3>
              {migrationResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    {migrationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>
          This will migrate your existing localStorage data (teams, tournaments, etc.) to the persistent MongoDB
          database in your %appdata% folder.
        </p>
      </div>
    </div>
  );
}
