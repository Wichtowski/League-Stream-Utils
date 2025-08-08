import Link from 'next/link';

export function UnauthenticatedLanding() {
    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-4xl mx-auto text-center">
                <div className="bg-gray-800/40 backdrop-blur-md rounded-2xl p-12 shadow-2xl border border-gray-700/50">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <span className="text-white font-bold text-3xl">LSU</span>
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            League Stream Utils
                        </h1>
                        <p className="text-gray-400 text-xl mb-12">
                            Tournament management utilities for streaming and broadcasting
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link
                            href="/auth"
                            className="group bg-gradient-to-r from-blue-600/20 to-purple-600/20 hover:from-blue-600/30 hover:to-purple-600/30 border border-blue-500/50 hover:border-blue-400 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20 col-span-full"
                        >
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:from-blue-500/40 group-hover:to-purple-500/40 transition-colors">
                                <span className="text-2xl">⚔️</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Pick & Ban System</h3>
                            <p className="text-gray-400">
                                Professional tournament draft interface for League of Legends
                            </p>
                        </Link>

                        <Link
                            href="/modules/cameras"
                            className="group bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-blue-500/50 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/20"
                        >
                            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                                <span className="text-blue-400 text-2xl">📹</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Camera Setup</h3>
                            <p className="text-gray-400">Configure team streams and camera feeds</p>
                        </Link>

                        <Link
                            href="/modules/champ-ability"
                            className="group bg-gray-700/30 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20"
                        >
                            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
                                <span className="text-purple-400 text-2xl">⚔️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Champions</h3>
                            <p className="text-gray-400">Manage champion selections and data</p>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
