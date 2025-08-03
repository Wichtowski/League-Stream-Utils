import { Schema } from 'mongoose';
import { ImageStorageSchema, PlayerSchema, StaffSchema } from './common';
import { Player } from '@lib/types/game';

// Sponsor schema
export const SponsorSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    logo: { type: ImageStorageSchema, required: true },
    website: { type: String },
    tier: { type: String, enum: ['title', 'presenting', 'official', 'partner'], required: true },
    displayPriority: { type: Number, default: 0 }
}, { _id: false });

export const TeamSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    tag: { type: String, required: true },
    logo: { type: ImageStorageSchema, required: true },

    colors: {
        primary: { type: String, required: true },
        secondary: { type: String, required: true },
        accent: { type: String, required: true }
    },

    players: {
        main: { type: [PlayerSchema], required: true, validate: [(val: Player[]) => val.length === 5, 'Main roster must have exactly 5 players'] },
        substitutes: { type: [PlayerSchema], default: [] }
    },

    staff: {
        coach: { type: StaffSchema },
        analyst: { type: StaffSchema },
        manager: { type: StaffSchema }
    },

    region: { type: String, required: true },
    tier: { type: String, enum: ['amateur', 'semi-pro', 'professional'], required: true },
    founded: { type: Date, default: Date.now },

    verified: { type: Boolean, default: false },
    verificationSubmittedAt: { type: Date },

    socialMedia: {
        twitter: { type: String },
        discord: { type: String },
        website: { type: String }
    },

    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const TournamentSchema = new Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    abbreviation: { type: String, required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    requireRegistrationDeadline: { type: Boolean, default: false },
    registrationDeadline: {
        type: Date,
        required: false
    },

    matchFormat: { type: String, enum: ['BO1', 'BO3', 'BO5'], required: true },
    tournamentFormat: { type: String, enum: ['Ladder', 'Swiss into Ladder', 'Round Robin into Ladder', 'Groups'], required: true },

    // Phase-specific match formats for advanced tournaments
    phaseMatchFormats: {
        roundRobin: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        swiss: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        groups: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        ladder: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        semifinals: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        finals: { type: String, enum: ['BO1', 'BO3', 'BO5'] },
        default: { type: String, enum: ['BO1', 'BO3', 'BO5'] }
    },

    maxTeams: { type: Number, required: true },
    registrationOpen: { type: Boolean, default: true },
    prizePool: { type: Number },
    fearlessDraft: { type: Boolean, default: false },

    logo: { type: ImageStorageSchema, required: true },

    registeredTeams: [{ type: String }],
    selectedTeams: [{ type: String }],

    status: { type: String, enum: ['draft', 'registration', 'ongoing', 'completed', 'cancelled'], default: 'draft' },

    matches: [{ type: String }],

    allowSubstitutes: { type: Boolean, default: true },
    maxSubstitutes: { type: Number, default: 2 },

    timezone: { type: String, required: true },
    matchDays: [{ type: String }],
    defaultMatchTime: { type: String, required: true },

    streamUrl: { type: String },
    broadcastLanguage: { type: String },

    // Sponsors
    sponsors: { type: [SponsorSchema], default: [] },

    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

TeamSchema.index({ userId: 1 });
TeamSchema.index({ name: 1 });
TeamSchema.index({ tag: 1 });
TeamSchema.index({ 'players.main.puuid': 1 });

TournamentSchema.index({ userId: 1 });
TournamentSchema.index({ status: 1 });
TournamentSchema.index({ startDate: 1 });
TournamentSchema.index({ registrationDeadline: 1 }); 
