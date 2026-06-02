import type { ImageStorage } from './team';

export interface Commentator {
  id: string;
  name: string;
  profileImage?: ImageStorage;
  socialLinks?: Record<string, string>;
}
