import { useState, useRef } from "react";
import type { Match, MatchStatus } from "@libTournament/types/matches";

export const useMatchEditing = (match: Match | null) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Match>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const preEditSnapshotRef = useRef<Match | null>(null);

  const startEditing = () => {
    if (match) {
      preEditSnapshotRef.current = { ...match };
      setEditData(match);
      setEditing(true);
    }
  };

  const cancelEditing = () => {
    if (preEditSnapshotRef.current) {
      setEditData(preEditSnapshotRef.current);
    }
    setEditing(false);
  };

  const handleSave = async (): Promise<boolean> => {
    if (!match) return false;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        throw new Error("Failed to update match");
      }

      const updatedMatch = await response.json();
      setEditData(updatedMatch.match);
      setEditing(false);
      return true;
    } catch (err) {
      console.error("Failed to save changes:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: MatchStatus): Promise<boolean> => {
    if (!match) return false;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      const updatedMatch = await response.json();
      setEditData(updatedMatch.match);
      return true;
    } catch (err) {
      console.error("Failed to update status:", err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = async (): Promise<boolean> => {
    if (!match) return false;

    try {
      setSaving(true);
      const response = await fetch(`/api/v1/matches/${match._id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to delete match");
      }
      return true;
    } catch (err) {
      console.error("Failed to delete match:", err);
      return false;
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  return {
    editing,
    setEditing,
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
  };
};
