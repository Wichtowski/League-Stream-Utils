import Link from "next/link";
import { CopyButton } from "@/lib/components/common/buttons";
import type { SessionUrls } from "@lib/types";

interface SessionUrlDisplayProps {
  urls: SessionUrls;
}

export function SessionUrlDisplay({ urls }: SessionUrlDisplayProps) {
  return (
    <div className="mt-6 p-4 bg-gray-700 rounded-lg">
      <h3 className="text-lg font-semibold mb-3 text-green-400">
        Session Created!
      </h3>
      <div className="space-y-3">
        <div>
          <span className="font-medium text-amber-300">Configuration URL:</span>
          <div className="p-2 rounded mt-1 break-all flex items-center justify-between">
            <Link
              href={`/modules/pickban/config/${urls.sessionId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:underline flex-1 mr-2"
            >
              {typeof window !== "undefined" && window.location.origin}
              /modules/pickban/config/{urls.sessionId}
            </Link>
            <CopyButton
              text={`${typeof window !== "undefined" ? window.location.origin : ""}/modules/pickban/config/${urls.sessionId}`}
              size="sm"
            />
          </div>
        </div>

        <div>
          <span className="font-medium text-blue-300">Blue Team URL:</span>
          <div className="p-2 rounded mt-1 break-all flex items-center justify-between">
            <Link
              href={urls.blue}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline flex-1 mr-2"
            >
              {urls.blue}
            </Link>
            <CopyButton text={urls.blue} size="sm" />
          </div>
        </div>

        <div>
          <span className="font-medium text-red-300">Red Team URL:</span>
          <div className=" p-2 rounded mt-1 break-all flex items-center justify-between">
            <Link
              href={urls.red}
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline flex-1 mr-2"
            >
              {urls.red}
            </Link>
            <CopyButton text={urls.red} size="sm" />
          </div>
        </div>

        <div>
          <span className="font-medium text-green-300">Spectator URL:</span>
          <div className=" p-2 rounded mt-1 break-all flex items-center justify-between">
            <Link
              href={urls.spectator}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline flex-1 mr-2"
            >
              {urls.spectator}
            </Link>
            <CopyButton text={urls.spectator} size="sm" />
          </div>
        </div>

        <div>
          <span className="font-medium text-purple-300">OBS Overlay URL:</span>
          <div className=" p-2 rounded mt-1 break-all flex items-center justify-between">
            <Link
              href={urls.obs}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline flex-1 mr-2"
            >
              {urls.obs}
            </Link>
            <CopyButton text={urls.obs} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
