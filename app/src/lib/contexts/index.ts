import { NavigationProvider } from "./NavigationContext";
import { ModalProvider } from "./ModalContext";
import { AuthProvider } from "./AuthContext";
import { ElectronProvider } from "../../libElectron/contexts/ElectronContext";
import { CamerasProvider } from "../../libCamera/context/CamerasContext";

import { TournamentsProvider } from "../../libTournament/contexts/TournamentsContext";
import { TournamentDataProvider } from "../../libTournament/contexts/TournamentDataContext";
import { TournamentBracketProvider } from "../../libTournament/contexts/TournamentBracketContext";
import { TournamentStatsProvider } from "../../libTournament/contexts/TournamentStatsContext";
import { PickbanProvider } from "../../libPickban/contexts/PickbanContext";
import { SettingsProvider } from "./SettingsContext";
import { MockDataProvider } from "./MockDataContext";
import { DownloadProvider } from "./DownloadContext";
import { PredictionsProvider } from "../../libTournament/contexts/PredictionsContext";
import { CurrentMatchProvider } from "../../libTournament/contexts/CurrentMatchContext";
import { useUser } from "./AuthContext";

import { useModal } from "./ModalContext";
import { useNavigation } from "./NavigationContext";
import { useCurrentMatch } from "../../libTournament/contexts/CurrentMatchContext";

export {
  NavigationProvider,
  ModalProvider,
  AuthProvider,
  ElectronProvider,
  CamerasProvider,
  TournamentsProvider,
  TournamentDataProvider,
  TournamentBracketProvider,
  TournamentStatsProvider,
  PickbanProvider,
  SettingsProvider,
  MockDataProvider,
  DownloadProvider,
  PredictionsProvider,
  CurrentMatchProvider,
  useUser,
  useModal,
  useNavigation,
  useCurrentMatch
};
