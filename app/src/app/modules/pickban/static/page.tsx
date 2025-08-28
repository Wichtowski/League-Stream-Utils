"use client";

import { useState, useEffect, useCallback } from "react";
import type { GameSession, SessionUrls } from "@lib/types";
import { PickBanContent } from "@libPickban/components/PickBanContent";
import { useAuth } from "@lib/contexts/AuthContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { useAuthenticatedFetch } from "@lib/hooks/useAuthenticatedFetch";
import { API_BASE_URL } from "@lib/services/common/constants";
import { LoadingSpinner } from "@lib/components/common";
import { PageWrapper } from "@lib/layout";

export default function StaticPickBanPage() {
  const { setActiveModule } = useNavigation();
  const { showConfirm } = useModal();
  const { user: authUser } = useAuth();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [newSessionUrls, setNewSessionUrls] = useState<SessionUrls | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions`);

      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        throw new Error("Failed to fetch sessions");
      }
    } catch (error) {
      setError("Failed to fetch sessions");
      console.error(error);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    setActiveModule("pickban/static");
    fetchSessions();
  }, [fetchSessions, setActiveModule]);

  const createSession = async () => {
    if (!authUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "web", // Mark as web session for real-time pick/ban
          config: {
            enableLCU: false, // Disable LCU for web sessions
            mode: "realtime"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewSessionUrls({
          ...data.urls,
          sessionId: data.sessionId
        });
        await fetchSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!authUser?.isAdmin) return;

    const confirmed = await showConfirm({
      type: "danger",
      title: "Delete Session",
      message: "Are you sure you want to delete this session? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel"
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/pickban/sessions/${sessionId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        await fetchSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete session");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete session");
    }
  };

  return (
    <PageWrapper
      loading={true}
      loadingChildren={<LoadingSpinner fullscreen text="Loading Static Pick & Ban..." />}
      breadcrumbs={[
        { label: "Pick & Ban", href: "/modules/pickban" },
        { label: "Static", isActive: true }
      ]}
    >
      {authUser && (
        <PickBanContent
          user={authUser}
          sessions={sessions.filter((session) => session.type === "web" || !session.type)} // Show static or legacy sessions
          sessionsLoading={sessionsLoading}
          onCreateSession={createSession}
          onDeleteSession={deleteSession}
          loading={loading}
          error={error}
          newSessionUrls={newSessionUrls}
        />
      )}
    </PageWrapper>
  );
}
