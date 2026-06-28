import { HttpClient } from "./client";
import type { ClientContext } from "./client";
import { AdminResource } from "./resources/admin";
import { CamerasResource } from "./resources/cameras";
import { CommentatorsResource } from "./resources/commentators";
import { DraftResource } from "./resources/draft";
import { TeamsResource } from "./resources/teams";
import { TournamentsResource, MatchesResource } from "./resources/tournaments";

export class ApiClient extends HttpClient {
  readonly teams: TeamsResource;
  readonly cameras: CamerasResource;
  readonly tournaments: TournamentsResource;
  readonly matches: MatchesResource;
  readonly draft: DraftResource;
  readonly commentators: CommentatorsResource;
  readonly admin: AdminResource;

  constructor(ctx: ClientContext = {}) {
    super(ctx);
    this.teams = new TeamsResource(this);
    this.cameras = new CamerasResource(this);
    this.tournaments = new TournamentsResource(this);
    this.matches = new MatchesResource(this);
    this.draft = new DraftResource(this);
    this.commentators = new CommentatorsResource(this);
    this.admin = new AdminResource(this);
  }
}
