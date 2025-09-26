import { Schema } from "mongoose";
import { Role } from "@lib/types/permissions";

// Schema for tournament-specific permissions
export const TournamentPermissionSchema = new Schema(
  {
    tournamentId: {
      type: String,
      required: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true
    },
    grantedBy: {
      type: String,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
TournamentPermissionSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });
TournamentPermissionSchema.index({ tournamentId: 1, role: 1 });
TournamentPermissionSchema.index({ userId: 1, isActive: 1 });
TournamentPermissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Schema for global user permissions
export const UserPermissionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true
    },
    grantedBy: {
      type: String,
      required: true
    },
    grantedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    scope: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for efficient queries
UserPermissionSchema.index({ userId: 1, role: 1 }, { unique: true });
UserPermissionSchema.index({ userId: 1, isActive: 1 });
UserPermissionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Schema for permission audit log
export const PermissionAuditSchema = new Schema(
  {
    action: {
      type: String,
      enum: ["GRANT", "REVOKE", "UPDATE", "EXPIRE"],
      required: true
    },
    targetUserId: {
      type: String,
      required: true
    },
    targetRole: {
      type: String,
      enum: Object.values(Role),
      required: true
    },
    performedBy: {
      type: String,
      required: true
    },
    tournamentId: {
      type: String,
      required: false
    },
    reason: {
      type: String,
      required: false
    },
    metadata: {
      type: Schema.Types.Mixed,
      required: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes for audit queries
PermissionAuditSchema.index({ targetUserId: 1, createdAt: -1 });
PermissionAuditSchema.index({ performedBy: 1, createdAt: -1 });
PermissionAuditSchema.index({ tournamentId: 1, createdAt: -1 });
PermissionAuditSchema.index({ action: 1, createdAt: -1 });

// Schema for permission requests (when users request access)
export const PermissionRequestSchema = new Schema(
  {
    requesterId: {
      type: String,
      required: true
    },
    requestedRole: {
      type: String,
      enum: Object.values(Role),
      required: true
    },
    tournamentId: {
      type: String,
      required: false
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "EXPIRED"],
      default: "PENDING"
    },
    reviewedBy: {
      type: String,
      required: false
    },
    reviewedAt: {
      type: Date,
      required: false
    },
    reviewNotes: {
      type: String,
      required: false
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  },
  {
    timestamps: true
  }
);

// Indexes for permission requests
PermissionRequestSchema.index({ requesterId: 1, status: 1 });
PermissionRequestSchema.index({ tournamentId: 1, status: 1 });
PermissionRequestSchema.index({ status: 1, createdAt: -1 });
PermissionRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
