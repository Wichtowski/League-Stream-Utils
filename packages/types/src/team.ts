import type { ImageFormat } from './image';

export type PlayerRole = 'TOP' | 'JUNGLE' | 'MID' | 'BOTTOM' | 'SUPPORT';

export interface ImageUpload {
  type: 'upload';
  data: string;
  size: number;
  format: ImageFormat;
}

export interface ImageUrl {
  type: 'url';
  url: string;
  size?: number;
  format?: ImageFormat;
}

export type ImageStorage = ImageUpload | ImageUrl;

export interface Player {
  id: string;
  inGameName: string;
  tag: string;
  role: PlayerRole;
  profileImage?: ImageStorage;
  puuid?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  rank?: string;
}

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface Coach {
  name: string;
  profileImage?: ImageStorage;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: ImageStorage;
  colors: TeamColors;
  players: Player[];
  subs?: Player[];
  coach?: Coach;
  country?: string;
}
