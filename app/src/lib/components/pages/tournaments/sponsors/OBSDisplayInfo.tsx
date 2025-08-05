'use client';

import { CopyButton } from '@lib/components/common/buttons';

interface OBSDisplayInfoProps {
  tournamentId: string;
}

export const OBSDisplayInfo = ({ tournamentId }: OBSDisplayInfoProps) => {
  return (
    <div className="bg-blue-900 bg-opacity-50 rounded-lg p-4">
      <div className="flex items-center gap-2 justify-center">
        <h3 className="text-lg font-semibold mb-0">Copy Sponsors OBS URL</h3>
        <CopyButton text={`${window.location.origin}/modules/tournaments/${tournamentId}/sponsors/obs`} />
      </div>
    </div>
  );
}; 