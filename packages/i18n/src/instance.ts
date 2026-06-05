import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import adminEn from "./locales/en/admin.json";
import authEn from "./locales/en/auth.json";
import camerasEn from "./locales/en/cameras.json";
import commentatorsEn from "./locales/en/commentators.json";
import commonEn from "./locales/en/common.json";
import devEn from "./locales/en/dev.json";
import draftEn from "./locales/en/draft.json";
import electronEn from "./locales/en/electron.json";
import modulesEn from "./locales/en/modules.json";
import navEn from "./locales/en/nav.json";
import settingsEn from "./locales/en/settings.json";
import teamsEn from "./locales/en/teams.json";
import tournamentsEn from "./locales/en/tournaments.json";
import adminPl from "./locales/pl/admin.json";
import authPl from "./locales/pl/auth.json";
import camerasPl from "./locales/pl/cameras.json";
import commentatorsPl from "./locales/pl/commentators.json";
import commonPl from "./locales/pl/common.json";
import devPl from "./locales/pl/dev.json";
import draftPl from "./locales/pl/draft.json";
import electronPl from "./locales/pl/electron.json";
import modulesPl from "./locales/pl/modules.json";
import navPl from "./locales/pl/nav.json";
import settingsPl from "./locales/pl/settings.json";
import teamsPl from "./locales/pl/teams.json";
import tournamentsPl from "./locales/pl/tournaments.json";

export const defaultNS = "common" as const;

export const resources = {
  pl: {
    common: commonPl,
    nav: navPl,
    auth: authPl,
    draft: draftPl,
    tournaments: tournamentsPl,
    teams: teamsPl,
    cameras: camerasPl,
    commentators: commentatorsPl,
    admin: adminPl,
    settings: settingsPl,
    electron: electronPl,
    dev: devPl,
    modules: modulesPl,
  },
  en: {
    common: commonEn,
    nav: navEn,
    auth: authEn,
    draft: draftEn,
    tournaments: tournamentsEn,
    teams: teamsEn,
    cameras: camerasEn,
    commentators: commentatorsEn,
    admin: adminEn,
    settings: settingsEn,
    electron: electronEn,
    dev: devEn,
    modules: modulesEn,
  },
} as const;

export const supportedLngs = ["pl", "en"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

const isServer = typeof window === "undefined";

export const i18n = i18next.createInstance();

if (!isServer) {
  i18n.use(LanguageDetector);
}

i18n.init({
  resources,
  lng: "pl",
  fallbackLng: "en",
  defaultNS,
  supportedLngs: [...supportedLngs],
  interpolation: {
    escapeValue: false,
  },
  detection: {
    order: ["localStorage", "navigator"],
    lookupLocalStorage: "lsu-language",
    caches: ["localStorage"],
  },
});

export { i18n as default };
