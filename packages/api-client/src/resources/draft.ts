import type { draftSession } from "@lsu/types";

import { Resource } from "./base";

export class DraftResource extends Resource {
  list() {
    return this.get<draftSession[]>("/api/v1/draft");
  }

  getById(id: string) {
    return this.get<draftSession>(`/api/v1/draft/${id}`);
  }

  create(data: {
    config: Record<string, unknown>;
    teams: Record<string, unknown>;
    password?: string;
  }) {
    return this.post<draftSession>("/api/v1/draft", data);
  }

  remove(id: string) {
    return this.del(`/api/v1/draft/${id}`);
  }

  submitAction(sessionId: string, action: Record<string, unknown>) {
    return this.post(`/api/v1/draft/${sessionId}/actions`, action);
  }
}
