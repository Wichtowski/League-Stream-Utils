"use client";

import React, { useState, useEffect } from "react";
import { useTournaments } from "@lib/contexts/TournamentsContext";
import { AuthGuard } from "@lib/components/AuthGuard";
import { useRouter } from "next/navigation";

interface Comentator {
  id: string;
  name: string;
  xHandle?: string;
  tournaments: string[]; // tournament IDs
}

export default function ComentatorsPage(): React.ReactElement {
  const { tournaments } = useTournaments();
  const [comentators, setComentators] = useState<Comentator[]>([]);
  const [name, setName] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  // Fetch commentators from API or Electron
  useEffect(() => {
    setLoading(true);
    const fetchComentators = async () => {
      if (typeof window !== "undefined" && window.electronAPI?.storage?.get) {
        const data = await window.electronAPI.storage.get("comentators");
        setComentators((data as Comentator[]) || []);
        setLoading(false);
      } else {
        const res = await fetch("/api/v1/comentators");
        if (res.ok) {
          const { comentators } = await res.json();
          setComentators(comentators || []);
        }
        setLoading(false);
      }
    };
    fetchComentators();
  }, []);

  // Add commentator to selected tournament
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!name || !selectedTournament) return;
    if (typeof window !== "undefined" && window.electronAPI?.storage?.set) {
      const newComentator: Comentator = {
        id: Date.now().toString(),
        name,
        xHandle: xHandle || undefined,
        tournaments: [selectedTournament],
      };
      const updated = [...comentators, newComentator];
      await window.electronAPI.storage.set("comentators", updated);
      setComentators(updated);
    } else {
      await fetch("/api/v1/comentators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, xHandle, tournamentId: selectedTournament }),
      });
      // Re-fetch
      const res = await fetch("/api/v1/comentators");
      if (res.ok) {
        const { comentators } = await res.json();
        setComentators(comentators || []);
      }
    }
    setName("");
    setXHandle("");
    setSuccessMsg("Comentator added!");
    setTimeout(() => setSuccessMsg(""), 2000);
    setLoading(false);
  };

  // Filter commentators for the selected tournament
  const filteredComentators = selectedTournament
    ? comentators.filter(c => c.tournaments.includes(selectedTournament))
    : [];

  return (
    <AuthGuard>
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/modules')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg mb-8"
        >
          ← Back to Modules
        </button>
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Comentators</h1>
        {!selectedTournament ? (
          <div>
            <h2 className="text-xl text-white mb-4 text-center">Select Tournament</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {tournaments.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournament(t.id)}
                  className="bg-gray-800 hover:bg-blue-700 text-white rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all duration-200 shadow-lg flex flex-col items-center"
                >
                  <span className="text-lg font-semibold mb-2">{t.name}</span>
                  <span className="text-gray-400 text-sm">{t.abbreviation}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{tournaments.find(t => t.id === selectedTournament)?.name}</h2>
                <div className="text-gray-400 text-sm">Tournament</div>
              </div>
              <button
                onClick={() => setSelectedTournament("")}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg"
              >
                Change
              </button>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 mb-10 shadow-lg">
              <h3 className="text-xl font-semibold text-white mb-4">Add Comentator</h3>
              <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-gray-300 mb-2">Display Name</label>
                  <input
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">x.com Handle (optional)</label>
                  <input
                    className="w-full p-2 rounded bg-gray-700 text-white"
                    value={xHandle}
                    onChange={e => setXHandle(e.target.value)}
                    placeholder="@yourhandle"
                  />
                </div>
                <button
                  type="submit"
                  className="col-span-1 sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-2"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Comentator"}
                </button>
              </form>
              {successMsg && <div className="text-green-400 mt-4">{successMsg}</div>}
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Comentators for this Tournament</h3>
            {loading ? (
              <div className="text-white">Loading...</div>
            ) : filteredComentators.length === 0 ? (
              <div className="text-gray-400">No comentators yet for this tournament.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredComentators.map(c => (
                  <div key={c.id} className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow flex flex-col gap-2">
                    <div className="text-lg font-bold text-white">{c.name}</div>
                    {c.xHandle && (
                      <a
                        href={`https://x.com/${c.xHandle.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-sm"
                      >
                        {c.xHandle}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGuard>
  );
}

