// MongoDB init script — runs on first container start
db = db.getSiblingDB('league_stream_utils');

db.createCollection('draft_sessions');
db.createCollection('camera_configs');

db.draft_sessions.createIndex({ sessionId: 1 }, { unique: true });
db.draft_sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // TTL: 24h
db.camera_configs.createIndex({ teamId: 1, userId: 1 }, { unique: true });
