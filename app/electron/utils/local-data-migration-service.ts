import { localMongoDBService } from './local-mongodb-service';
import { localDatabaseManager } from './local-database-manager';
import { UserModel, TeamModel, TournamentModel, GameSessionModel } from '@lib/database/models';
import type { User, Team, Tournament, GameSession } from '@lib/types';

export interface MigrationResult {
  success: boolean;
  migratedItems: number;
  errors: string[];
}

export interface LocalStorageData {
  teams?: Team[];
  tournaments?: Tournament[];
  users?: User[];
  gameSessions?: GameSession[];
}

export class LocalDataMigrationService {
  private isMigrating: boolean = false;

  async migrateFromLocalStorage(): Promise<MigrationResult> {
    if (this.isMigrating) {
      return { success: false, migratedItems: 0, errors: ['Migration already in progress'] };
    }

    this.isMigrating = true;
    const result: MigrationResult = {
      success: true,
      migratedItems: 0,
      errors: []
    };

    try {
      // Ensure MongoDB is running
      const status = await localMongoDBService.getStatus();
      if (!status.isRunning) {
        await localMongoDBService.start();
        await localMongoDBService.waitForReady();
      }

      // Extract data from localStorage
      const localStorageData = this.extractLocalStorageData();
      
      // Migrate each data type
      if (localStorageData.teams && localStorageData.teams.length > 0) {
        const teamResult = await this.migrateTeams(localStorageData.teams);
        result.migratedItems += teamResult.migratedItems;
        result.errors.push(...teamResult.errors);
      }

      if (localStorageData.tournaments && localStorageData.tournaments.length > 0) {
        const tournamentResult = await this.migrateTournaments(localStorageData.tournaments);
        result.migratedItems += tournamentResult.migratedItems;
        result.errors.push(...tournamentResult.errors);
      }

      if (localStorageData.users && localStorageData.users.length > 0) {
        const userResult = await this.migrateUsers(localStorageData.users);
        result.migratedItems += userResult.migratedItems;
        result.errors.push(...userResult.errors);
      }

      if (localStorageData.gameSessions && localStorageData.gameSessions.length > 0) {
        const sessionResult = await this.migrateGameSessions(localStorageData.gameSessions);
        result.migratedItems += sessionResult.migratedItems;
        result.errors.push(...sessionResult.errors);
      }

      // Clear localStorage data after successful migration
      if (result.migratedItems > 0) {
        this.clearLocalStorageData();
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isMigrating = false;
    }

    return result;
  }

  private extractLocalStorageData(): LocalStorageData {
    const data: LocalStorageData = {};

    try {
      // Extract teams data
      const teamsData = localStorage.getItem('electron-local-teams-data');
      if (teamsData) {
        const parsed = JSON.parse(teamsData);
        if (parsed.data && Array.isArray(parsed.data)) {
          data.teams = parsed.data;
        }
      }

      // Extract tournaments data
      const tournamentsData = localStorage.getItem('electron-local-tournaments-data');
      if (tournamentsData) {
        const parsed = JSON.parse(tournamentsData);
        if (parsed.data && Array.isArray(parsed.data)) {
          data.tournaments = parsed.data;
        }
      }

      // Extract users data
      const usersData = localStorage.getItem('electron-local-users-data');
      if (usersData) {
        const parsed = JSON.parse(usersData);
        if (parsed.data && Array.isArray(parsed.data)) {
          data.users = parsed.data;
        }
      }

      // Extract game sessions data
      const sessionsData = localStorage.getItem('electron-local-game-sessions-data');
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        if (parsed.data && Array.isArray(parsed.data)) {
          data.gameSessions = parsed.data;
        }
      }

    } catch (error) {
      console.error('Error extracting localStorage data:', error);
    }

    return data;
  }

  private async migrateTeams(teams: Team[]): Promise<MigrationResult> {
    const result: MigrationResult = { success: true, migratedItems: 0, errors: [] };

    try {
      for (const team of teams) {
        try {
          // Check if team already exists
          const existingTeam = await TeamModel.findOne({ id: team.id });
          if (!existingTeam) {
            await TeamModel.create(team);
            result.migratedItems++;
          }
        } catch (error) {
          result.errors.push(`Failed to migrate team ${team.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Team migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async migrateTournaments(tournaments: Tournament[]): Promise<MigrationResult> {
    const result: MigrationResult = { success: true, migratedItems: 0, errors: [] };

    try {
      for (const tournament of tournaments) {
        try {
          // Check if tournament already exists
          const existingTournament = await TournamentModel.findOne({ id: tournament.id });
          if (!existingTournament) {
            await TournamentModel.create(tournament);
            result.migratedItems++;
          }
        } catch (error) {
          result.errors.push(`Failed to migrate tournament ${tournament.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Tournament migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async migrateUsers(users: User[]): Promise<MigrationResult> {
    const result: MigrationResult = { success: true, migratedItems: 0, errors: [] };

    try {
      for (const user of users) {
        try {
          // Check if user already exists
          const existingUser = await UserModel.findOne({ id: user.id });
          if (!existingUser) {
            await UserModel.create(user);
            result.migratedItems++;
          }
        } catch (error) {
          result.errors.push(`Failed to migrate user ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`User migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async migrateGameSessions(sessions: GameSession[]): Promise<MigrationResult> {
    const result: MigrationResult = { success: true, migratedItems: 0, errors: [] };

    try {
      for (const session of sessions) {
        try {
          // Check if session already exists
          const existingSession = await GameSessionModel.findOne({ id: session.id });
          if (!existingSession) {
            await GameSessionModel.create(session);
            result.migratedItems++;
          }
        } catch (error) {
          result.errors.push(`Failed to migrate session ${session.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Game session migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private clearLocalStorageData(): void {
    try {
      const keysToRemove = [
        'electron-local-teams-data',
        'electron-local-tournaments-data',
        'electron-local-users-data',
        'electron-local-game-sessions-data'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('✅ Cleared localStorage data after successful migration');
    } catch (error) {
      console.error('Error clearing localStorage data:', error);
    }
  }

  async checkForLocalStorageData(): Promise<boolean> {
    try {
      const keys = [
        'electron-local-teams-data',
        'electron-local-tournaments-data',
        'electron-local-users-data',
        'electron-local-game-sessions-data'
      ];

      return keys.some(key => {
        const data = localStorage.getItem(key);
        return data !== null && data !== 'null' && data !== 'undefined';
      });
    } catch (error) {
      console.error('Error checking localStorage data:', error);
      return false;
    }
  }

  async getMigrationStatus(): Promise<{ hasLocalData: boolean; isMigrating: boolean }> {
    return {
      hasLocalData: await this.checkForLocalStorageData(),
      isMigrating: this.isMigrating
    };
  }
}

export const localDataMigrationService = new LocalDataMigrationService();
