import React from "react";
import { Button } from "@lib/components/common";
import type { Match, Tournament } from "@lib/types";

interface MatchHeaderProps {
  match: Match;
  _tournament: Tournament;
  editing: boolean;
  saving: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => Promise<void>;
  onShowDeleteModal: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  match,
  _tournament,
  editing,
  saving,
  onStartEditing,
  onCancelEditing,
  onSave,
  onShowDeleteModal
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{match.name}</h1>
        <p className="text-gray-400 mt-2">
          {match.format} • {match.status}
        </p>
      </div>
      <div className="flex items-center space-x-3">
        {editing ? (
          <>
            <Button onClick={onSave} disabled={saving} variant="primary">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button onClick={onCancelEditing} variant="secondary">
              Cancel
            </Button>
            <Button onClick={onShowDeleteModal} disabled={saving} variant="destructive">
              ✕ Delete Match
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onStartEditing} variant="primary">
              Edit Match
            </Button>
            <Button onClick={onShowDeleteModal} disabled={saving} variant="destructive">
              ✕ Delete Match
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
