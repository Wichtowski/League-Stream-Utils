'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useNavigation } from '@lib/contexts/NavigationContext';
import { useCameras } from '@lib/contexts/CamerasContext';
import { AuthGuard } from '@lib/components/AuthGuard';
import { LoadingSpinner } from '@components/common';
import type { CameraTeam } from '@lib/types/camera';
import { Accordion, AccordionItem } from '@components/common/Accordion';

export default function AllCamerasPage() {
    const router = useRouter();
    const { setActiveModule } = useNavigation();
    const { teams, loading: teamsLoading } = useCameras();
    const [openTeamId, setOpenTeamId] = useState<string | null>(null);
    const [teamData, setTeamData] = useState<Record<string, CameraTeam | null>>({});
    const [loadingTeams, setLoadingTeams] = useState<Set<string>>(new Set());
    const [streamErrors, setStreamErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        setActiveModule('cameras');
    }, [setActiveModule]);

    const handleAccordionToggle = async (teamId: string) => {
        if (openTeamId === teamId) {
            setOpenTeamId(null);
            return;
        }
        setOpenTeamId(teamId);
        if (!teamData[teamId]) {
            setLoadingTeams(prev => new Set(prev).add(teamId));
            try {
                const res = await fetch(`/api/v1/cameras/settings?teamId=${teamId}`);
                const data = await res.json();
                setTeamData(prev => ({ ...prev, [teamId]: data.teams?.[0] || null }));
            } catch {
                setTeamData(prev => ({ ...prev, [teamId]: null }));
            } finally {
                setLoadingTeams(prev => { const s = new Set(prev); s.delete(teamId); return s; });
            }
        }
    };

    const handleStreamError = (playerName: string) => {
        setStreamErrors(prev => new Set([...prev, playerName]));
    };

    if (teamsLoading) {
        return (
            <AuthGuard loadingMessage="Loading cameras...">
                <LoadingSpinner fullscreen text="Loading cameras..." />
            </AuthGuard>
        );
    }

    if (!teams.length) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">No Teams Configured</h2>
                    <p className="text-gray-400 mb-6">Set up your camera configurations first.</p>
                    <button
                        onClick={() => router.push('/modules/cameras')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                        Configure Cameras
                    </button>
                </div>
            </div>
        );
    }

    const accordionItems: AccordionItem[] = teams.map(team => ({
        id: team.id,
        header: (
            <div className="flex items-center gap-4">
                {(team.logo.type === 'url' && team.logo.url) ? (
                    <Image src={team.logo.url} alt={team.name} width={40} height={40} className="rounded-full object-cover" />
                ) : (team.logo.type === 'upload' && team.logo.data) ? (
                    <Image src={team.logo.data} alt={team.name} width={40} height={40} className="rounded-full object-cover" />
                ) : null}
                <span className="text-xl font-bold text-white">{team.name}</span>
            </div>
        ),
        renderContent: () => (
            loadingTeams.has(team.id) ? (
                <div className="flex justify-center py-8"><LoadingSpinner size="md" variant="white" /></div>
            ) : teamData[team.id] && teamData[team.id]?.players?.length ? (
                <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-fr`}>
                    {teamData[team.id]!.players.map((player, index) => (
                        <div
                            key={player.playerId || player.inGameName || player.playerName || index}
                            className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                        >
                            <div className="bg-gray-700 px-3 py-2 border-b border-gray-600">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold text-white text-sm">{player.inGameName || player.playerName}</h3>
                                        <p className="text-xs text-gray-400">{team.name} • {player.role}</p>
                                    </div>
                                    <div className="text-xs text-gray-500">#{player.playerId || player.inGameName || player.playerName || index}</div>
                                </div>
                            </div>
                            <div className="relative aspect-video bg-gray-800">
                                {player.imagePath && !streamErrors.has(player.inGameName || player.playerName || '') ? (
                                    <iframe
                                        src={player.imagePath}
                                        className="w-full h-full"
                                        allow="autoplay; fullscreen"
                                        onError={() => handleStreamError(player.inGameName || player.playerName || '')}
                                        title={`${player.inGameName || player.playerName} camera feed`}
                                    />
                                ) : player.imagePath ? (
                                    <Image
                                        src={player.imagePath}
                                        alt={player.inGameName || player.playerName || 'Player'}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                        <div className="text-center text-gray-400">
                                            <div className="text-2xl mb-2">📹</div>
                                            <p className="text-sm">No feed</p>
                                        </div>
                                    </div>
                                )}
                                {streamErrors.has(player.inGameName || player.playerName || '') && (
                                    <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                                        <div className="text-center text-white">
                                            <div className="text-xl mb-1">⚠️</div>
                                            <p className="text-sm">Stream Error</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-400 py-8">No camera players configured for this team.</div>
            )
        )
    }));

    return (
        <AuthGuard loadingMessage="Loading cameras...">
            <div className="min-h-screen p-4">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">All Cameras</h1>
                            <p className="text-gray-400">
                                {teams.length} team{teams.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/modules/cameras')}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Setup
                            </button>
                        </div>
                    </div>
                </div>

                {/* Team Accordions */}
                <Accordion items={accordionItems} openId={openTeamId} onToggle={handleAccordionToggle} />

                {/* Footer Info */}
                <div className="mt-6 text-center text-gray-400 text-sm">
                    <p>Open a team to view its cameras. Use number keys (1-9) in single view to switch between cameras</p>
                </div>
            </div>
        </AuthGuard>
    );
} 