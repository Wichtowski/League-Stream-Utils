'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Player = {
  name: string;
  url: string;
  imagePath: string;
};

type Team = {
  name: string;
  imagePath: string;
  players: Player[];
};

type SavedTeam = {
  name: string;
  imagePath: string;
  players: Array<{
    name: string;
    imagePath: string;
  }>;
};

export default function Setup() {
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([
    { name: "", imagePath: "", players: Array(5).fill({ name: "", url: "", imagePath: "" }) },
    { name: "", imagePath: "", players: Array(5).fill({ name: "", url: "", imagePath: "" }) }
  ]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>(["", ""]);

  useEffect(() => {
    // Load saved teams on mount
    fetch('/teams.json')
      .then(res => res.json())
      .catch(() => []) // If file doesn't exist yet, use empty array
      .then(data => {
        if (Array.isArray(data)) {
          setSavedTeams(data);
        }
      });
  }, []);

  const handleTeamSelect = (teamName: string, teamIndex: number) => {
    const selected = savedTeams.find(team => team.name === teamName);
    if (selected) {
      const newSelectedTeams = [...selectedTeams];
      newSelectedTeams[teamIndex] = teamName;
      setSelectedTeams(newSelectedTeams);

      const updatedTeams = [...teams];
      updatedTeams[teamIndex] = {
        name: selected.name,
        imagePath: selected.imagePath,
        players: selected.players.map(player => ({
          name: player.name,
          imagePath: player.imagePath,
          url: "" // Reset URL as it's not saved
        }))
      };
      setTeams(updatedTeams);
    }
  };

  const handleTeamImageChange = async (index: number, file: File) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'team');
    formData.append('index', index.toString());
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const { path } = await response.json();
        const updated = [...teams];
        updated[index].imagePath = path;
        setTeams(updated);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handlePlayerImageChange = async (teamIndex: number, playerIndex: number, file: File) => {
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'player');
    formData.append('teamIndex', teamIndex.toString());
    formData.append('playerIndex', playerIndex.toString());
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const { path } = await response.json();
        const updated = [...teams];
        updated[teamIndex].players[playerIndex] = {
          ...updated[teamIndex].players[playerIndex],
          imagePath: path
        };
        setTeams(updated);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handlePlayerChange = (
    teamIndex: number,
    playerIndex: number,
    field: keyof Player,
    value: string
  ) => {
    const updated = [...teams];
    updated[teamIndex].players[playerIndex] = {
      ...updated[teamIndex].players[playerIndex],
      [field]: value
    };
    setTeams(updated);
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/saveTeams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teams)
      });

      if (response.ok) {
        router.push('/stream?view=team1');
      } else {
        console.error('Failed to save teams');
      }
    } catch (error) {
      console.error('Error saving teams:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse">
            Team Stream Setup
          </h1>
          <p className="text-gray-400 text-xl">Configure your team streams for the tournament</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map((team, tIdx) => (
            <div 
              key={tIdx} 
              className="bg-gray-800/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 hover:shadow-purple-500/20"
            >
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-white">Team {tIdx + 1}</h2>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-gray-600/50 shadow-lg">
                    <span className="text-2xl font-bold text-white">{tIdx + 1}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Load Saved Team</label>
                  <select
                    value={selectedTeams[tIdx]}
                    onChange={(e) => handleTeamSelect(e.target.value, tIdx)}
                    className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                  >
                    <option value="">Select a team...</option>
                    {savedTeams.map((savedTeam, index) => (
                      <option key={index} value={savedTeam.name}>
                        {savedTeam.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <label className="block text-gray-400 text-sm mb-2 font-medium">Team Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleTeamImageChange(tIdx, e.target.files[0])}
                    className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-gray-700/40"
                  />
                  {team.imagePath && (
                    <div className="mt-2">
                      <img 
                        src={team.imagePath} 
                        alt="Team preview" 
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                {team.players.map((player, pIdx) => (
                  <div 
                    key={pIdx} 
                    className="bg-gray-700/20 rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/30 transition-all duration-300 hover:bg-gray-700/30"
                  >
                    <h3 className="text-xl font-medium text-gray-300 mb-4 flex items-center">
                      <span className="w-10 h-10 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-lg mr-3 shadow-md">
                        {pIdx + 1}
                      </span>
                      Player {pIdx + 1}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-400 text-sm mb-2 font-medium">Name</label>
                        <input
                          type="text"
                          value={player.name}
                          onChange={(e) => handlePlayerChange(tIdx, pIdx, "name", e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-gray-700/40"
                          placeholder="Player Name"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2 font-medium">Stream URL</label>
                        <input
                          type="text"
                          value={player.url}
                          onChange={(e) => handlePlayerChange(tIdx, pIdx, "url", e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-gray-700/40"
                          placeholder="Stream URL"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-sm mb-2 font-medium">Fallback Image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handlePlayerImageChange(tIdx, pIdx, e.target.files[0])}
                          className="w-full px-4 py-3 bg-gray-700/30 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all hover:bg-gray-700/40"
                        />
                        {player.imagePath && (
                          <div className="mt-2">
                            <img 
                              src={player.imagePath} 
                              alt="Player preview" 
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-4 px-12 rounded-xl shadow-lg transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-lg hover:shadow-purple-500/30"
          >
            Save & View First Team
          </button>
        </div>
      </div>
    </div>
  );
}
