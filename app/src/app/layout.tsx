import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@components/common";
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
  HighPerformanceDownloadProvider,
  PredictionsProvider
}
from "@lib/contexts";
import { NavigationGuard } from "./lib/components/NavigationGuard";
import { ContextWrapper } from "./lib/components/ContextErrorBoundary";
import { ChampionCacheInitializer } from "./components/common/ChampionCacheInitializer";
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ContextWrapper
          contexts={[
            { name: "Electron", provider: ElectronProvider },
            { name: "Auth", provider: AuthProvider },
            { name: "Predictions", provider: PredictionsProvider },
            { name: "MockData", provider: MockDataProvider },
            { name: "LCU", provider: LCUProvider },
            { name: "Cameras", provider: CamerasProvider },
            { name: "Settings", provider: SettingsProvider },
            { name: "Teams", provider: TeamsProvider },
            { name: "TournamentData", provider: TournamentDataProvider },
            { name: "TournamentBracket", provider: TournamentBracketProvider },
            { name: "TournamentStats", provider: TournamentStatsProvider },
            { name: "Tournaments", provider: TournamentsProvider },
            { name: "Pickban", provider: PickbanProvider },
            { name: "Download", provider: DownloadProvider },
            { name: "HighPerformanceDownload", provider: HighPerformanceDownloadProvider },
            { name: "Navigation", provider: NavigationProvider },
            { name: "Modal", provider: ModalProvider }
          ]}
        >
          <NavigationGuard>
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ChampionCacheInitializer />
          </NavigationGuard>
        </ContextWrapper>
      </body>
    </html>
  );
}
