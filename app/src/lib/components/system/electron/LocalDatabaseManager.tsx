"use client";

import { useState, useEffect } from "react";
import { useElectron } from "@lib/contexts/ElectronContext";
import { Button } from "@lib/components/common/buttons/Button";
import type { Document } from "mongodb";

interface DatabaseBackup {
  id: string;
  timestamp: Date;
  collections: string[];
  size: number;
  path: string;
}

interface CollectionData {
  name: string;
  count: number;
  sample: Document[];
}

export const LocalDatabaseManager = () => {
  const { isElectron } = useElectron();
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [backups, setBackups] = useState<DatabaseBackup[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [collectionData, setCollectionData] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isElectron) {
      loadCollections();
      loadBackups();
    }
  }, [isElectron]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.getDatabaseCollections) {
        const data = await window.electronAPI.getDatabaseCollections();
        setCollections(data as CollectionData[]);
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
      setMessage({ type: "error", text: "Failed to load collections" });
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      if (window.electronAPI?.getDatabaseBackups) {
        const data = await window.electronAPI.getDatabaseBackups();
        setBackups(data);
      }
    } catch (error) {
      console.error("Failed to load backups:", error);
    }
  };

  const loadCollectionData = async (collectionName: string) => {
    try {
      setLoading(true);
      if (window.electronAPI?.getCollectionData) {
        const data = await window.electronAPI.getCollectionData(collectionName, 50);
        setCollectionData(data as Document[]);
        setSelectedCollection(collectionName);
      }
    } catch (error) {
      console.error("Failed to load collection data:", error);
      setMessage({ type: "error", text: "Failed to load collection data" });
    } finally {
      setLoading(false);
    }
  };

  const exportCollection = async (collectionName: string) => {
    try {
      setLoading(true);
      if (window.electronAPI?.exportCollection) {
        const filePath = await window.electronAPI.exportCollection(collectionName);
        setMessage({ type: "success", text: `Exported ${collectionName} to ${filePath}` });
      }
    } catch (error) {
      console.error("Failed to export collection:", error);
      setMessage({ type: "error", text: "Failed to export collection" });
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.exportAllData) {
        const filePath = await window.electronAPI.exportAllData();
        setMessage({ type: "success", text: `Exported all data to ${filePath}` });
        loadBackups();
      }
    } catch (error) {
      console.error("Failed to export all data:", error);
      setMessage({ type: "error", text: "Failed to export all data" });
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      if (window.electronAPI?.createDatabaseBackup) {
        const backup = await window.electronAPI.createDatabaseBackup();
        setMessage({ type: "success", text: `Created backup: ${backup.id}` });
        loadBackups();
      }
    } catch (error) {
      console.error("Failed to create backup:", error);
      setMessage({ type: "error", text: "Failed to create backup" });
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (backupPath: string) => {
    if (!confirm("This will replace all current data. Are you sure?")) {
      return;
    }

    try {
      setLoading(true);
      if (window.electronAPI?.restoreBackup) {
        await window.electronAPI.restoreBackup(backupPath);
        setMessage({ type: "success", text: "Backup restored successfully" });
        loadCollections();
      }
    } catch (error) {
      console.error("Failed to restore backup:", error);
      setMessage({ type: "error", text: "Failed to restore backup" });
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return;
    }

    try {
      if (window.electronAPI?.deleteBackup) {
        await window.electronAPI.deleteBackup(backupId);
        setMessage({ type: "success", text: "Backup deleted successfully" });
        loadBackups();
      }
    } catch (error) {
      console.error("Failed to delete backup:", error);
      setMessage({ type: "error", text: "Failed to delete backup" });
    }
  };

  const openDataDirectory = async () => {
    try {
      if (window.electronAPI?.openDataDirectory) {
        await window.electronAPI.openDataDirectory();
      }
    } catch (error) {
      console.error("Failed to open data directory:", error);
    }
  };

  if (!isElectron) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Local Database Manager</h2>
        <div className="flex space-x-2">
          <Button onClick={openDataDirectory} variant="secondary" size="sm">
            Open Data Directory
          </Button>
          <Button onClick={createBackup} disabled={loading} size="sm">
            Create Backup
          </Button>
          <Button onClick={exportAllData} disabled={loading} variant="secondary" size="sm">
            Export All Data
          </Button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded ${message.type === "success" ? "bg-green-900/30 border border-green-600/50 text-green-200" : "bg-red-900/30 border border-red-600/50 text-red-200"}`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 text-gray-400 hover:text-white">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Collections</h3>
          <div className="space-y-2">
            {collections.map((collection) => (
              <div key={collection.name} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                <div>
                  <div className="font-medium">{collection.name}</div>
                  <div className="text-sm text-gray-400">{collection.count} documents</div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => loadCollectionData(collection.name)} variant="secondary" size="sm">
                    View
                  </Button>
                  <Button onClick={() => exportCollection(collection.name)} variant="secondary" size="sm">
                    Export
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Backups */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Backups</h3>
          <div className="space-y-2">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                <div>
                  <div className="font-medium">{backup.id}</div>
                  <div className="text-sm text-gray-400">
                    {new Date(backup.timestamp).toLocaleString()} • {(backup.size / 1024).toFixed(1)} KB
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => restoreBackup(backup.path)} variant="secondary" size="sm">
                    Restore
                  </Button>
                  <Button
                    onClick={() => deleteBackup(backup.id)}
                    variant="secondary"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
            {backups.length === 0 && <div className="text-gray-400 text-center py-4">No backups found</div>}
          </div>
        </div>
      </div>

      {/* Collection Data Viewer */}
      {selectedCollection && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Data: {selectedCollection}</h3>
            <Button onClick={() => setSelectedCollection("")} variant="secondary" size="sm">
              Close
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <pre className="text-sm bg-gray-900 p-4 rounded overflow-x-auto">
              {JSON.stringify(collectionData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
