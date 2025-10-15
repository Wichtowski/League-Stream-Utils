"use client";

import React, { useState, useEffect } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";

const TestAPIPage: React.FC = () => {
  const { setActiveModule } = useNavigation();
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);

  const testGameAPI = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/game");
      const data = await response.json();
      
      if (response.ok) {
        setGameData(data);
        console.log("Game API Response:", data);
      } else {
        setError(`API Error: ${response.status} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">League Client API Test</h1>
        
        <div className="space-y-4">
          <button
            onClick={testGameAPI}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
          >
            {loading ? "Testing..." : "Test /api/game Endpoint"}
          </button>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg">
              <h3 className="font-bold text-red-400">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          {gameData && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded-lg">
              <h3 className="font-bold text-green-400 mb-2">API Response:</h3>
              <pre className="text-xs overflow-auto max-h-96 bg-black/50 p-3 rounded">
                {JSON.stringify(gameData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>This page tests the /api/game endpoint to see what data is being returned.</p>
          <p>If you're getting data but nothing displays in the main game view, check the console for errors.</p>
        </div>
      </div>
    </div>
  );
};

export default TestAPIPage;
