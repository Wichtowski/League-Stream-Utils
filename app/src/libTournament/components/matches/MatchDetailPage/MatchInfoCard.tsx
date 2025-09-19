import React from "react";
import type { Match, MatchFormat, MatchStatus } from "@lib/types/match";

interface MatchInfoCardProps {
  match: Match;
  editing: boolean;
  editData: Partial<Match>;
  onEditDataChange: (data: Partial<Match>) => void;
}

export const MatchInfoCard: React.FC<MatchInfoCardProps> = ({
  match,
  editing,
  editData,
  onEditDataChange
}) => {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">Match Information</h3>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Match Name</label>
              <input
                type="text"
                value={editData.name || match.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onEditDataChange({ ...editData, name: e.target.value })
                }
                placeholder={match.name}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
              <select
                value={editData.format || match.format}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onEditDataChange({ ...editData, format: e.target.value as MatchFormat })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BO1">Best of 1</option>
                <option value="BO3">Best of 3</option>
                <option value="BO5">Best of 5</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Scheduled Time</label>
              <input
                type="datetime-local"
                value={
                  editData.scheduledTime ? new Date(editData.scheduledTime).toISOString().slice(0, 16) : ""
                }
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onEditDataChange({ ...editData, scheduledTime: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={editData.status || match.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  onEditDataChange({ ...editData, status: e.target.value as MatchStatus })
                }
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Name:</span>
            <span className="text-white ml-2">{match.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Format:</span>
            <span className="text-white ml-2">{match.format}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="text-white ml-2">{match.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Scheduled:</span>
            <span className="text-white ml-2">
              {match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : "TBD"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
