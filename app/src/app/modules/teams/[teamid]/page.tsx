import React from 'react';
import { useRouter } from 'next/router';
import { useTeams } from '@lib/contexts/TeamsContext';
import { TeamEditForm } from '../../../../lib/components/pages/teams/TeamEditForm';

const TeamEditPage: React.FC = () => {
  const router = useRouter();
  const { teamid } = router.query;
  const { teams, updateTeam } = useTeams();

  const team = teams.find(t => t.id === teamid);

  if (!team) return <div>Team not found</div>;

  return (
    <TeamEditForm
      team={team}
      onSave={async (updatedTeam) => {
        await updateTeam(team.id, updatedTeam);
        router.push('/modules/teams');
      }}
      onCancel={() => router.push('/modules/teams')}
    />
  );
};

export default TeamEditPage; 