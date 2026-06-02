export interface Commentator {
  _id?: string;
  id?: string;
  name: string;
  xHandle?: string;
  instagramHandle?: string;
  twitchHandle?: string;
  createdBy?: string;
  createdAt?: Date;
}

export interface MatchPrediction {
  commentatorId: string;
  commentatorUsername: string;
  prediction: "blue" | "red";
  blueScore?: number;
  redScore?: number;
  confidence?: number;
  submittedAt: Date;
}
