import { Schema } from "mongoose";

export const PlayerStatsSchema = new Schema({
  // Core IDs
  playerId: { type: String, required: true, index: true },
  teamId: { type: String, required: true, index: true },
  gameId: { type: String, required: true, index: true },
  tournamentId: { type: String, required: false, index: true },
  matchId: { type: String, required: false, index: true },

  // Champion Info
  championId: { type: Number, required: true },
  championName: { type: String, required: true },
  championRole: {
    type: String,
    enum: ["TOP", "JUNGLE", "MID", "BOTTOM", "SUPPORT"],
    required: true
  },
  championLane: { type: String, required: true },
  championLevel: { type: Number, required: true },
  championMastery: { type: Number, required: false },
  championPoints: { type: Number, required: false },

  // Game Context
  side: { type: String, enum: ["blue", "red"], required: true },
  gameMode: { type: String, required: true },
  queueType: { type: String, required: true },
  patch: { type: String, required: true },
  duration: { type: Number, required: true }, // in seconds
  result: { type: String, enum: ["win", "loss"], required: true },
  surrender: { type: Boolean, default: false },
  remake: { type: Boolean, default: false },

  // Performance Stats
  stats: {
    kda: {
      kills: { type: Number, required: true, default: 0 },
      deaths: { type: Number, required: true, default: 0 },
      assists: { type: Number, required: true, default: 0 }
    },
    cs: { type: Number, required: true, default: 0 },
    csPerMinute: { type: Number, required: true, default: 0 },
    gold: { type: Number, required: true, default: 0 },
    goldPerMinute: { type: Number, required: true, default: 0 },
    damageDealt: { type: Number, required: true, default: 0 },
    damageTaken: { type: Number, required: true, default: 0 },
    visionScore: { type: Number, required: true, default: 0 },
    wardsPlaced: { type: Number, required: true, default: 0 },
    wardsDestroyed: { type: Number, required: true, default: 0 },
    objectiveParticipation: {
      baron: { type: Boolean, default: false },
      dragon: { type: Boolean, default: false },
      herald: { type: Boolean, default: false },
      towers: { type: Number, default: 0 }
    },
    firstBlood: { type: Boolean, default: false },
    firstTower: { type: Boolean, default: false }
  },

  // Tournament Context
  tournament: {
    round: { type: String, required: false },
    matchNumber: { type: Number, required: false },
    seriesId: { type: String, required: false }
  },

  // Timestamps
  playedAt: { type: Date, required: true },
  recordedAt: { type: Date, required: true, default: Date.now },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
});

// Indexes for efficient querying
PlayerStatsSchema.index({ playerId: 1, tournamentId: 1 });
PlayerStatsSchema.index({ teamId: 1, tournamentId: 1 });
PlayerStatsSchema.index({ championId: 1, playerId: 1 });
PlayerStatsSchema.index({ playedAt: -1 });
PlayerStatsSchema.index({ "stats.kda.kills": -1 });
PlayerStatsSchema.index({ "stats.csPerMinute": -1 });
PlayerStatsSchema.index({ "stats.goldPerMinute": -1 });
