"use client";

import React, { useEffect } from "react";
import { useNavigation } from "@lib/contexts/NavigationContext";
import { useAuth } from "@lib/contexts/AuthContext";
import { CopyButton } from "@/lib/components/common";
import Link from "next/link";

export default function LeagueClientPage(): React.ReactElement {
  const { setActiveModule } = useNavigation();
  const { user: _user, isLoading: _authLoading } = useAuth();

  useEffect(() => {
    setActiveModule("leagueclient");
  }, [setActiveModule]);

  interface LeagueClientCardProps {
    title: string;
    description: string;
    url: string;
    icon: React.ReactNode;
    accent: "blue" | "green";
  }

  const LeagueClientCard = ({ title, description, url, icon, accent }: LeagueClientCardProps): React.ReactElement => {
    const accentStyles = accent === "blue" 
      ? {
          iconBg: "bg-blue-600/20 border-blue-500/30 text-blue-400",
          chip: "text-blue-300/90 bg-blue-950/40 border-blue-800/40",
          btn: "border-blue-600/40 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20"
        }
      : {
          iconBg: "bg-green-600/20 border-green-500/30 text-green-400",
          chip: "text-green-300/90 bg-green-950/40 border-green-800/40",
          btn: "border-green-600/40 bg-green-600/10 text-green-300 hover:bg-green-600/20"
        };

    return (
      <div className="flex items-start gap-4 group bg-gray-900/50 rounded-2xl p-6 transition-colors border border-white/10 hover:border-white/20 shadow-lg">
        <div className={`w-12 h-12 ${accentStyles.iconBg} border rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-400 mb-4">{description}</p>
          <div className="flex items-stretch justify-between gap-4">
            <code className={`text-xs ${accentStyles.chip} px-3 h-10 py-2 rounded select-all flex items-center gap-2`}>
              <span className="text-sm">Copy OBS URL</span>
              <CopyButton text={url} />
            </code>
            <Link
              href={`${url}/demo`}
              className={`inline-flex items-center justify-center px-5 h-10 text-sm md:text-base font-medium rounded-md border ${accentStyles.btn} min-w-[180px]`}
            >
              Open Demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">League Client Integration</h1>
          <p className="text-gray-400">Quick links to demo overlays. Open to preview or copy URL for OBS/browser source.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Champion Select */}
          <LeagueClientCard
            key="champion-select"
            title="Champion Select"
            description="Dynamic picks/bans and team composition"
            url="/modules/leagueclient/champselect"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
            accent="blue"
          />

          <LeagueClientCard
            key="live-game"
            title="Live Game"
            description="In-game overlay with real-time stats"
            url="/modules/leagueclient/game"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            accent="green"
          />


        </div>

        {/* Info Section */}
        <div className="mt-12 bg-gray-900/50 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold mb-3">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-blue-300 mb-2">Champion Select</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Start a League of Legends game</li>
                <li>• Wait for champion select to begin</li>
                <li>• Open the champion select overlay</li>
                <li>• View real-time picks and bans</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-300 mb-2">Live Game</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Join or spectate a League of Legends game</li>
                <li>• Wait for the game to load</li>
                <li>• Open the live game overlay</li>
                <li>• Monitor player stats and objectives</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
