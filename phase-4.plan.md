# Phase 4: Onboarding & Happy Path

## Overview

Guide new users from registration to their first tournament match.
Replace empty states with actionable prompts. Create step-by-step wizards.

---

## The Happy Path

```
Register → Verify email → Land on /modules → Empty state with two paths:
  ├── "I'm a player"  → Create team wizard → Join tournament → View matches
  └── "I'm organizing" → Create tournament wizard → Add teams → Generate bracket → Run matches
```

Both paths are available simultaneously — user is not locked into one.

---

## Step 1: Welcome Screen (Empty State on /modules)

When user has no teams AND no tournaments, show welcome instead of empty modules:

```tsx
function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center gap-8 py-20">
      <h2>Welcome to League Stream Utils</h2>
      <p>Let's get you set up. What would you like to do first?</p>

      <div className="grid grid-cols-2 gap-4">
        <WelcomeCard
          icon={HiUserGroup}
          title="Create a Team"
          description="Build your roster, set team colors, and get ready to compete."
          href="/modules/teams/new"
        />
        <WelcomeCard
          icon={HiTrophy}
          title="Organize a Tournament"
          description="Set up brackets, invite teams, and manage matches."
          href="/modules/tournaments/new"
        />
      </div>
    </div>
  );
}
```

This only shows once — after creating any team or tournament, the normal module grid appears.

---

## Step 2: Team Creation Wizard

Route: `/modules/teams/new`

### Wizard Steps

**Step 1: Team Identity**

- Team name (required)
- Tag / abbreviation (required, max 5 chars)
- Country (optional, flag dropdown)
- Logo upload (optional, uses new storage system from Phase 1)

**Step 2: Team Colors**

- Primary, secondary, accent color pickers
- Live preview of team card with chosen colors
- Preset color schemes (popular esports teams as inspiration)

**Step 3: Roster**

- Add players: in-game name, tag, role (TOP/JGL/MID/BOT/SUP), sub flag
- Optional: link Riot account (PUUID lookup via Riot API)
- Optional: first name, last name, country
- Minimum 1 player to proceed

**Step 4: Staff (optional)**

- Add coach, manager, analyst
- Skip button available

**Step 5: Review & Create**

- Summary card showing team identity + roster
- "Create Team" button

### UI Approach

- Multi-step form with progress indicator at top
- Each step is a separate component, shared state via React context or Zustand
- Back/Next navigation, form validation per step
- All data submitted as one API call on final step

---

## Step 3: Tournament Creation Wizard

Route: `/modules/tournaments/new`

### Wizard Steps

**Step 1: Basic Info**

- Tournament name (required)
- Description (optional, markdown editor)
- Logo upload (optional)
- Start/end date range picker

**Step 2: Format**

- Tournament type: Ladder, Swiss, Round Robin, Groups
  - Visual card for each with brief explanation + diagram
  - Ladder: "Single/double elimination bracket"
  - Swiss: "Teams play N rounds, matched by record"
  - Round Robin: "Everyone plays everyone"
  - Groups: "Group stage → knockout"
- Match format: Bo1, Bo3, Bo5
  - Explanation of each

**Step 3: Teams**

- Three options:
  1. "Add from my teams" — select teams you own
  2. "Invite teams" — search by team name/tag, send invitation (Phase 2 feature)
  3. "Open registration" — generate a join link teams can use
- Minimum 2 teams to proceed (can add more later)
- Drag to reorder for seeding

**Step 4: Review & Create**

- Summary: name, type, format, team count
- "Create Tournament" → redirects to tournament detail
- After creation: prompt to generate bracket

### Post-Creation Flow

- Tournament detail page shows "Generate Bracket" button
- Bracket generation is automatic based on type + seeded teams
- Matches are pre-populated from bracket
- Each match can be clicked to set scores

---

## Step 4: Match Flow

Route: `/modules/tournaments/:id/matches/:matchId`

### Match Detail Page

**Header:** Blue Team vs Red Team, format badge (Bo3), status

**Score Entry:**

- Per-game score buttons (Blue win / Red win)
- Auto-advances series score
- When series is decided, auto-mark match complete

**Optional Integrations:**

- Link pick/ban session (from Pick & Ban module)
- Link commentators (from Commentators module)
- Link camera feeds (from Cameras module)
- Set scheduled time

**Match Complete:**

- Update bracket automatically
- Next match in bracket unlocks (if applicable)
- Standings/ladder updates

---

## Step 5: Module-Level Empty States

Replace generic error messages with helpful empty states:

| Module       | Empty State                                                               |
| ------------ | ------------------------------------------------------------------------- |
| Teams        | "No teams yet" + "Create your first team" button                          |
| Tournaments  | "No tournaments yet" + "Create a tournament" button                       |
| Commentators | "No commentators added" + "Add a commentator" button                      |
| Cameras      | "No camera feeds configured" + "Add a camera" button                      |
| Pick & Ban   | "No draft sessions" + brief explanation of how to create one from a match |

Each empty state:

- Centered layout with icon, heading, description
- Primary action button
- Optional "Learn more" link

---

## Step 6: Progress Indicators

### Dashboard Stats (on /modules main page)

For users who have data, show quick stats:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  3 Teams     │  │  2 Active    │  │  12 Matches  │
│              │  │  Tournaments │  │  Completed   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Tournament Progress

On tournament card in list view:

- Progress bar: "4 of 7 matches completed"
- Next match indicator
- Status badge (Draft → Registration → Active → Completed)

---

## Files Changed/Created

### New

- `apps/web/app/modules/_components/welcome-screen.tsx`
- `apps/web/app/modules/_components/empty-state.tsx` (reusable)
- `apps/web/app/modules/_components/module-stats.tsx`
- `apps/web/app/modules/teams/new/page.tsx` (wizard)
- `apps/web/app/modules/teams/new/_components/step-identity.tsx`
- `apps/web/app/modules/teams/new/_components/step-colors.tsx`
- `apps/web/app/modules/teams/new/_components/step-roster.tsx`
- `apps/web/app/modules/teams/new/_components/step-staff.tsx`
- `apps/web/app/modules/teams/new/_components/step-review.tsx`
- `apps/web/app/modules/tournaments/new/page.tsx` (wizard)
- `apps/web/app/modules/tournaments/new/_components/step-info.tsx`
- `apps/web/app/modules/tournaments/new/_components/step-format.tsx`
- `apps/web/app/modules/tournaments/new/_components/step-teams.tsx`
- `apps/web/app/modules/tournaments/new/_components/step-review.tsx`
- `apps/web/app/modules/tournaments/[id]/matches/[matchId]/page.tsx` (match detail)

### Modified

- `apps/web/app/modules/page.tsx` — add welcome screen + stats
- `apps/web/app/modules/teams/page.tsx` — add empty state
- `apps/web/app/modules/tournaments/page.tsx` — add empty state + progress bars
- `apps/web/app/modules/commentators/page.tsx` — add empty state
- `apps/web/app/modules/cameras/page.tsx` — add empty state
