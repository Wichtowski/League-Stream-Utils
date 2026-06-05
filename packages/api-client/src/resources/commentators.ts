import type { Commentator } from "@lsu/types";

import { Resource } from "./base";

export class CommentatorsResource extends Resource {
  list() {
    return this.get<Commentator[]>("/api/v1/commentators");
  }

  create(data: { name: string; socialLinks?: Record<string, string> }) {
    return this.post<Commentator>("/api/v1/commentators", data);
  }

  update(id: string, data: { name?: string; socialLinks?: Record<string, string> }) {
    return this.patch<Commentator>(`/api/v1/commentators/${id}`, data);
  }

  remove(id: string) {
    return this.del(`/api/v1/commentators/${id}`);
  }
}
