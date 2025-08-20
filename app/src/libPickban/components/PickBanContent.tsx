"use client";

import React from "react";
import type { User, GameSession, SessionUrls } from "@lib/types";
import { SessionCreator } from "./SessionCreator";
import { SessionList } from "./SessionList";

interface PickBanContentProps {
  user: User;
  sessions: GameSession[];
  sessionsLoading: boolean;
  onCreateSession: () => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  newSessionUrls: SessionUrls | null;
}

export function PickBanContent({
  user,
  sessions,
  sessionsLoading,
  onCreateSession,
  onDeleteSession,
  loading,
  error,
  newSessionUrls
}: PickBanContentProps) {
  return (
    <>
      {/* Error Display */}
      {error && <div className="bg-red-600 text-white p-4 rounded mb-6">{error}</div>}

      {/* Content */}
      <SessionCreator user={user} loading={loading} onCreateSession={onCreateSession} newSessionUrls={newSessionUrls} />

      <SessionList
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        isAdmin={user.isAdmin}
        onDeleteSession={onDeleteSession}
      />
    </>
  );
}
