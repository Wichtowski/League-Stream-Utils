import type { Team } from "@lsu/types";

import { Resource } from "./base";

export class TeamsResource extends Resource {
  list() {
    return this.get<Team[]>("/api/v1/teams");
  }

  getById(id: string) {
    return this.get<Team>(`/api/v1/teams/${id}`);
  }

  create(data: {
    name: string;
    tag: string;
    colors: { primary: string; secondary: string; accent: string };
    country?: string;
  }) {
    return this.post<Team>("/api/v1/teams", data);
  }

  update(
    id: string,
    data: {
      name?: string;
      tag?: string;
      colors?: { primary: string; secondary: string; accent: string };
      country?: string;
    },
  ) {
    return this.patch<Team>(`/api/v1/teams/${id}`, data);
  }

  remove(id: string) {
    return this.del(`/api/v1/teams/${id}`);
  }

  addPlayer(teamId: string, data: { name: string; role: string; country?: string }) {
    return this.post(`/api/v1/teams/${teamId}/players`, data);
  }

  updatePlayer(teamId: string, playerId: string, data: Record<string, unknown>) {
    return this.patch(`/api/v1/teams/${teamId}/players/${playerId}`, data);
  }
}
