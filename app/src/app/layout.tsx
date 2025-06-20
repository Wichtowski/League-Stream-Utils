import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "@components/common/Footer";
import { NavigationProvider } from "./lib/contexts/NavigationContext";
import { ModalProvider } from "./lib/contexts/ModalContext";
import { AuthProvider } from "./lib/contexts/AuthContext";
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
        <AuthProvider>
          <NavigationProvider>
            <ModalProvider>
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </ModalProvider>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
