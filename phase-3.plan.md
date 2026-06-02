# Phase 3: Super-Admin Panel

## Overview

Expand the existing admin page (`/modules/admin`) from basic user lock/delete
into a full system management dashboard with tabs.

---

## Current State

The admin page at `apps/web/app/modules/admin/page.tsx` currently has:

- User list with username, email, role badge, status badge, last login
- Lock/unlock toggle (PATCH)
- Delete user (DELETE)
- Fetches from `GET /api/v1/admin/users`

---

## Proposed Layout

```
/modules/admin
  ├── Users tab (default)
  ├── Tournaments tab
  ├── Security tab
  └── System tab
```

### Tab 1: Users (expanded)

**Current features (keep):**

- User list, lock/unlock, delete

**New features:**

- **Change role**: Dropdown to assign global role (admin, organizer, moderator, viewer)
- **Change plan**: Dropdown (free/pro) + expiration date picker
- **Impersonate**: "Login as" button — admin gets a temporary session as that user
  - Creates a special session with `impersonated_by` field
  - Yellow banner at top: "You are impersonating {user}. [End session]"
  - Useful for debugging user-reported issues
- **Force password reset**: Sets a flag, user must change password on next login
- **View sessions**: Expandable row showing active sessions (IP, user agent, last used)
- **Resend verification**: Button to resend email verification
- **Search & filter**: Filter by role, plan, status, email verified
- **Bulk actions**: Select multiple users → bulk lock/unlock/delete

**New API routes:**

- `PATCH /api/v1/admin/users/:id/role` — change global role
- `PATCH /api/v1/admin/users/:id/plan` — change plan
- `POST /api/v1/admin/users/:id/impersonate` — start impersonation session
- `POST /api/v1/admin/users/:id/force-reset` — flag for forced password change
- `POST /api/v1/admin/users/:id/resend-verification` — trigger verification email
- `GET /api/v1/admin/users/:id/sessions` — list active sessions

### Tab 2: Tournaments

**Features:**

- All tournaments across all users (not just the admin's own)
- Stats: total, by status (draft/active/completed), by type
- Click to view tournament detail
- Force-close/cancel tournament
- Reassign organizer
- Delete tournament

**API routes:**

- `GET /api/v1/admin/tournaments` — all tournaments with organizer info
- `PATCH /api/v1/admin/tournaments/:id` — force status change, reassign organizer
- `DELETE /api/v1/admin/tournaments/:id` — force delete

### Tab 3: Security

**Features:**

- Recent security events (login_success, login_failed, user_registered, password_changed)
  - Uses existing `security_events` table
  - Filterable by event type, user, date range
- Recent login attempts (from `login_attempts` table)
  - Show failed attempts by IP — detect brute force
- Active sessions count (from `sessions` table where `is_valid = true`)
- Rate limit status overview

**API routes:**

- `GET /api/v1/admin/security/events` — paginated security events
- `GET /api/v1/admin/security/login-attempts` — recent attempts with filters
- `GET /api/v1/admin/security/sessions` — active session count + details

### Tab 4: System

**Features:**

- App version
- Database status (Postgres connection test)
- MinIO status (storage health check)
- Asset download stats (DDragon version, total assets cached)
- Docker container status (if accessible)
- Environment info (Node version, memory usage)

**API routes:**

- `GET /api/v1/admin/system/health` — aggregated health checks

---

## UI Components

### Tab navigation

```typescript
const ADMIN_TABS = [
  { key: 'users', label: 'Users', icon: HiUsers },
  { key: 'tournaments', label: 'Tournaments', icon: HiTrophy },
  { key: 'security', label: 'Security', icon: HiShieldCheck },
  { key: 'system', label: 'System', icon: HiServerStack },
];
```

Use query params for tab state: `/modules/admin?tab=security`

### Impersonation banner

Global component in layout — checks for `impersonated_by` claim in JWT:

```tsx
function ImpersonationBanner() {
  // If current session has impersonated_by, show yellow warning bar
  return (
    <div className="fixed top-0 left-56 right-0 z-50 bg-amber-500 px-4 py-2 text-sm text-black">
      You are impersonating <strong>{originalUser}</strong>.
      <button onClick={endImpersonation}>End session</button>
    </div>
  );
}
```

---

## Files Changed/Created

### New

- `apps/web/app/modules/admin/_components/users-tab.tsx`
- `apps/web/app/modules/admin/_components/tournaments-tab.tsx`
- `apps/web/app/modules/admin/_components/security-tab.tsx`
- `apps/web/app/modules/admin/_components/system-tab.tsx`
- `apps/web/app/modules/admin/_components/impersonation-banner.tsx`
- `apps/web/app/api/v1/admin/users/[userId]/role/route.ts`
- `apps/web/app/api/v1/admin/users/[userId]/plan/route.ts`
- `apps/web/app/api/v1/admin/users/[userId]/impersonate/route.ts`
- `apps/web/app/api/v1/admin/users/[userId]/force-reset/route.ts`
- `apps/web/app/api/v1/admin/users/[userId]/sessions/route.ts`
- `apps/web/app/api/v1/admin/tournaments/route.ts`
- `apps/web/app/api/v1/admin/tournaments/[id]/route.ts`
- `apps/web/app/api/v1/admin/security/events/route.ts`
- `apps/web/app/api/v1/admin/security/login-attempts/route.ts`
- `apps/web/app/api/v1/admin/security/sessions/route.ts`
- `apps/web/app/api/v1/admin/system/health/route.ts`

### Modified

- `apps/web/app/modules/admin/page.tsx` — refactor into tabbed layout
- `packages/auth/src/jwt.ts` — add `impersonated_by` field to JWT payload
- `apps/web/app/modules/layout.tsx` — add ImpersonationBanner

---

## Security Considerations

- All admin routes must verify `isAdmin` via `withAuth` middleware
- Impersonation sessions are time-limited (1 hour max)
- Impersonation creates an audit log entry in `permission_audit`
- Admins cannot impersonate other admins
- Force password reset adds a `must_change_password` flag to the users table
