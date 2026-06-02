# Phase 5: Seamless UX

## Overview

Polish the app with loading skeletons, optimistic updates, keyboard shortcuts,
page transitions, and consistent feedback patterns. Make every interaction feel instant.

---

## 1. Loading Skeletons

Replace all spinners with content-shaped skeletons that match the final layout.

### Skeleton Components

Create `packages/ui/src/skeleton.tsx` (already exists, expand):

```typescript
// Existing: <Skeleton height="56px" rounded="lg" />

// New variants:
<Skeleton.Card />        // 200×280, rounded-xl, header + 3 lines
<Skeleton.Table rows={5} cols={4} />  // table with header
<Skeleton.Avatar size="md" />         // circle
<Skeleton.Text lines={3} />           // paragraph placeholder
<Skeleton.Badge />                    // small rounded pill
```

### Where to apply

| Page | Current | After |
|------|---------|-------|
| Teams list | Spinner | 6× Skeleton.Card in grid |
| Tournament list | Spinner | 4× Skeleton.Card |
| Admin users | Skeleton rows (already done) | Keep |
| Settings | Spinner | Form skeleton |
| Tournament detail | Spinner | Bracket skeleton + match list skeleton |
| Match detail | Spinner | Score card skeleton |

---

## 2. Optimistic Updates

Use TanStack Query `onMutate` for immediate UI feedback before server confirms.

### Key Interactions

**Team operations:**
```typescript
const updateTeam = useMutation({
  mutationFn: (data) => fetch(...),
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['teams', id] });
    const previous = queryClient.getQueryData(['teams', id]);
    queryClient.setQueryData(['teams', id], old => ({ ...old, ...newData }));
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['teams', id], context.previous);
    toast.error('Failed to update team');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['teams', id] });
  },
});
```

**Apply to:**
- Team create/update/delete
- Tournament create/update/delete
- Player add/remove/update
- Match score update
- Commentator assignment

---

## 3. Toast Notifications

### Consistent Toast Pattern

Create a toast helper in `packages/ui/src/toast.ts`:

```typescript
export const toast = {
  success: (message: string) => { ... },
  error: (message: string) => { ... },
  info: (message: string) => { ... },
  promise: <T>(promise: Promise<T>, messages: { loading; success; error }) => { ... },
};
```

### Usage

```typescript
// Simple
toast.success('Team created');
toast.error('Failed to delete tournament');

// Promise-based (shows loading → success/error automatically)
toast.promise(createTeam(data), {
  loading: 'Creating team...',
  success: 'Team created!',
  error: 'Failed to create team',
});
```

### Standard Messages

| Action | Success | Error |
|--------|---------|-------|
| Create team | "Team created" | "Failed to create team" |
| Delete team | "Team deleted" | "Failed to delete team" |
| Create tournament | "Tournament created" | "Failed to create tournament" |
| Update match score | "Score updated" | "Failed to update score" |
| Lock user (admin) | "User locked" | "Failed to lock user" |

---

## 4. Page Transitions

### View Transitions API

Vinext supports the View Transitions API. Add cross-fade transitions between pages:

```css
/* globals.css */
::view-transition-old(root) {
  animation: fade-out 150ms ease-out;
}

::view-transition-new(root) {
  animation: fade-in 150ms ease-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Route-Specific Transitions

For wizard steps (team/tournament creation): slide left/right based on step direction.
For modal-like pages: scale up from center.

---

## 5. Keyboard Shortcuts

### Command Palette (Cmd/Ctrl + K)

Create `apps/web/app/_components/command-palette.tsx`:

```
┌─────────────────────────────────────┐
│ 🔍 Type a command or search...      │
├─────────────────────────────────────┤
│ Navigation                          │
│   ▸ Go to Teams           ⌘+T      │
│   ▸ Go to Tournaments     ⌘+O      │
│   ▸ Go to Settings        ⌘+,      │
│   ▸ Go to Admin           ⌘+A      │
│ Actions                             │
│   ▸ Create Team           ⌘+N      │
│   ▸ Create Tournament               │
│   ▸ Toggle Theme                    │
│ Search                              │
│   ▸ Search teams...                 │
│   ▸ Search tournaments...           │
│   ▸ Search players...               │
└─────────────────────────────────────┘
```

**Implementation:**
- `cmdk` library (or custom) for command palette UI
- Registered commands via a context provider
- Each module can register its own commands
- Global keyboard listener for Cmd+K

### Page-Level Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Open command palette |
| `Escape` | Close modal/palette, go back |
| `Cmd+N` | Create new (context-dependent: team on teams page, tournament on tournaments page) |
| `Cmd+S` | Save current form |
| `/` | Focus search input (when available) |

---

## 6. Breadcrumbs

Add breadcrumb navigation for nested pages:

```
Tournaments > Spring Split 2026 > Round 1 - Match 3
Teams > T1 > Player: Faker
```

Create `apps/web/app/_components/breadcrumbs.tsx`:

```typescript
interface Breadcrumb {
  label: string;
  href?: string; // last item has no link
}

function Breadcrumbs({ items }: { items: Breadcrumb[] }) { ... }
```

Each module page sets breadcrumbs via a context or layout props.

---

## 7. Offline Indicator Enhancements

**Already done:** Amber badge in sidebar.

**Enhancements:**
- Clicking the badge opens a popover: "You're in offline mode. Data is stored locally."
  - "Switch to online" button (navigates to settings)
  - "Last synced: Never" (for future Phase 6)
- When trying to access online-only features (e.g., email verification), show inline message instead of error

---

## 8. Responsive Considerations

While primarily a desktop app, ensure the web version works on tablets:
- Sidebar collapses to icon-only on screens < 1024px
- Module grid goes from 3 columns to 2 on tablets
- Forms stack vertically on narrow screens
- Command palette is full-width on mobile

---

## Files Changed/Created

### New
- `apps/web/app/_components/command-palette.tsx`
- `apps/web/app/_components/breadcrumbs.tsx`
- `packages/ui/src/toast.ts` (helper, or expand existing)
- `packages/ui/src/skeleton.tsx` (new variants)

### Modified
- `apps/web/app/globals.css` — view transition keyframes
- `apps/web/app/providers.tsx` — add CommandPaletteProvider
- `apps/web/app/_components/side-nav.tsx` — responsive collapse, offline popover
- `apps/web/app/modules/*/page.tsx` — all pages: spinners → skeletons, add breadcrumbs
- All mutation hooks — add optimistic updates + toast notifications
