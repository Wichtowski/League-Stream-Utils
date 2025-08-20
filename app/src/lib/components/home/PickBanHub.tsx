"use client";

import React from "react";
import type { User, GameSession, SessionUrls } from "@lib/types";
import { useElectron } from "@/libElectron/contexts/ElectronContext";
import { SessionCreator, SessionList } from "./index";
import { useRouter } from "next/navigation";

interface PickBanHubProps {
  user: User;
  sessions: GameSession[];
  sessionsLoading: boolean;
  onCreateSession: () => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  newSessionUrls: SessionUrls | null;
}

export function PickBanHub({
  user,
  sessions,
  sessionsLoading,
  onCreateSession,
  onDeleteSession,
  loading,
  error,
  newSessionUrls
}: PickBanHubProps) {
  const { isElectron, useLocalData } = useElectron();
  const isLocalDataMode = isElectron && useLocalData;
  const router = useRouter();
  return (
    <div className="min-h-screen text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            onClick={() => router.push("/modules")}
          >
            Back to modules
          </button>
          <h1 className="text-4xl font-bold text-blue-400">League of Legends Pick & Ban</h1>
          {user.isAdmin && (
            <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
              {isLocalDataMode ? "Local Mode" : "Admin"}
            </span>
          )}
        </div>

        {error && <div className="bg-red-600 text-white p-4 rounded mb-6">{error}</div>}

        <SessionCreator
          user={user}
          loading={loading}
          onCreateSession={onCreateSession}
          newSessionUrls={newSessionUrls}
        />

        <SessionList
          sessions={sessions}
          sessionsLoading={sessionsLoading}
          isAdmin={user.isAdmin}
          onDeleteSession={onDeleteSession}
        />
      </div>
    </div>
  );
}
