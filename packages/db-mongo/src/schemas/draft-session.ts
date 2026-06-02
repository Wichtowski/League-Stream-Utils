import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
type Document = mongoose.Document;

interface draftActionDoc {
  type: 'pick' | 'ban';
  championId: number;
  teamSide: 'blue' | 'red';
  phase: string;
  timestamp: Date;
  undone?: boolean;
}

export interface draftSessionDoc extends Document {
  sessionId: string;
  type: 'static' | 'lcu' | 'tournament' | 'web';
  config: Record<string, unknown>;
  status: 'waiting' | 'active' | 'paused' | 'completed';
  currentPhase: string;
  currentTeam: 'blue' | 'red';
  turnNumber: number;
  timer: {
    remaining: number;
    totalTime: number;
    isActive: boolean;
    startedAt?: Date;
  };
  teams: {
    blue: Record<string, unknown>;
    red: Record<string, unknown>;
  };
  actions: draftActionDoc[];
  password?: string;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const draftActionSchema = new Schema<draftActionDoc>(
  {
    type: { type: String, enum: ['pick', 'ban'], required: true },
    championId: { type: Number, required: true },
    teamSide: { type: String, enum: ['blue', 'red'], required: true },
    phase: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    undone: { type: Boolean, default: false },
  },
  { _id: true },
);

const draftSessionSchema = new Schema<draftSessionDoc>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['static', 'lcu', 'tournament', 'web'], default: 'web' },
    config: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['waiting', 'active', 'paused', 'completed'],
      default: 'waiting',
    },
    currentPhase: { type: String, default: 'ban1' },
    currentTeam: { type: String, enum: ['blue', 'red'], default: 'blue' },
    turnNumber: { type: Number, default: 0 },
    timer: {
      remaining: { type: Number, default: 30 },
      totalTime: { type: Number, default: 30 },
      isActive: { type: Boolean, default: false },
      startedAt: Date,
    },
    teams: {
      blue: { type: Schema.Types.Mixed, default: {} },
      red: { type: Schema.Types.Mixed, default: {} },
    },
    actions: { type: [draftActionSchema], default: [] },
    password: String,
    createdBy: { type: String, required: true },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);

draftSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const draftSessionModel =
  (models['draftSession'] as ReturnType<typeof model<draftSessionDoc>>) ??
  model<draftSessionDoc>('draftSession', draftSessionSchema, 'draft_sessions');
