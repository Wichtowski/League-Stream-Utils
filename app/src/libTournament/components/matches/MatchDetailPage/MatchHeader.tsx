import React from "react";
import { Button } from "@lib/components/common";

interface MatchHeaderProps {
  editing: boolean;
  saving: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: () => Promise<void>;
  onShowDeleteModal: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  editing,
  saving,
  onStartEditing,
  onCancelEditing,
  onSave,
  onShowDeleteModal
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3 ml-auto">
        <div className="relative overflow-hidden">
          <div 
            className={`flex items-center space-x-3 transition-all duration-300 ease-in-out ${
              editing 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-4 opacity-0 absolute'
            }`}
          >
            <Button 
              onClick={onSave} 
              disabled={saving} 
              variant="primary"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              {saving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button 
              onClick={onCancelEditing} 
              variant="secondary"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md"
            >
              Cancel
            </Button>
            <Button 
              onClick={onShowDeleteModal} 
              disabled={saving} 
              variant="destructive"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              ✕ Delete Match
            </Button>
          </div>
          
          <div 
            className={`flex items-center space-x-3 transition-all duration-300 ease-in-out ${
              !editing 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-4 opacity-0 absolute'
            }`}
          >
            <Button 
              onClick={onStartEditing} 
              variant="primary"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              Edit Match
            </Button>
            <Button 
              onClick={onShowDeleteModal} 
              disabled={saving} 
              variant="destructive"
              className="transform transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            >
              ✕ Delete Match
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
