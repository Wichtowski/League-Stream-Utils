import type { resources, defaultNS } from "./instance";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["pl"];
  }
}
