import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@components/common";
import { NavigationProvider } from "./lib/contexts/NavigationContext";
import { ModalProvider } from "./lib/contexts/ModalContext";
import { AuthProvider } from "./lib/contexts/AuthContext";
import { ElectronProvider } from "./lib/contexts/ElectronContext";
import { LCUProvider } from "./lib/contexts/LCUContext";
import { CamerasProvider } from "./lib/contexts/CamerasContext";
import { TeamsProvider } from "./lib/contexts/TeamsContext";
import { TournamentsProvider } from "./lib/contexts/TournamentsContext";
import { PickbanProvider } from "./lib/contexts/PickbanContext";
import { SettingsProvider } from "./lib/contexts/SettingsContext";
import { MockDataProvider } from "./lib/contexts/MockDataContext";
import { DownloadProvider } from "./lib/contexts/DownloadContext";
import { NavigationGuard } from "./lib/components/NavigationGuard";
import ChampionCacheInitializer from "./components/common/ChampionCacheInitializer";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900`}
      >
        <ElectronProvider>
          <AuthProvider>
            <LCUProvider>
              <CamerasProvider>
                <SettingsProvider>
                  <TeamsProvider>
                    <TournamentsProvider>
                      <PickbanProvider>
                        <MockDataProvider>
                          <DownloadProvider>
                            <NavigationProvider>
                              <ModalProvider>
                                <NavigationGuard>
                                  <main className="flex-1">
                                    {children}
                                  </main>
                                  <Footer />
                                  <ChampionCacheInitializer />
                                </NavigationGuard>
                              </ModalProvider>
                            </NavigationProvider>
                          </DownloadProvider>
                        </MockDataProvider>
                      </PickbanProvider>
                    </TournamentsProvider>
                  </TeamsProvider>
                </SettingsProvider>
              </CamerasProvider>
            </LCUProvider>
          </AuthProvider>
        </ElectronProvider>
      </body>
    </html>
  );
}
