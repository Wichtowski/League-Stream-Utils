import { useState, useMemo } from "react";
import type { GameSession } from "@lib/types";
import Link from "next/link";
import { LoadingSpinner, Pagination } from "@lib/components/common";
import { TrashIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

interface SessionListProps {
  sessions: GameSession[];
  sessionsLoading: boolean;
  isAdmin: boolean;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onDeleteSelectedSessions?: (sessionIds: string[]) => Promise<void>;
}

export function SessionList({
  sessions,
  sessionsLoading,
  isAdmin,
  onDeleteSession,
  onDeleteSelectedSessions
}: SessionListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const SESSIONS_PER_PAGE = 5;

  const { paginatedSessions, totalPages } = useMemo(() => {
    // Ensure sessions is always an array
    const sessionsArray = Array.isArray(sessions) ? sessions : [];

    const sorted = [...sessionsArray].sort((a, b) => {
      const dateA = new Date(a.lastActivity).getTime();
      const dateB = new Date(b.lastActivity).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
    const endIndex = startIndex + SESSIONS_PER_PAGE;
    return {
      paginatedSessions: sorted.slice(startIndex, endIndex),
      totalPages: Math.ceil(sessionsArray.length / SESSIONS_PER_PAGE)
    };
  }, [sessions, currentPage, sortOrder]);

  const handleSessionSelect = (sessionId: string, checked: boolean) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(sessionId);
      } else {
        newSet.delete(sessionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedSessions((prev) => {
      const newSet = new Set(prev);
      paginatedSessions.forEach((session) => {
        if (checked) {
          newSet.add(session.id);
        } else {
          newSet.delete(session.id);
        }
      });
      return newSet;
    });
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteSelectedSessions || selectedSessions.size === 0) return;

    setDeleting(true);
    try {
      await onDeleteSelectedSessions(Array.from(selectedSessions));
      setSelectedSessions(new Set());
    } catch (error) {
      console.error("Failed to delete sessions:", error);
    } finally {
      setDeleting(false);
    }
  };

  const allCurrentPageSelected =
    paginatedSessions.length > 0 && paginatedSessions.every((session) => selectedSessions.has(session.id));

  const someCurrentPageSelected = paginatedSessions.some((session) => selectedSessions.has(session.id));

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(Math.max(1, totalPages));
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4 min-h-[2.5rem]">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Active Sessions</h2>
          {Array.isArray(sessions) && sessions.length > 0 && (
            <button
              onClick={() => {
                setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"));
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
            >
              {sortOrder === "newest" ? (
                <>
                  <ArrowDownIcon className="w-4 h-4" />
                  Newest First
                </>
              ) : (
                <>
                  <ArrowUpIcon className="w-4 h-4" />
                  Oldest First
                </>
              )}
            </button>
          )}
        </div>
        <div className="flex justify-end">
          {isAdmin && (
            <button
              onClick={handleDeleteSelected}
              disabled={deleting || selectedSessions.size === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg 
                transition-all duration-300 ease-in-out
                ${
                  selectedSessions.size > 0
                    ? "bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white opacity-100 scale-100 translate-x-0"
                    : "bg-red-600/0 text-transparent opacity-0 scale-95 translate-x-4 pointer-events-none"
                }
              `}
            >
              <TrashIcon className="w-4 h-4" />
              {deleting ? "Deleting..." : `Delete Selected (${selectedSessions.size})`}
            </button>
          )}
        </div>
      </div>

      {sessionsLoading ? (
        <LoadingSpinner centered text="Loading sessions..." />
      ) : !Array.isArray(sessions) || sessions.length === 0 ? (
        <p className="text-gray-400">No active sessions</p>
      ) : (
        <>
          {/* Select All Checkbox */}
          {isAdmin && Array.isArray(sessions) && sessions.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={allCurrentPageSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someCurrentPageSelected && !allCurrentPageSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm text-gray-300">Select all on this page ({paginatedSessions.length})</label>
            </div>
          )}

          {/* Sessions Grid */}
          <div className="grid gap-4 mb-6">
            {paginatedSessions.map((session) => (
              <div key={session.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  {/* Selection Checkbox */}
                  {isAdmin && (
                    <input
                      type="checkbox"
                      checked={selectedSessions.has(session.id)}
                      onChange={(e) => handleSessionSelect(session.id, e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                  )}

                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">Session {session.id.slice(-8)}</h3>
                        <div className="text-sm text-gray-400">
                          Created: {new Date(session.lastActivity).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          Phase: {session.phase} | Blue: {session.teams.blue.picks.length} picks | Red:{" "}
                          {session.teams.red.picks.length} picks
                        </div>
                      </div>

                      {/* Session Password */}
                      {session.password && (
                        <div className="mb-2">
                          <div className="text-sm text-gray-400">Password:</div>
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-800 px-2 py-1 rounded text-yellow-400 font-mono text-sm">
                              {session.password}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(session.password!);
                                // You could add a toast notification here
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                              title="Copy password"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Link
                          href={`/modules/pickban/static/${session.id}/config`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Config
                        </Link>

                        {/* Real-time team access buttons for web sessions */}
                        {session.type === "web" && (
                          <>
                            <Link
                              href={`/modules/pickban/static/${session.id}/team/blue`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Blue Team (Real-time)
                            </Link>
                            <Link
                              href={`/modules/pickban/static/${session.id}/team/red`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Red Team (Real-time)
                            </Link>
                          </>
                        )}

                        {/* Legacy buttons for non-web sessions */}
                        {session.type !== "web" && (
                          <>
                            <Link
                              href={`/modules/pickban/static/${session.id}/game?team=blue`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Blue Team
                            </Link>
                            <Link
                              href={`/modules/pickban/static/${session.id}/game?team=red`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                              Red Team
                            </Link>
                          </>
                        )}

                        <Link
                          href={`/modules/pickban/static/${session.id}/game`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Spectator
                        </Link>
                        <Link
                          href={`/modules/pickban/static/${session.id}/obs`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          OBS
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => onDeleteSession(session.id)}
                            className="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-sm transition-colors"
                            title="Delete Session (Admin Only)"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-4"
          />

          {/* Info Text */}
          {Array.isArray(sessions) && sessions.length > SESSIONS_PER_PAGE && (
            <p className="text-sm text-gray-400 text-center mt-4">
              Showing {paginatedSessions.length} of {sessions.length} sessions
            </p>
          )}
        </>
      )}
    </div>
  );
}
