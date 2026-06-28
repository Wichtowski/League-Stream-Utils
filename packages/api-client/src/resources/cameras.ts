import type { CameraConfig } from "@lsu/types";

import { Resource } from "./base";

export class CamerasResource extends Resource {
  list() {
    return this.get<CameraConfig[]>("/api/v1/cameras");
  }

  getByTeam(teamId: string) {
    return this.get<CameraConfig>(`/api/v1/cameras/${teamId}`);
  }

  update(teamId: string, players: Array<{ role: string; streamUrl: string; playerName?: string }>) {
    return this.put(`/api/v1/cameras/${teamId}`, { players });
  }

  remove(teamId: string) {
    return this.del(`/api/v1/cameras/${teamId}`);
  }
}
