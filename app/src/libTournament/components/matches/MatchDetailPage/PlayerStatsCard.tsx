import React from "react";
import type { PlayerStatsDoc } from "@lib/database/models";

interface PlayerStatsCardProps {
  playerStats: PlayerStatsDoc[];
  editing: boolean;
  updatePlayerStat: (
    target: PlayerStatsDoc,
    apply: (ns: NonNullable<PlayerStatsDoc["stats"]>) => NonNullable<PlayerStatsDoc["stats"]>
  ) => void;
}

export const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerStats, editing, updatePlayerStat }) => {
  if (!playerStats || playerStats.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Player Statistics</h3>
        <div className="text-center py-8 text-gray-400">No player statistics available for this match</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Player Statistics</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-gray-300 p-2">Player</th>
              <th className="text-left text-gray-300 p-2">Champion</th>
              <th className="text-left text-gray-300 p-2">K/D/A</th>
              <th className="text-left text-gray-300 p-2">CS/min</th>
              <th className="text-left text-gray-300 p-2">Gold/min</th>
              <th className="text-left text-gray-300 p-2">Damage</th>
              <th className="text-left text-gray-300 p-2">Vision</th>
              {editing && <th className="text-right text-gray-300 p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {playerStats.map((stat) => (
              <tr key={`${stat.playerId}-${stat.gameId}-${stat.championId}`} className="border-b border-gray-700">
                <td className="text-white p-2">{stat.playerId}</td>
                <td className="text-gray-300 p-2">{stat.championName}</td>
                <td className="text-gray-300 p-2">
                  {editing ? (
                    <div className="flex space-x-1">
                      <input
                        type="number"
                        className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                        value={stat.stats?.kda?.kills ?? 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = parseInt(e.target.value || "0");
                          updatePlayerStat(stat, (ns) => ({
                            ...ns,
                            kda: { kills: v, deaths: ns.kda?.deaths ?? 0, assists: ns.kda?.assists ?? 0 }
                          }));
                        }}
                      />
                      <input
                        type="number"
                        className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                        value={stat.stats?.kda?.deaths ?? 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = parseInt(e.target.value || "0");
                          updatePlayerStat(stat, (ns) => ({
                            ...ns,
                            kda: { kills: ns.kda?.kills ?? 0, deaths: v, assists: ns.kda?.assists ?? 0 }
                          }));
                        }}
                      />
                      <input
                        type="number"
                        className="w-14 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                        value={stat.stats?.kda?.assists ?? 0}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = parseInt(e.target.value || "0");
                          updatePlayerStat(stat, (ns) => ({
                            ...ns,
                            kda: { kills: ns.kda?.kills ?? 0, deaths: ns.kda?.deaths ?? 0, assists: v }
                          }));
                        }}
                      />
                    </div>
                  ) : stat.stats?.kda ? (
                    `${stat.stats.kda.kills}/${stat.stats.kda.deaths}/${stat.stats.kda.assists}`
                  ) : (
                    "0/0/0"
                  )}
                </td>
                <td className="text-gray-300 p-2">
                  {editing ? (
                    <input
                      type="number"
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                      value={stat.stats?.csPerMinute ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = parseFloat(e.target.value || "0");
                        updatePlayerStat(stat, (ns) => ({ ...ns, csPerMinute: v }));
                      }}
                    />
                  ) : (
                    stat.stats?.csPerMinute?.toFixed(1) || "0.0"
                  )}
                </td>
                <td className="text-gray-300 p-2">
                  {editing ? (
                    <input
                      type="number"
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                      value={stat.stats?.goldPerMinute ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = parseFloat(e.target.value || "0");
                        updatePlayerStat(stat, (ns) => ({ ...ns, goldPerMinute: v }));
                      }}
                    />
                  ) : (
                    stat.stats?.goldPerMinute?.toFixed(0) || "0"
                  )}
                </td>
                <td className="text-gray-300 p-2">
                  {editing ? (
                    <input
                      type="number"
                      className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                      value={stat.stats?.damageDealt ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = parseInt(e.target.value || "0");
                        updatePlayerStat(stat, (ns) => ({ ...ns, damageDealt: v }));
                      }}
                    />
                  ) : (
                    stat.stats?.damageDealt?.toLocaleString() || "0"
                  )}
                </td>
                <td className="text-gray-300 p-2">
                  {editing ? (
                    <input
                      type="number"
                      className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white"
                      value={stat.stats?.visionScore ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const v = parseInt(e.target.value || "0");
                        updatePlayerStat(stat, (ns) => ({ ...ns, visionScore: v }));
                      }}
                    />
                  ) : (
                    stat.stats?.visionScore || "0"
                  )}
                </td>
                {editing && <td className="text-right p-2" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
