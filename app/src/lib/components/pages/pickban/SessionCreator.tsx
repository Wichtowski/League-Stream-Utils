import type { User, SessionUrls } from '@lib/types';
import { SessionUrlDisplay } from '@lib/components/pages/pickban/SessionUrlDisplay';

interface SessionCreatorProps {
    user: User;
    loading: boolean;
    onCreateSession: () => Promise<void>;
    newSessionUrls: SessionUrls | null;
}

export function SessionCreator({ user, loading, onCreateSession, newSessionUrls }: SessionCreatorProps) {
    const canCreateMoreSessions = user.isAdmin || user.sessionsCreatedToday < 2;
    const remainingSessions = user.isAdmin ? 'Unlimited' : 2 - user.sessionsCreatedToday;

    return (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Create New Session</h2>

            {!canCreateMoreSessions && (
                <div className="bg-amber-600 text-white p-4 rounded mb-4">
                    You have reached your daily limit of 2 sessions. Limit resets at midnight.
                </div>
            )}

            <button
                onClick={onCreateSession}
                disabled={loading || !canCreateMoreSessions}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer"
            >
                {loading ? 'Creating...' : 'Create New Pick & Ban Session'}
            </button>

            {!user.isAdmin && (
                <div className="mt-3 text-sm text-gray-400">Remaining sessions today: {remainingSessions}</div>
            )}

            {newSessionUrls && <SessionUrlDisplay urls={newSessionUrls} />}
        </div>
    );
}
