export interface Champion {
  id: number;
  name: string;
  key: string;
  image: string;
  title?: string;
  tags?: string[];
  splashImg?: string;
  loadingImg?: string;
  squareImg?: string;
  spells?: ChampionSpell[];
}

export interface ChampionSpell {
  spellName: string;
  iconAsset: string;
  iconName: string;
  isPassive?: boolean;
}
