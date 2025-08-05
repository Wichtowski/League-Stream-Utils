import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@lib/components/common";
import {
  NavigationProvider,
  ModalProvider,
  AuthProvider,
  ElectronProvider,
  LCUProvider,
  CamerasProvider,
  TeamsProvider,
  TournamentsProvider,
  TournamentDataProvider,
  TournamentBracketProvider,
  TournamentStatsProvider,
  PickbanProvider,
  SettingsProvider,
  MockDataProvider,
  DownloadProvider,
  PredictionsProvider,
} from "@lib/contexts";
import { NavigationGuard } from "@lib/components/navigation/NavigationGuard";
import { ContextWrapper } from "@lib/components/navigation/ContextErrorBoundary";
import { ChampionCacheInitializer } from "@lib/components/LCU/ChampionCacheInitializer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "League Stream Utils",
  description: "Tournament stream management utilities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ContextWrapper
        contexts={[
          { name: "Electron", provider: ElectronProvider },
          { name: "Auth", provider: AuthProvider },
          { name: "Predictions", provider: PredictionsProvider },
          { name: "MockData", provider: MockDataProvider },
          { name: "Download", provider: DownloadProvider },
          { name: "LCU", provider: LCUProvider },
          { name: "Cameras", provider: CamerasProvider },
          { name: "Settings", provider: SettingsProvider },
          { name: "Teams", provider: TeamsProvider },
          { name: "TournamentData", provider: TournamentDataProvider },
          { name: "TournamentBracket", provider: TournamentBracketProvider },
          { name: "TournamentStats", provider: TournamentStatsProvider },
          { name: "Tournaments", provider: TournamentsProvider },
          { name: "Pickban", provider: PickbanProvider },
          { name: "Navigation", provider: NavigationProvider },
          { name: "Modal", provider: ModalProvider },
        ]}
      >
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-black`}
        >
          <NavigationGuard>
            <main className="flex-1">{children}</main>
            <Footer />
            <ChampionCacheInitializer />
          </NavigationGuard>
        </body>
      </ContextWrapper>
    </html>
  );
}
