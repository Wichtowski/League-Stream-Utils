'use client';

import type { User, GameSession, SessionUrls } from '@lib/types';
import { useElectron } from '@lib/contexts/ElectronContext';
import { SessionCreator, SessionList } from './index';

interface AuthenticatedHomeProps {
    user: User;
    sessions: GameSession[];
    sessionsLoading: boolean;
    onLogout: () => void;
    onCreateSession: () => Promise<void>;
    onDeleteSession: (sessionId: string) => Promise<void>;
    loading: boolean;
    error: string | null;
    newSessionUrls: SessionUrls | null;
}

export function AuthenticatedHome({
    user,
    sessions,
    sessionsLoading,
    onLogout,
    onCreateSession,
    onDeleteSession,
    loading,
    error,
    newSessionUrls,
}: AuthenticatedHomeProps) {
    const { isElectron, useLocalData, setUseLocalData } = useElectron();
    const isLocalDataMode = isElectron && useLocalData;
    return (
        <div className="min-h-screen text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-blue-400">
                            League of Legends Pick & Ban
                        </h1>
                        <div className="mt-2 flex items-center gap-4">
                            {isLocalDataMode ? (
                                <> </>
                            ) : (
                                <span className="text-lg">
                                    Welcome, {user.username}
                                </span>
                            )}
                            {user.isAdmin && (
                                <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm">
                                    {isLocalDataMode ? 'Local Mode' : 'Admin'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-gray-400">Sessions today:</div>
                            <div className="text-lg font-semibold">
                                {user.isAdmin ? 'Unlimited' : `${user.sessionsCreatedToday} / 2`}
                            </div>
                        </div>
                        {isLocalDataMode ? (
                            <button
                                onClick={() => setUseLocalData(false)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                Switch to Server Mode
                            </button>
                        ) : (
                            <button
                                onClick={onLogout}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                            >
                                Logout
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-600 text-white p-4 rounded mb-6">
                        {error}
                    </div>
                )}

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