import mongoose from 'mongoose';

const BracketNodeSchema = new mongoose.Schema({
    id: { type: String, required: true },
    round: { type: Number, required: true },
    position: { type: Number, required: true },
    team1: { type: String },
    team2: { type: String },
    winner: { type: String },
    score1: { type: Number },
    score2: { type: Number },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    scheduledTime: { type: Date },
    completedAt: { type: Date },
    nextMatchId: { type: String }, // Where winner advances
    loserNextMatchId: { type: String }, // For double elimination
    bracketType: { type: String, enum: ['winner', 'loser', 'grand-final'], required: true }
}, { _id: false });

export const BracketSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    tournamentId: { type: String, required: true, unique: true },
    format: { type: String, enum: ['single-elimination', 'double-elimination'], required: true },
    nodes: [BracketNodeSchema],
    metadata: {
        totalRounds: { type: Number, required: true },
        teamsCount: { type: Number, required: true },
        currentRound: { type: Number, default: 1 },
        status: { type: String, enum: ['setup', 'active', 'completed'], default: 'setup' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Add index for better query performance
BracketSchema.index({ tournamentId: 1 }); 