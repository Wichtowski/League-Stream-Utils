"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";
import { TickerDisplay } from "@libTournament/components/ticker";
import { Tournament, Match } from "@libTournament/types";
import { Team } from "@libTeam/types";

export default function MatchTickerPage(): ReactElement {
  const params = useParams();
  const tournamentId = params.tournamentId as string;
  const matchId = params.matchId as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [team1, setTeam1] = useState<Team | null>(null);
  const [team2, setTeam2] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      try {
        setLoading(true);

        const fetchWithTimeout = async <T,>(url: string): Promise<T> => {
          const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
          }
          return (await response.json()) as T;
        };

        type TournamentResp = { tournament: Tournament };
        type MatchResp = { match: Match };
        type TeamResp = { team: Team };

        const [tournamentData, matchData] = await Promise.all([
          fetchWithTimeout<TournamentResp>(`/api/v1/tournaments/${tournamentId}`),
          fetchWithTimeout<MatchResp>(`/api/v1/matches/${matchId}`)
        ]);
        console.log("Tournament data", tournamentData);
        console.log("Match data", matchData);
        const tournamentObj = tournamentData.tournament;
        const matchObj = matchData.match;
        setTournament(tournamentObj);
        setMatch(matchObj);

        const teamFetches: Promise<void>[] = [];
        if (matchObj.blueTeamId) {
          teamFetches.push(
            fetchWithTimeout<TeamResp>(`/api/v1/teams/${matchObj.blueTeamId}`)
              .then((data) => setTeam1(data.team))
              .catch(() => {})
          );
        }
        if (matchObj.redTeamId) {
          teamFetches.push(
            fetchWithTimeout<TeamResp>(`/api/v1/teams/${matchObj.redTeamId}`)
              .then((data) => setTeam2(data.team))
              .catch(() => {})
          );
        }

        if (teamFetches.length > 0) {
          await Promise.race([
            Promise.all(teamFetches),
            new Promise((resolve) => setTimeout(resolve, 5000))
          ]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId && matchId) {
      fetchData();
    }
  }, [tournamentId, matchId]);

  if (loading || !tournament || !match || !team1 || !team2) return <></>;

  return (
    <div className="min-h-screen">
      <TickerDisplay tournament={tournament} match={match} team1={team1} team2={team2} />
    </div>
  );
}
