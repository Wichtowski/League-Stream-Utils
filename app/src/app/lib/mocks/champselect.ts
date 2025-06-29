import type { EnhancedChampSelectSession } from '@lib/types';

export const MOCK_CHAMP_SELECT_DATA: EnhancedChampSelectSession = {
    phase: 'FINALIZATION',
    timer: {
        adjustedTimeLeftInPhase: 30000,
        totalTimeInPhase: 30000,
        phase: 'FINALIZATION',
        isInfinite: false
    },
    chatDetails: {
        chatRoomName: 'mock-chat',
        chatRoomPassword: 'mock-password'
    },
    myTeam: [
        { cellId: 0, championId: 266, summonerId: 1, summonerName: 'BluePlayer1', puuid: 'mock1', isBot: false, isActingNow: false, pickTurn: 1, banTurn: 1, team: 100, playerInfo: { id: '1', name: 'BluePlayer1', role: 'TOP', profileImage: '/assets/default/player.png' }, role: 'TOP', profileImage: '/assets/default/player.png' },
        { cellId: 1, championId: 121, summonerId: 2, summonerName: 'BluePlayer2', puuid: 'mock2', isBot: false, isActingNow: false, pickTurn: 3, banTurn: 2, team: 100, playerInfo: { id: '2', name: 'BluePlayer2', role: 'JUNGLE', profileImage: '/assets/default/player.png' }, role: 'JUNGLE', profileImage: '/assets/default/player.png' },
        { cellId: 2, championId: 103, summonerId: 3, summonerName: 'BluePlayer3', puuid: 'mock3', isBot: false, isActingNow: false, pickTurn: 5, banTurn: 3, team: 100, playerInfo: { id: '3', name: 'BluePlayer3', role: 'MID', profileImage: '/assets/default/player.png' }, role: 'MID', profileImage: '/assets/default/player.png' },
        { cellId: 3, championId: 51, summonerId: 4, summonerName: 'BluePlayer4', puuid: 'mock4', isBot: false, isActingNow: false, pickTurn: 7, banTurn: 4, team: 100, playerInfo: { id: '4', name: 'BluePlayer4', role: 'ADC', profileImage: '/assets/default/player.png' }, role: 'ADC', profileImage: '/assets/default/player.png' },
        { cellId: 4, championId: 412, summonerId: 5, summonerName: 'BluePlayer5', puuid: 'mock5', isBot: false, isActingNow: false, pickTurn: 9, banTurn: 5, team: 100, playerInfo: { id: '5', name: 'BluePlayer5', role: 'SUPPORT', profileImage: '/assets/default/player.png' }, role: 'SUPPORT', profileImage: '/assets/default/player.png' }
    ],
    theirTeam: [
        { cellId: 5, championId: 86, summonerId: 6, summonerName: 'RedPlayer1', puuid: 'mock6', isBot: false, isActingNow: false, pickTurn: 2, banTurn: 6, team: 200, playerInfo: { id: '6', name: 'RedPlayer1', role: 'TOP', profileImage: '/assets/default/player.png' }, role: 'TOP', profileImage: '/assets/default/player.png' },
        { cellId: 6, championId: 64, summonerId: 7, summonerName: 'RedPlayer2', puuid: 'mock7', isBot: false, isActingNow: false, pickTurn: 4, banTurn: 7, team: 200, playerInfo: { id: '7', name: 'RedPlayer2', role: 'JUNGLE', profileImage: '/assets/default/player.png' }, role: 'JUNGLE', profileImage: '/assets/default/player.png' },
        { cellId: 7, championId: 245, summonerId: 8, summonerName: 'RedPlayer3', puuid: 'mock8', isBot: false, isActingNow: false, pickTurn: 6, banTurn: 8, team: 200, playerInfo: { id: '8', name: 'RedPlayer3', role: 'MID', profileImage: '/assets/default/player.png' }, role: 'MID', profileImage: '/assets/default/player.png' },
        { cellId: 8, championId: 22, summonerId: 9, summonerName: 'RedPlayer4', puuid: 'mock9', isBot: false, isActingNow: false, pickTurn: 8, banTurn: 9, team: 200, playerInfo: { id: '9', name: 'RedPlayer4', role: 'ADC', profileImage: '/assets/default/player.png' }, role: 'ADC', profileImage: '/assets/default/player.png' },
        { cellId: 9, championId: 201, summonerId: 10, summonerName: 'RedPlayer5', puuid: 'mock10', isBot: false, isActingNow: false, pickTurn: 10, banTurn: 10, team: 200, playerInfo: { id: '10', name: 'RedPlayer5', role: 'SUPPORT', profileImage: '/assets/default/player.png' }, role: 'SUPPORT', profileImage: '/assets/default/player.png' }
    ],
    trades: [],
    actions: [],
    bans: {
        myTeamBans: [157, 164, 516],
        theirTeamBans: [266, 121, 103]
    },
    localPlayerCellId: 0,
    isSpectating: false,
    tournamentData: {
        tournament: {
            id: '1',
            name: 'default tournament',
            logoUrl: '/assets/default-team-logo.png',
            matchInfo: {
                roundName: 'SEMIFINALS',
                matchNumber: 1,
                bestOf: 3
            }
        },
        blueTeam: {
            id: 'blue-team',
            name: 'Blue Team',
            tag: 'BLUE',
            logo: '/assets/default-team-logo.png',
            colors: {
                primary: '#3b82f6',
                secondary: '#1e40af',
                accent: '#60a5fa'
            },
            players: [
                { id: '1', name: 'BluePlayer1', role: 'TOP', profileImage: '/assets/default/player.png' },
                { id: '2', name: 'BluePlayer2', role: 'JUNGLE', profileImage: '/assets/default/player.png' },
                { id: '3', name: 'BluePlayer3', role: 'MID', profileImage: '/assets/default/player.png' },
                { id: '4', name: 'BluePlayer4', role: 'ADC', profileImage: '/assets/default/player.png' },
                { id: '5', name: 'BluePlayer5', role: 'SUPPORT', profileImage: '/assets/default/player.png' }
            ],
            coach: {
                name: 'BLUECOACH & BLUECOACH2',
                profileImage: '/assets/default-coach.png'
            }
        },
        redTeam: {
            id: 'red-team',
            name: 'Red Team',
            tag: 'RED',
            logo: '/assets/default-team-logo.png',
            colors: {
                primary: '#ef4444',
                secondary: '#dc2626',
                accent: '#f87171'
            },
            players: [
                { id: '6', name: 'RedPlayer1', role: 'TOP', profileImage: '/assets/default/player.png' },
                { id: '7', name: 'RedPlayer2', role: 'JUNGLE', profileImage: '/assets/default/player.png' },
                { id: '8', name: 'RedPlayer3', role: 'MID', profileImage: '/assets/default/player.png' },
                { id: '9', name: 'RedPlayer4', role: 'ADC', profileImage: '/assets/default/player.png' },
                { id: '10', name: 'RedPlayer5', role: 'SUPPORT', profileImage: '/assets/default/player.png' }
            ],
            coach: {
                name: 'REDCOACH',
                profileImage: '/assets/default-coach.png'
            }
        }
    }
}; 