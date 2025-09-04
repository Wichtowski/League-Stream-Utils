"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageWrapper } from "@lib/layout/PageWrapper";
import { useNavigation } from "@lib/contexts/NavigationContext";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const { setActiveModule } = useNavigation();
  
  useEffect(() => {
    setActiveModule(null);
  }, [setActiveModule]);
 
  return (
    <PageWrapper>
      {/* Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-white">League Stream Utils</h1>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Tournament
            <br />
            <span className="text-blue-400">Management</span>
            <br />
            Made Simple
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Complete esports tournament platform with pick/ban system, team management, streaming integration, and
            professional broadcasting tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="border border-white/20 hover:bg-white/10 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need</h2>
            <p className="text-xl text-gray-300">Professional tournament management tools</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pick/Ban System */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">⚔️</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pick/Ban System</h3>
              <p className="text-gray-300">
                Professional draft interface with real-time synchronization, timer management, and fearless draft
                support.
              </p>
            </div>

            {/* Team Management */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Team Management</h3>
              <p className="text-gray-300">
                Complete team registration, player verification through Riot API, and roster management.
              </p>
            </div>

            {/* Streaming Tools */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📺</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Streaming Integration</h3>
              <p className="text-gray-300">
                OBS automation, camera management, and professional broadcast overlays for seamless streaming.
              </p>
            </div>

            {/* Tournament Management */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tournament System</h3>
              <p className="text-gray-300">
                Bracket generation, scheduling, registration management, and comprehensive tournament administration.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Champion Analytics</h3>
              <p className="text-gray-300">
                Detailed statistics, pick/ban rates, win rates, and performance analytics across tournaments.
              </p>
            </div>

            {/* Desktop App */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-2xl">💻</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Desktop Application</h3>
              <p className="text-gray-300">
                Native desktop app with enhanced features, local storage, and advanced tournament templates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Host Your Tournament?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join tournament organizers who trust League Stream Utils for their esports events.
          </p>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
          >
            Start Your Tournament
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">V</span>
              </div>
              <span className="text-white font-semibold">League Stream Utils</span>
            </div>
            <p className="text-gray-400 text-sm">
              {new Date().getFullYear()} Oskar Wichtowski - League Stream Utils. Professional tournament management
              platform.
            </p>
          </div>
        </div>
      </footer>
    </PageWrapper>
  );
}
