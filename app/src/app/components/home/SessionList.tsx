import type { GameSession } from '@lib/types';
import Link from 'next/link';

interface SessionListProps {
    sessions: GameSession[];
    sessionsLoading: boolean;
    isAdmin: boolean;
    onDeleteSession: (sessionId: string) => Promise<void>;
}

export default function SessionList({
    sessions,
    sessionsLoading,
    isAdmin,
    onDeleteSession
}: SessionListProps) {
    return (
        <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Active Sessions</h2>
            {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                    <span className="text-gray-400">Loading sessions...</span>
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-gray-400">No active sessions</p>
            ) : (
                <div className="grid gap-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-lg">Session {session.id.slice(-8)}</h3>
                                    <div className="text-sm text-gray-400">
                                        Created: {new Date(session.lastActivity).toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        Phase: {session.phase} | Blue: {session.teams.blue.picks.length} picks | Red: {session.teams.red.picks.length} picks
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/modules/pickban/config/${session.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Config
                                    </Link>
                                    <Link
                                        href={`/modules/pickban/game/${session.id}?team=blue`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Blue Team
                                    </Link>
                                    <Link
                                        href={`/modules/pickban/game/${session.id}?team=red`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Red Team
                                    </Link>
                                    <Link
                                        href={`/modules/pickban/game/${session.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                                    >
                                        Spectator
                                    </Link>
                                    <Link
                                        href={`/modules/pickban/obs/${session.id}`}
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
                    ))}
                </div>
            )}
        </div>
    );
} 