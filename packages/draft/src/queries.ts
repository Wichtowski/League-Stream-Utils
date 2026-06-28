import { draftSessionModel, isMongoConfigured } from "@lsu/db-mongo";

export async function getSessions(limit = 50) {
  if (!isMongoConfigured()) return [];

  return draftSessionModel.find().sort({ createdAt: -1 }).limit(limit).lean();
}

export async function getSession(sessionId: string) {
  if (!isMongoConfigured()) return null;

  return draftSessionModel.findOne({ sessionId }).lean();
}

export async function createSession(data: {
  sessionId: string;
  type?: "static" | "lcu" | "tournament" | "web";
  config: Record<string, unknown>;
  teams: { blue: Record<string, unknown>; red: Record<string, unknown> };
  createdBy: string;
  password?: string;
}) {
  return draftSessionModel.create({
    ...data,
    status: "waiting",
    currentPhase: "ban1",
    currentTeam: "blue",
    turnNumber: 0,
    timer: { remaining: 30, totalTime: 30, isActive: false },
    actions: [],
  });
}

export async function updateSessionState(
  sessionId: string,
  update: {
    currentPhase?: string;
    currentTeam?: "blue" | "red";
    turnNumber?: number;
    status?: "waiting" | "active" | "paused" | "completed";
    timer?: { remaining: number; totalTime: number; isActive: boolean; startedAt?: Date };
    startedAt?: Date;
    completedAt?: Date;
  },
) {
  return draftSessionModel.findOneAndUpdate(
    { sessionId },
    { $set: update },
    { new: true, lean: true },
  );
}

export async function pushAction(
  sessionId: string,
  action: {
    type: "pick" | "ban";
    championId: number;
    teamSide: "blue" | "red";
    phase: string;
  },
) {
  return draftSessionModel.findOneAndUpdate(
    { sessionId },
    { $push: { actions: { ...action, timestamp: new Date(), undone: false } } },
    { new: true, lean: true },
  );
}

export async function undoLastAction(sessionId: string) {
  const session = await draftSessionModel.findOne({ sessionId });
  if (!session || session.actions.length === 0) return null;

  const lastAction = session.actions[session.actions.length - 1];
  lastAction.undone = true;
  await session.save();

  return session.toObject();
}

export async function deleteSession(sessionId: string) {
  await draftSessionModel.deleteOne({ sessionId });
}
