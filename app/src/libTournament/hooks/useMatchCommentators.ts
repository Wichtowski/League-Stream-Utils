import { useState, useEffect } from "react";
import { Match } from "@libTournament/types";
import { Commentator } from "@libTournament/types";

export const useMatchCommentators = (match: Match | null) => {
  const [commentators, setCommentators] = useState<Commentator[]>([]);
  const [newCommentatorId, setNewCommentatorId] = useState("");
  const [assigningCommentator, setAssigningCommentator] = useState(false);

  useEffect(() => {
    const loadCommentators = async () => {
      if (!match) return;
      try {
        const res = await fetch(`/api/v1/matches/${match._id}/commentators`);
        if (res.ok) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCommentators((data.commentators || []).map((c: any) => ({ id: c.id || c._id, name: c.name })));
        }
      } catch (_e) {
        // noop
      }
    };
    loadCommentators();
  }, [match]);

  const handleAssignCommentator = async (): Promise<boolean> => {
    if (!match || !newCommentatorId) return false;
    try {
      setAssigningCommentator(true);
      const res = await fetch(`/api/v1/matches/${match._id}/commentators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentatorId: newCommentatorId, matchId: match._id })
      });
      if (res.ok) {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCommentators((data.commentators || []).map((c: any) => ({ id: c.id || c._id, name: c.name })));
        setNewCommentatorId("");
        return true;
      }
      return false;
    } finally {
      setAssigningCommentator(false);
    }
  };

  return {
    commentators,
    setCommentators,
    newCommentatorId,
    setNewCommentatorId,
    assigningCommentator,
    handleAssignCommentator
  };
};
