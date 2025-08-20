"use client";

import { useState } from "react";
import { useModal } from "@lib/contexts/ModalContext";

interface TeamPasswordModalProps {
  sessionId: string;
  teamSide: "blue" | "red";
  onPasswordCorrect: () => void;
  onCancel: () => void;
}

export function TeamPasswordModal({ sessionId, teamSide, onPasswordCorrect, onCancel }: TeamPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showAlert } = useModal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // For now, we'll validate the password on the client side
      // In a real implementation, you'd validate against the session
      const response = await fetch(`/api/v1/pickban/sessions/${sessionId}`);
      
      if (response.ok) {
        const session = await response.json();
        
        if (session.password === password) {
          onPasswordCorrect();
          await showAlert({ type: "success", message: "Password correct! Joining session..." });
        } else {
          setError("Incorrect password");
        }
      } else {
        setError("Session not found");
      }
    } catch (_error) {
      setError("Failed to validate password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Join {teamSide === "blue" ? "Blue" : "Red"} Team
          </h2>
          <p className="text-gray-400">
            Enter the session password to join the pick/ban phase
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Session Password
            </label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Enter 6-character password"
              maxLength={6}
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || password.length !== 6}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {loading ? "Joining..." : "Join Session"}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Session ID: {sessionId.slice(-8)}
          </p>
        </div>
      </div>
    </div>
  );
}

