import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getTeamWins } from "@libLeagueClient/utils/teamWins";
import { Match, Tournament, MatchStatus } from "@libTournament/types";
import { useChampions } from "@lib/contexts/ChampionContext";
import {
  usePlayerStatsData,
  usePlayerStats,
  useMatchPredictions,
  useMatchCommentators,
  useMatchTeams,
  useMatchEditing,
  useMatchGames
} from "@libTournament/hooks";
import { MatchHeader, MatchInfoCard, GameResultsCard, PlayerStatsCard, MatchSidebar, DeleteMatchModal } from "./";

interface MatchDetailPageProps {
  match: Match;
  tournament: Tournament;
}

export const MatchDetailPage: React.FC<MatchDetailPageProps> = ({ match, tournament }) => {
  const router = useRouter();
  const [currentMatch, setCurrentMatch] = useState<Match>(match);
  const { champions } = useChampions();

  const matchId = match._id;

  // Custom hooks - only fetch player stats since match and tournament are already loaded in page
  const { playerStats, setPlayerStats } = usePlayerStatsData(matchId);

  const {
    editing,
    saving,
    editData,
    setEditData,
    showDeleteModal,
    setShowDeleteModal,
    startEditing,
    cancelEditing,
    handleSave,
    handleStatusChange,
    handleDeleteMatch
  } = useMatchEditing(currentMatch);

  const { blueTeam, redTeam, handleSwapTeams } = useMatchTeams(currentMatch);

  const {
    teamsSwapped,
    getMaxGamesByFormat,
    getMinGamesByFormat,
    getTeamIdForSide,
    handleChampionPlayedChange,
    handleAddGame,
    handleUpdateGameWinner,
    handleSwapGameSides,
    handleDeleteGame
  } = useMatchGames(currentMatch, blueTeam, redTeam, match);

  const { commentators, newCommentatorId, setNewCommentatorId, assigningCommentator, handleAssignCommentator } =
    useMatchCommentators(currentMatch);

  const { predictions, submittingPrediction, submitPrediction } = useMatchPredictions(currentMatch);

  const { updatePlayerStat } = usePlayerStats(playerStats, setPlayerStats);

  // Memoized team wins calculation
  const teamWins = useMemo(() => {
    if (!currentMatch?.games || currentMatch.games.length === 0) return { team1Wins: 0, team2Wins: 0 };
    return getTeamWins(currentMatch.games);
  }, [currentMatch?.games]);


  // Handlers
  const handleSaveWithUpdate = async () => {
    const success = await handleSave();
    if (success && currentMatch) {
      setCurrentMatch(editData as Match);
    }
  };

  const handleStatusChangeWithUpdate = async (status: MatchStatus): Promise<boolean> => {
    const success = await handleStatusChange(status);
    if (success && currentMatch) {
      setCurrentMatch({ ...currentMatch, status });
    }
    return success;
  };

  const handleDeleteWithRedirect = async () => {
    const success = await handleDeleteMatch();
    if (success && currentMatch) {
      router.push(`/modules/tournaments/${tournament._id}/matches`);
    }
  };

  const handleGameUpdate = (updatedMatch: Match) => {
    setCurrentMatch(updatedMatch);
    setEditData(updatedMatch);
  };

  const handleChampionChange = (gameNumber: number, side: "blue" | "red", playerId: string, championId: number) => {
    handleChampionPlayedChange(gameNumber, side, playerId, championId, handleGameUpdate);
  };

  const handleAddGameWithUpdate = async (winnerOverride?: "blue" | "red") => {
    await handleAddGame(winnerOverride, handleGameUpdate);
  };

  const handleUpdateWinnerWithUpdate = (gameNumber: number, winner: "blue" | "red" | "ongoing") => {
    handleUpdateGameWinner(gameNumber, winner, handleGameUpdate);
  };

  const handleSwapSidesWithUpdate = (gameNumber: number) => {
    handleSwapGameSides(gameNumber, handleGameUpdate);
  };

  const handleDeleteGameWithUpdate = (gameNumber: number) => {
    handleDeleteGame(gameNumber, handleGameUpdate);
  };

  const handleSwapTeamsWithUpdate = () => {
    handleSwapTeams(handleGameUpdate);
    // The teamsSwapped state will be automatically updated when currentMatch changes
    // because the team IDs will have swapped, and the UI will reflect this
  };

  return (
    <>
      <MatchHeader
        editing={editing}
        saving={saving}
        onStartEditing={startEditing}
        onCancelEditing={cancelEditing}
        onSave={handleSaveWithUpdate}
        onShowDeleteModal={() => setShowDeleteModal(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Match Info */}
        <div className="lg:col-span-2 space-y-6">
          <MatchInfoCard match={currentMatch} editing={editing} editData={editData} onEditDataChange={setEditData} />

          <GameResultsCard
            match={currentMatch}
            editing={editing}
            saving={saving}
            blueTeam={blueTeam}
            redTeam={redTeam}
            champions={champions}
            teamsSwapped={teamsSwapped}
            onSwapTeams={handleSwapTeamsWithUpdate}
            onAddGame={handleAddGameWithUpdate}
            onUpdateGameWinner={handleUpdateWinnerWithUpdate}
            onSwapGameSides={handleSwapSidesWithUpdate}
            onDeleteGame={handleDeleteGameWithUpdate}
            onChampionPlayedChange={handleChampionChange}
            getTeamIdForSide={getTeamIdForSide}
            getMaxGamesByFormat={getMaxGamesByFormat}
            getMinGamesByFormat={getMinGamesByFormat}
            teamWins={teamWins}
          />

          <PlayerStatsCard playerStats={playerStats} editing={editing} updatePlayerStat={updatePlayerStat} />
        </div>

        {/* Sidebar */}
        <MatchSidebar
          match={currentMatch}
          editing={editing}
          saving={saving}
          blueTeam={blueTeam}
          redTeam={redTeam}
          teamWins={teamWins}
          commentators={commentators}
          newCommentatorId={newCommentatorId}
          assigningCommentator={assigningCommentator}
          predictions={predictions}
          submittingPrediction={submittingPrediction}
          onStatusChange={handleStatusChangeWithUpdate}
          onSwapTeams={handleSwapTeamsWithUpdate}
          onNewCommentatorIdChange={setNewCommentatorId}
          onAssignCommentator={handleAssignCommentator}
          onSubmitPrediction={submitPrediction}
        />
      </div>

      <DeleteMatchModal
        show={showDeleteModal}
        saving={saving}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteWithRedirect}
      />
    </>
  );
};
