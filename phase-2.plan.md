# Phase 2: Roles & Permissions + Paid Plan

## Overview

Both player and organizer roles simultaneously — no separate registration.
Add plan flag (`free` / `pro`) gating features. No Stripe integration yet.

---

## Part A: Player + Organizer Roles

### Current State

The `user_permissions` table already exists with roles: `admin`, `organizer`, `moderator`, `commentator`, `viewer`.
The `tournament_permissions` table provides per-tournament role scoping.

**What's missing:**

- No permission checks in API routes (anyone can create tournaments, edit teams, etc.)
- No team ownership enforcement
- No tournament join request system
- Default role is not assigned on registration

### Step 1: Assign default permissions on registration

Update `packages/auth/src/session.ts` → `register()`:

- After user creation, insert `user_permissions` row with role `viewer`
- All users can create teams (player behavior) and tournaments (organizer behavior) by default

### Step 2: Permission check middleware

Create `packages/auth/src/permissions.ts`:

```typescript
export async function requirePermission(
  db: Kysely<Database>,
  userId: string,
  permission: 'admin' | 'organizer' | 'moderator' | 'commentator' | 'viewer',
): Promise<boolean> { ... }

export async function requireTournamentRole(
  db: Kysely<Database>,
  userId: string,
  tournamentId: string,
  role: 'organizer' | 'moderator' | 'commentator' | 'viewer',
): Promise<boolean> { ... }
```

### Step 3: Enforce ownership in API routes

| Route                                | Rule                                            |
| ------------------------------------ | ----------------------------------------------- |
| `POST /api/v1/teams`                 | Any authenticated user                          |
| `PATCH /api/v1/teams/:id`            | Owner only (`teams.owner_id`)                   |
| `DELETE /api/v1/teams/:id`           | Owner only                                      |
| `POST /api/v1/tournaments`           | Any authenticated user                          |
| `PATCH /api/v1/tournaments/:id`      | Organizer (`tournaments.organizer_id`) or admin |
| `DELETE /api/v1/tournaments/:id`     | Organizer or admin                              |
| `POST /api/v1/tournaments/:id/teams` | Organizer manages, or team join request         |
| `GET /api/v1/admin/*`                | Admin role only                                 |

### Step 4: Tournament join request system

New table: `tournament_join_requests`

```typescript
interface TournamentJoinRequestsTable {
  id: Generated<string>;
  tournament_id: string;
  team_id: string;
  requested_by: string; // user who submitted
  status: 'pending' | 'approved' | 'rejected';
  message: string | null; // optional message from team
  responded_by: string | null; // organizer who responded
  responded_at: Date | null;
  created_at: ColumnType<Date, Date | undefined, never>;
}
```

**API routes:**

- `POST /api/v1/tournaments/:id/join` — team owner submits join request
- `GET /api/v1/tournaments/:id/requests` — organizer sees pending requests
- `PATCH /api/v1/tournaments/:id/requests/:requestId` — approve/reject
- On approve: auto-insert into `tournament_teams`

**UI:**

- Tournament detail page → "Pending Requests" tab (organizer only)
- Team detail page → "Join Tournament" button → modal with tournament search
- Notification badge on tournament nav when pending requests exist

### Step 5: Team invitation system

Allow organizers to invite teams directly:

- `POST /api/v1/tournaments/:id/invite` — sends invite to team owner
- Team owner sees invites in their dashboard → accept/decline
- On accept: auto-insert into `tournament_teams`

New table: `tournament_invitations` (similar structure to join requests, but initiated by organizer)

---

## Part B: Paid Plan Flag

### Step 1: Add plan fields to users table

Add to `UsersTable` in `packages/db/src/types.ts`:

```typescript
plan: ColumnType<'free' | 'pro', 'free' | 'pro' | undefined, 'free' | 'pro'>;
plan_expires_at: Date | null;
```

Migration:

```sql
ALTER TABLE users ADD COLUMN plan VARCHAR(8) NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMPTZ;
```

### Step 2: Feature gates

Create `packages/auth/src/plan.ts`:

```typescript
export interface PlanLimits {
  maxTournamentsAsOrganizer: number;
  canSyncToCloud: boolean;
  canRequestFeatures: boolean;
}

export const PLAN_LIMITS: Record<'free' | 'pro', PlanLimits> = {
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

export async function checkPlanLimit(
  db: Kysely<Database>,
  userId: string,
  feature: keyof PlanLimits,
): Promise<{ allowed: boolean; reason?: string }> { ... }
```

### Step 3: Gate tournament creation

In `POST /api/v1/tournaments`:

- Count user's existing tournaments as organizer
- If `>= PLAN_LIMITS[user.plan].maxTournamentsAsOrganizer`, return 403 with upgrade prompt

### Step 4: UI — Plan status in settings

`/settings` page shows:

- Current plan (Free / Pro)
- Usage: "2 of 3 tournaments used"
- "Upgrade to Pro" CTA (disabled for now, shows "Coming soon" or manual contact)
- If Pro: expiration date, features unlocked

### Step 5: Admin can change user plans

In the super-admin panel (Phase 3):

- Dropdown to change user plan (free/pro)
- Set expiration date
- Logged in `permission_audit` table

---

## New Tables

| Table                      | Description                          |
| -------------------------- | ------------------------------------ |
| `tournament_join_requests` | Teams requesting to join tournaments |
| `tournament_invitations`   | Organizers inviting teams            |

## Files Changed/Created

### New

- `packages/auth/src/permissions.ts` — permission check helpers
- `packages/auth/src/plan.ts` — plan limits + check helpers
- `packages/db/src/migrations/002_join_requests.ts`
- `packages/db/src/migrations/003_plan_fields.ts`
- `apps/web/app/api/v1/tournaments/[id]/join/route.ts`
- `apps/web/app/api/v1/tournaments/[id]/requests/route.ts`
- `apps/web/app/api/v1/tournaments/[id]/requests/[requestId]/route.ts`
- `apps/web/app/api/v1/tournaments/[id]/invite/route.ts`

### Modified

- `packages/db/src/types.ts` — add new table interfaces + plan fields
- `packages/auth/src/session.ts` — assign default role on register
- `packages/auth/src/index.ts` — export new modules
- `apps/web/app/api/v1/teams/` — add ownership checks
- `apps/web/app/api/v1/tournaments/` — add permission checks + plan gates
- `apps/web/app/settings/page.tsx` — plan status section
- Tournament detail page — join requests tab
- Team detail page — join tournament button
