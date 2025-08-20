"use client";

import React from "react";

export const HelpSection = (): React.ReactElement => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Stream URL Examples</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Twitch Streams:</h4>
            <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
              https://player.twitch.tv/?channel=CHANNEL_NAME&parent=localhost
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-2">YouTube Streams:</h4>
            <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
              https://www.youtube.com/embed/VIDEO_ID
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-2">OBS Studio:</h4>
            <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
              rtmp://your-server.com/live/stream_key
            </code>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Direct Video:</h4>
            <code className="block bg-gray-700 p-2 rounded text-green-400 text-xs">
              https://example.com/stream.m3u8
            </code>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4">
            <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2">🏆 Tournament Delay Setup</h4>
            <p className="text-sm text-gray-300 mb-3">
              For competitive integrity, set up delayed streams when not using official spectator mode:
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div>
                <strong className="text-gray-300">OBS Studio:</strong>
                <br />• Use &quot;Stream Delay&quot; filter (3 minutes)
                <br />• Create separate delayed stream keys
              </div>
              <div>
                <strong className="text-gray-300">Twitch:</strong>
                <br />• Enable stream delay in dashboard
                <br />• Use different channel for delayed feed
              </div>
              <div>
                <strong className="text-gray-300">Streaming Software:</strong>
                <br />• Configure built-in delay features
                <br />• Use server-side delay solutions
              </div>
            </div>
          </div>
          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <h4 className="font-medium text-blue-400 mb-2">💡 Pro Tips</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Test both live and delayed streams before tournaments</li>
              <li>• Use keyboard shortcuts: T for tournament mode</li>
              <li>• Monitor stream quality and delay accuracy</li>
              <li>• Have backup delay mechanisms ready</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
