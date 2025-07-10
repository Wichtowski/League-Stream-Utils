import React from 'react';
import Image from 'next/image';
import { getChampionSquareImage } from './common';
import { ROLE_ICONS } from '@lib/constants';
import { PlayerRole } from '@/app/lib/types/common';

interface FearlessBan {
  championId: number;
  role: PlayerRole;
}

interface FearlessDraftBansProps {
  customTeamColor: string;
  bans: {
    blue: FearlessBan[];
    red: FearlessBan[];
  };
}

export const FearlessDraftBans: React.FC<FearlessDraftBansProps> = ({ customTeamColor, bans }) => {
  const ROLE_ORDER: FearlessBan['role'][] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

  return (
    <div className="flex flex-row gap-2">
      {ROLE_ORDER.map((role) => {
        const blueBans = bans.blue.filter(ban => ban.role === role);
        const redBans = bans.red.filter(ban => ban.role === role);
        if (blueBans.length === 0 && redBans.length === 0) return null;
        return (
          <div
            key={role}
            className="grid items-center gap-x-1 gap-y-0"
            style={{ gridTemplateColumns: `40px repeat(${redBans.length}, 32px)` }}
          >
            {/* Role icon, spans two rows */}
            <div className="row-span-2 flex items-center justify-center">
              <Image
                height={32}
                width={role === 'SUPPORT' ? 40 : 32}
                src={ROLE_ICONS[role]}
                alt={role}
              />
            </div>
            {/* Blue bans (top row) */}
            {Array.from({ length: redBans.length }).map((_, idx) => (
              <div key={`blue-${role}-${idx}`} className="flex items-center justify-center">
                {blueBans[idx] ? (
                  <Image
                    height={32}
                    width={32}
                    src={getChampionSquareImage(blueBans[idx].championId) || ''}
                    alt={blueBans[idx].championId.toString()}
                    className="w-8 h-8 rounded bg-gray-800 border border-blue-500"
                  />
                ) : null}
              </div>
            ))}
            {/* Red bans (bottom row) */}
            {Array.from({ length: redBans.length }).map((_, idx) => (
              <div key={`red-${role}-${idx}`} className="flex items-center justify-center">
                {redBans[idx] ? (
                  <Image
                    height={32}
                    width={32}
                    src={getChampionSquareImage(redBans[idx].championId) || ''}
                    alt={redBans[idx].championId.toString()}
                    className="w-8 h-8 rounded bg-gray-800 border border-red-500"
                  />
                ) : null}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};