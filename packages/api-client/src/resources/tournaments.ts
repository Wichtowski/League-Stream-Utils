import type { Tournament, Match } from "@lsu/types";

import { Resource } from "./base";

export class TournamentsResource extends Resource {
  list() {
    return this.get<Tournament[]>("/api/v1/tournaments");
  }

  getById(id: string) {
    return this.get<Tournament>(`/api/v1/tournaments/${id}`);
  }

  create(data: { name: string; type: string; format: string; description?: string }) {
    return this.post<Tournament>("/api/v1/tournaments", data);
  }

  update(id: string, data: Record<string, unknown>) {
    return this.patch<Tournament>(`/api/v1/tournaments/${id}`, data);
  }

  remove(id: string) {
    return this.del(`/api/v1/tournaments/${id}`);
  }

  addTeam(id: string, teamId: string, seed?: number) {
    return this.post(`/api/v1/tournaments/${id}/teams`, { teamId, seed });
  }

  generateMatches(id: string) {
    return this.post(`/api/v1/tournaments/${id}/matches`);
  }

  invite(id: string, teamId: string) {
    return this.post(`/api/v1/tournaments/${id}/invite`, { teamId });
  }

  join(id: string, teamId: string, code?: string) {
    return this.post(`/api/v1/tournaments/${id}/join`, { teamId, code });
  }

  handleRequest(id: string, requestId: string, action: "approve" | "reject") {
    return this.patch(`/api/v1/tournaments/${id}/requests/${requestId}`, { action });
  }
}

export class MatchesResource extends Resource {
  getById(id: string) {
    return this.get<Match>(`/api/v1/matches/${id}`);
  }

  update(id: string, data: { status?: string; scoreBlue?: number; scoreRed?: number }) {
    return this.patch<Match>(`/api/v1/matches/${id}`, data);
  }
}
