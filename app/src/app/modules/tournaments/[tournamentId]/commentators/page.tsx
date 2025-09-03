"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTournaments } from "@libTournament/contexts/TournamentsContext";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useModal } from "@lib/contexts/ModalContext";
import { LoadingSpinner } from "@lib/components/common";
import { tournamentStorage, LastSelectedTournament } from "@lib/services/tournament";
import type { Tournament } from "@lib/types/tournament";
import { PageWrapper } from "@lib/layout";

interface Commentator {
  id: string;
  name: string;
  xHandle?: string;
  tournaments: string[]; // tournament IDs
}

export default function CommentatorsPage(): React.ReactElement {
  const router = useRouter();
  const { tournaments, loading: tournamentsLoading } = useTournaments();
  const { setActiveModule } = useNavigation();
  const { showAlert } = useModal();
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [name, setName] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastSelectedTournament, setLastSelectedTournament] = useState<LastSelectedTournament | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);

  useEffect(() => {
    setActiveModule("commentators");
  }, [setActiveModule]);

  useEffect(() => {
    const loadLastSelectedTournament = async () => {
      try {
        const lastSelected = await tournamentStorage.getLastSelectedTournament();
        if (lastSelected) {
          setLastSelectedTournament(lastSelected);
        } else {
          await showAlert({
            type: "error",
            message: "No tournament selected. Please select a tournament first."
          });
          router.push("/modules/tournaments");
        }
      } catch (_error) {
        await showAlert({
          type: "error",
          message: "Failed to load tournament selection."
        });
        router.push("/modules/tournaments");
      }
    };

    loadLastSelectedTournament();
  }, [router, showAlert]);

  useEffect(() => {
    if (!tournamentsLoading && lastSelectedTournament) {
      const foundTournament = tournaments.find((t) => t._id === lastSelectedTournament.tournamentId);
      if (foundTournament) {
        setTournament(foundTournament);
      } else if (tournaments.length > 0) {
        router.push("/modules/tournaments");
      }
    }
  }, [tournaments, tournamentsLoading, lastSelectedTournament, router]);

  // Fetch commentators from API or Electron
  useEffect(() => {
    if (!lastSelectedTournament) return;

    setLoading(true);
    const fetchCommentators = async () => {
      if (typeof window !== "undefined" && window.electronAPI?.storage?.get) {
        const data = await window.electronAPI.storage.get("comentators");
        setCommentators((data as Commentator[]) || []);
        setLoading(false);
      } else {
        const res = await fetch("/api/v1/comentators");
        if (res.ok) {
          const { comentators } = await res.json();
          setCommentators(comentators || []);
        }
        setLoading(false);
      }
    };
    fetchCommentators();
  }, [lastSelectedTournament]);

  // Add commentator to selected tournament
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastSelectedTournament || !name) return;

    setLoading(true);
    if (typeof window !== "undefined" && window.electronAPI?.storage?.set) {
      const newCommentator: Commentator = {
        id: Date.now().toString(),
        name,
        xHandle: xHandle || undefined,
        tournaments: [lastSelectedTournament.tournamentId]
      };
      const updated = [...commentators, newCommentator];
      await window.electronAPI.storage.set("comentators", updated);
      setCommentators(updated);
    } else {
      await fetch("/api/v1/comentators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          xHandle,
          tournamentId: lastSelectedTournament.tournamentId
        })
      });
      // Re-fetch
      const res = await fetch("/api/v1/comentators");
      if (res.ok) {
        const { comentators } = await res.json();
        setCommentators(comentators || []);
      }
    }
    setName("");
    setXHandle("");
    setSuccessMsg("Commentator added!");
    setTimeout(() => setSuccessMsg(""), 2000);
    setLoading(false);
  };

  // Filter commentators for the selected tournament
  const filteredCommentators = lastSelectedTournament
    ? commentators.filter((c) => c.tournaments.includes(lastSelectedTournament.tournamentId))
    : [];

  if (loading || tournamentsLoading) {
    return (
      <PageWrapper>
        <LoadingSpinner fullscreen text="Loading commentators..." />
      </PageWrapper>
    );
  }

  if (!tournament || !lastSelectedTournament) {
    return (
      <PageWrapper title="Tournament Not Found">
        <div className="text-center">
          <p>The tournament you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
          <button
            onClick={() => router.push("/modules/tournaments")}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Select Tournament
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Commentators"
      subtitle={`${tournament.name} (${tournament.abbreviation})`}
      actions={
        <button
          onClick={() => router.push("/modules/tournaments")}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Change Tournament
        </button>
      }
      contentClassName="max-w-3xl mx-auto"
    >
      <div className="bg-gray-900 rounded-xl p-6 mb-10 shadow-lg">
        <h3 className="text-xl font-semibold text-white mb-4">Add Commentator</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-gray-300 mb-2">Display Name</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2">x.com Handle (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-700 text-white"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              placeholder="@yourhandle"
            />
          </div>
          <button
            type="submit"
            className="col-span-1 sm:col-span-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mt-2"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Commentator"}
          </button>
        </form>
        {successMsg && <div className="text-green-400 mt-4">{successMsg}</div>}
      </div>

      <h3 className="text-xl font-semibold text-white mb-4">Commentators for this Tournament</h3>
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : filteredCommentators.length === 0 ? (
        <div className="text-gray-400">No commentators yet for this tournament.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredCommentators.map((c) => (
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
    </PageWrapper>
  );
}
