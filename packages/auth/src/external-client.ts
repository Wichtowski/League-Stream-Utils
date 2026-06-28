import { HttpClient } from "@lsu/api-client";

export class ExternalClient extends HttpClient {}

export const externalClient = new ExternalClient();
