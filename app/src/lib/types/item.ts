export interface Item {
  id: string;
  name: string;
  description: string;
  plaintext: string;
  cost: number;
  sellValue: number;
  tags: string[];
  stats: { [key: string]: number };
  image: string;
  buildPath: {
    into: string[];
    from: string[];
  };
}
