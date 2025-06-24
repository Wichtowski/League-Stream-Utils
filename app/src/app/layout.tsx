import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@components/common";
import { NavigationProvider } from "./lib/contexts/NavigationContext";
import { ModalProvider } from "./lib/contexts/ModalContext";
import { AuthProvider } from "./lib/contexts/AuthContext";
import { ElectronProvider } from "./lib/contexts/ElectronContext";
import { NavigationGuard } from "./lib/components/NavigationGuard";
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
            <NavigationProvider>
              <ModalProvider>
                <NavigationGuard>
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </NavigationGuard>
              </ModalProvider>
            </NavigationProvider>
          </AuthProvider>
        </ElectronProvider>
      </body>
    </html>
  );
}
