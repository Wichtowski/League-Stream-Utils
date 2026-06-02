import React from "react";
import { Button } from "@lib/components/common";

interface DeleteMatchModalProps {
  show: boolean;
  saving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteMatchModal: React.FC<DeleteMatchModalProps> = ({ show, saving, onClose, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-white mb-4">Delete Match</h3>
        <p className="text-gray-300 mb-6">Are you sure you want to delete this match? This action cannot be undone.</p>
        <div className="flex space-x-3 justify-end">
          <Button onClick={onClose} variant="secondary" disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="secondary"
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={saving}
          >
            {saving ? "Deleting..." : "Delete Match"}
          </Button>
        </div>
      </div>
    </div>
  );
};
