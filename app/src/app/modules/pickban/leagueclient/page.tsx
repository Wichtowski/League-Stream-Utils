'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useAuth } from '@lib/contexts/AuthContext';
import { useLCU } from '@lib/contexts/LCUContext';
import { useMockDataContext } from '@lib/contexts/MockDataContext';
import { getChampionById } from '@lib/champions';
import { useElectron } from '@lib/contexts/ElectronContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageWrapper } from '@lib/layout/PageWrapper';

let userDataPathCache: string | null = null;
if (typeof window !== 'undefined' && window.electronAPI?.getUserDataPath) {
    window.electronAPI
        .getUserDataPath()
        .then((p) => {
            userDataPathCache = p;
        })
        .catch(() => {
            userDataPathCache = null;
        });
}

export default function LeagueClientPickBanPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const { user: _user, isLoading: _authLoading } = useAuth();
    const { isElectron } = useElectron();
    const { useMockData, toggleMockData } = useMockDataContext();

    const {
        isConnected,
        isConnecting,
        connectionError,
        connect,
        disconnect,
        champSelectSession,
        autoReconnect,
        setAutoReconnect
    } = useLCU();

    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setActiveModule('leagueclient');
    }, [setActiveModule]);

    const connectToLCU = async (): Promise<void> => {
        if (!isElectron) {
            return;
        }

        if (useMockData) {
            setSuccessMessage('Mock data enabled - no LCU connection needed');
            setTimeout(() => setSuccessMessage(null), 3000);
            return;
        }

        setSuccessMessage(null);
        await connect();
    };

    const disconnectFromLCU = (): void => {
        disconnect();
    };

    const formatTime = (ms: number) => {
        const seconds = Math.ceil(ms / 1000);
        return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
    };

    const getChampionName = (championId: number) => {
        if (!championId) return 'None';
        const champion = getChampionById(championId);
        return champion?.name || `Champion ${championId}`;
    };

    const getChampionImage = (championId: number): string | null => {
        if (!championId) return null;
        const champion = getChampionById(championId);
        if (!champion?.image) return null;

        if (/^https?:\/\//.test(champion.image)) return champion.image;

        if (champion.image.startsWith('cache/')) {
            if (userDataPathCache) {
                const base = userDataPathCache.replace(/\\/g, '/');
                const rel = champion.image.replace(/\\/g, '/');
                return `file://${base}/assets/${rel}`;
            }
            return champion.image;
        }

        // Convert DataDragon URL to local cache path
        const ddragonMatch = champion.image.match(/\/cdn\/([^/]+)\/img\/champion\/([^.]+)\.png$/);
        if (ddragonMatch) {
            const [, version, key] = ddragonMatch;
            if (userDataPathCache) {
                const base = userDataPathCache.replace(/\\/g, '/');
                const rel = `cache/game/${version}/champion/${key}/square.png`;
                return `file://${base}/assets/${rel}`;
            }
            return `cache/game/${ddragonMatch[1]}/champion/${ddragonMatch[2]}/loading.png`;
        }

        return champion.image;
    };

    // Redirect to modules if not in Electron
    useEffect(() => {
        if (!isElectron) {
            router.push('/modules');
        }
    }, [isElectron, router]);

    const renderConnectionStatus = () => {
        const getStatusColor = () => {
            if (useMockData) return 'bg-purple-600';
            if (isConnected) return 'bg-green-600';
            if (isConnecting) return 'bg-yellow-600';
            return 'bg-red-600';
        };

        const getStatusText = () => {
            if (useMockData) return 'Mock Mode';
            if (isConnected) return 'Connected';
            if (isConnecting) return 'Connecting...';
            return 'Disconnected';
        };

        return (
            <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
                        <span className="font-medium">League Client Status</span>
                        <span className="text-gray-400">{getStatusText()}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={autoReconnect}
                                onChange={(e) => setAutoReconnect(e.target.checked)}
                                disabled={useMockData}
                                className="cursor-pointer rounded"
                            />
                            <span className={`cursor-pointer text-sm ${useMockData ? 'text-gray-500' : ''}`}>
                                Auto-reconnect
                            </span>
                        </label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={useMockData}
                                onChange={(e) => toggleMockData(e.target.checked)}
                            />
                            {/* Track */}
                            <div className="w-11 h-6 bg-gray-600 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white" />
                            <span className="ml-3 text-sm select-none">Mock Data</span>
                        </label>
                        {useMockData ? (
                            <div className="text-purple-400 text-sm font-medium">🎭 Mock Mode Active</div>
                        ) : !isConnected && !isConnecting ? (
                            <button
                                onClick={connectToLCU}
                                className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Connect to League
                            </button>
                        ) : (
                            <button
                                onClick={disconnectFromLCU}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Disconnect
                            </button>
                        )}
                    </div>
                </div>

                {/* Overlay Navigation */}
                <div className="border-t border-gray-600 pt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-white mb-1">Tournament Overlay</h4>
                            <p className="text-sm text-gray-400">
                                {useMockData
                                    ? 'Professional esports-style overlay with mock data'
                                    : 'Professional esports-style champion select overlay'}
                            </p>
                            {useMockData && (
                                <p className="text-xs text-purple-400 mt-1">
                                    🎭 Using mock data - no LCU connection required
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href={
                                    useMockData
                                        ? `/modules/pickban/leagueclient/champselect?backend=http://localhost:2137/api/cs&mock=true`
                                        : `/modules/pickban/leagueclient/champselect?backend=http://localhost:2137/api/cs`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <span>🎥</span>
                                Open Overlay
                            </Link>
                            <button
                                onClick={() => {
                                    const overlayUrl =
                                        window.location.origin +
                                        (useMockData
                                            ? `/modules/pickban/leagueclient/champselect?backend=http://localhost:2137/api/cs&mock=true`
                                            : `/modules/pickban/leagueclient/champselect?backend=http://localhost:2137/api/cs`);
                                    navigator.clipboard.writeText(overlayUrl);
                                    setSuccessMessage('Overlay URL copied to clipboard!');
                                    setTimeout(() => setSuccessMessage(null), 3000);
                                }}
                                className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                            >
                                <span>📋</span>
                                Copy URL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderChampSelectInterface = () => {
        if (!champSelectSession) {
            return (
                <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">Waiting for champion select to begin...</div>
                    <div className="text-sm text-gray-500">
                        Start a game in League of Legends to see live pick & ban data
                    </div>
                </div>
            );
        }

        const { phase, timer, myTeam, theirTeam, bans, actions } = champSelectSession;
        const currentAction = actions?.flat().find((action) => action.isInProgress);

        return (
            <div className="space-y-6">
                {/* Phase and Timer */}
                <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold">Champion Select</h3>
                        <div className="text-right">
                            <div className="text-xl font-mono text-white">
                                {timer?.isInfinite ? '∞' : formatTime(timer?.adjustedTimeLeftInPhase || 0)}
                            </div>
                            <div className="text-sm text-gray-400 capitalize">
                                {phase ? phase.replace(/([A-Z])/g, ' $1').trim() : 'Unknown Phase'}
                            </div>
                        </div>
                    </div>

                    {currentAction && (
                        <div className="bg-yellow-600/20 border border-yellow-600 rounded p-2 text-yellow-400 text-sm">
                            Player {currentAction.actorCellId + 1} is{' '}
                            {currentAction.type === 'ban' ? 'banning' : 'picking'} a champion
                        </div>
                    )}
                </div>

                {/* Teams */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Your Team */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-blue-400 font-semibold mb-4">Your Team</h3>

                        {/* Team Bans */}
                        <div className="mb-4">
                            <h4 className="text-sm text-gray-300 mb-2">Bans</h4>
                            <div className="grid grid-cols-5 gap-1">
                                {Array.from({ length: 5 }, (_, i) => {
                                    const championId = bans?.myTeamBans?.[i];
                                    const image = getChampionImage(championId);

                                    return (
                                        <div
                                            key={i}
                                            className="aspect-square bg-gray-800 rounded border-2 border-gray-600 overflow-hidden relative"
                                        >
                                            {image ? (
                                                <>
                                                    <Image
                                                        src={image}
                                                        alt={getChampionName(championId)}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">X</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                    Ban {i + 1}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Team Players */}
                        <div className="space-y-2">
                            {myTeam?.map((player) => {
                                const image = getChampionImage(player.championId);

                                return (
                                    <div
                                        key={player.cellId}
                                        className={`flex items-center bg-blue-900/30 rounded p-2 ${
                                            player.isActingNow ? 'ring-2 ring-yellow-400' : ''
                                        }`}
                                    >
                                        <div className="w-12 h-12 bg-gray-700 rounded border-left-2 border-blue-400 overflow-hidden mr-3">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt={getChampionName(player.championId)}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                    {player.cellId + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">
                                                {player.summonerName || `Player ${player.cellId + 1}`}
                                            </div>
                                            <div className="text-blue-300 text-sm">
                                                {getChampionName(player.championId)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Enemy Team */}
                    <div className="bg-gray-700 rounded-lg p-4">
                        <h3 className="text-red-400 font-semibold mb-4">Enemy Team</h3>

                        {/* Enemy Team Bans */}
                        <div className="mb-4">
                            <h4 className="text-sm text-gray-300 mb-2">Bans</h4>
                            <div className="grid grid-cols-5 gap-1">
                                {Array.from({ length: 5 }, (_, i) => {
                                    const championId = bans?.theirTeamBans?.[i];
                                    const image = getChampionImage(championId);

                                    return (
                                        <div
                                            key={i}
                                            className="aspect-square bg-gray-800 rounded border-2 border-gray-600 overflow-hidden relative"
                                        >
                                            {image ? (
                                                <>
                                                    <Image
                                                        src={image}
                                                        alt={getChampionName(championId)}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-red-600/70 flex items-center justify-center">
                                                        <span className="text-white text-xs font-bold">X</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                    Ban {i + 1}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Enemy Team Players */}
                        <div className="space-y-2">
                            {theirTeam?.map((player) => {
                                const image = getChampionImage(player.championId);

                                return (
                                    <div
                                        key={player.cellId}
                                        className={`flex items-center bg-red-900/30 rounded p-2 ${
                                            player.isActingNow ? 'ring-2 ring-yellow-400' : ''
                                        }`}
                                    >
                                        <div className="w-12 h-12 bg-gray-700 rounded border-2 border-red-400 overflow-hidden mr-3">
                                            {image ? (
                                                <Image
                                                    src={image}
                                                    alt={getChampionName(player.championId)}
                                                    width={48}
                                                    height={48}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                    {player.cellId + 1}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">
                                                {player.summonerName || `Player ${player.cellId + 1}`}
                                            </div>
                                            <div className="text-red-300 text-sm">
                                                {getChampionName(player.championId)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <PageWrapper
            title="League Client Integration"
            breadcrumbs={[
                { label: 'Pick & Ban', href: '/modules/pickban', isActive: false },
                { label: 'League Client', href: '/modules/pickban/leagueclient', isActive: true }
            ]}
            subtitle="Real-time champion select monitoring and integration with League of Legends client. This feature is only available in the desktop app."
        >
            {connectionError && (
                <div className="bg-red-600/20 border border-red-600 rounded-lg p-4 mb-6">
                    <p className="text-red-400">{connectionError}</p>
                </div>
            )}

            {successMessage && (
                <div className="bg-green-600/20 border border-green-600 rounded-lg p-4 mb-6">
                    <p className="text-green-400">{successMessage}</p>
                </div>
            )}

            {renderConnectionStatus()}
            {renderChampSelectInterface()}
        </PageWrapper>
    );
}
