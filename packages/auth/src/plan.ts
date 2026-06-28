import type { Kysely } from "kysely";

import type { Database } from "@lsu/db/types";

export interface PlanLimits {
  maxTournamentsAsOrganizer: number;
  canSyncToCloud: boolean;
  canRequestFeatures: boolean;
}

export const PLAN_LIMITS: Record<"free" | "pro", PlanLimits> = {
  free: {
    maxTournamentsAsOrganizer: 3,
    canSyncToCloud: false,
    canRequestFeatures: false,
  },
  pro: {
    maxTournamentsAsOrganizer: Infinity,
    canSyncToCloud: true,
    canRequestFeatures: true,
  },
};

export async function getUserPlan(db: Kysely<Database>, userId: string): Promise<"free" | "pro"> {
  const user = await db
    .selectFrom("users")
    .select(["plan", "plan_expires_at"])
    .where("id", "=", userId)
    .executeTakeFirst();

  if (!user) return "free" as const;

  if (user.plan === "pro" && user.plan_expires_at && user.plan_expires_at < new Date()) {
    return "free" as const;
  }

  return user.plan;
}

export async function checkPlanLimit(
  db: Kysely<Database>,
  userId: string,
  feature: keyof PlanLimits,
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(db, userId);
  const limits = PLAN_LIMITS[plan];

  if (feature === "maxTournamentsAsOrganizer") {
    const { count } = await db
      .selectFrom("tournaments")
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .where("organizer_id", "=", userId)
      .executeTakeFirstOrThrow();

    if (count >= limits.maxTournamentsAsOrganizer) {
      return {
        allowed: false,
        reason: `Free plan allows ${limits.maxTournamentsAsOrganizer} tournaments. Upgrade to Pro for unlimited.`,
      };
    }

    return { allowed: true };
  }

  const value = limits[feature];
  if (typeof value === "boolean" && !value) {
    return { allowed: false, reason: `This feature requires Pro plan.` };
  }

  return { allowed: true };
}
