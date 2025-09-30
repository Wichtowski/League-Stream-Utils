"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function SponsorsIndexPage() {
  const params = useParams();
  const tournamentId = params.tournamentId as string;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sponsors</h1>
      <p className="text-gray-300">Choose which editor/display you want to manage.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/modules/tournaments/${tournamentId}/sponsors/corner`}
          className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700"
        >
          <div className="font-semibold mb-1">Corner Sponsors</div>
          <div className="text-sm text-gray-400">Edit and preview the right-corner sponsors.</div>
        </Link>
        <Link
          href={`/modules/tournaments/${tournamentId}/sponsors/banner`}
          className="block bg-gray-800 rounded-lg p-4 hover:bg-gray-700"
        >
          <div className="font-semibold mb-1">Banner Sponsors</div>
          <div className="text-sm text-gray-400">Edit and preview the bottom-center banner.</div>
        </Link>
      </div>
    </div>
  );
}
