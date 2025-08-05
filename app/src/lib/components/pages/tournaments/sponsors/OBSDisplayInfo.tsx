'use client';

import { CopyButton } from '@lib/components/common/buttons';

interface OBSDisplayInfoProps {
  tournamentId: string;
}

export const OBSDisplayInfo = ({ tournamentId }: OBSDisplayInfoProps) => {
  return (
    <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">OBS Display</h3>
      <p className="text-sm text-gray-300 mb-2">
        Add this URL to OBS as a Browser Source to display your sponsors:
      </p>
      <div className="flex items-center gap-2">
        <div className="bg-gray-800 rounded p-2 font-mono text-sm break-all">
          {`${window.location.origin}/modules/tournaments/${tournamentId}/sponsors/obs`}
        </div>
        <CopyButton text={`${window.location.origin}/modules/tournaments/${tournamentId}/sponsors/obs`} />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        The display will show only sponsor logos with fade in/out effects in the bottom-left corner.
      </p>
    </div>
  );
}; 