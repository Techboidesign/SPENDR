Add an onboarding and authentication flow to an EXISTING finance tracking app. 

## CRITICAL CONSTRAINTS — READ FIRST

1. **This app is already built.** Do NOT modify existing screens, components, routes, styles, or business logic. Your work is purely additive.
2. **Match the existing design system exactly.** Before writing any UI code:
   - Locate and read the existing design tokens (colors, typography, spacing, radii, shadows)
   - Identify the existing component library (buttons, inputs, modals, etc.) and REUSE those components — do not create new variants
   - Match the existing font families, weights, and sizes
   - Match the existing icon set
   - If any token, component, or pattern is unclear, STOP and ask before proceeding
3. **Only add these screens:** Welcome, Sign Up, Log In, Forgot Password (if not already present), and the onboarding wizard steps. Nothing else. No new dashboard screens, no new settings screens, no new utility pages.
4. **Use the existing categories.** Do not invent a new category system. The app already has these defaults:
   Rent, Groceries, Dining, Transport, Subscriptions, Entertainment, Health, Shopping, Utilities, Other
   Read them from wherever they currently live in the codebase. Do not duplicate or redefine them.
5. **Do not touch the existing data model** except to add fields needed for onboarding state and any user profile fields that don't already exist. Ask before adding any field.

## DISCOVERY STEP (do this first, before coding)

Report back with:
- Where design tokens live (file paths)
- Which UI primitives exist that you'll reuse (Button, Input, Screen wrapper, etc.)
- Where the existing categories are defined
- Where user/profile state currently lives (if any)
- The existing routing/navigation pattern
- The existing storage mechanism

Then propose the integration plan. Wait for approval before building.

## ARCHITECTURE & STATE

Persist onboarding state under a single namespaced key, e.g. `finance.onboarding`:

```ts
type OnboardingState = {
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  completedSteps: string[];
  lastStepId: string | null;
  data: Partial<OnboardingData>;
  completedAt: string | null;
  version: 1;
};

type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  method: 'email' | 'google' | 'apple' | null;
};
```

On app launch, route based on this matrix:
- No auth + no onboarding → Welcome screen
- No auth + onboarding completed → Login screen
- Authenticated + onboarding not completed → Resume onboarding at `lastStepId`
- Authenticated + onboarding completed → existing main app entry point (do not modify it)
- Authenticated + onboarding skipped → existing main app entry point, with a dismissible "Complete your profile" banner ONLY IF a banner component already exists; otherwise skip the banner

## FLOW SEQUENCE

### 1. Welcome (1 screen)
App logo, one-line value prop, **Sign Up** (primary) and **Log In** (secondary) CTAs.

### 2. Authentication

**Sign Up:**
- Email + password (strength indicator, min 8 chars, 1 number, 1 symbol)
- Continue with Google / Apple
- Terms & Privacy checkbox (required)
- Link to Log In

**Log In:**
- Email + password
- Social login parity
- Forgot password link
- Link to Sign Up

### 3. Onboarding Wizard

Every step: progress indicator, **Back**, **Skip**, **Next**. Global "Skip onboarding" link in the top corner of every step. Persist on every transition.

**Step 3.1 — Name & basics**
- First name (optional)
- Preferred currency (default from device locale)
- Country (auto-detected, editable)

**Step 3.2 — Primary goal** (single-select)
- Save money
- Track spending
- Pay off debt
- Build an emergency fund
- Invest / grow wealth
- Just exploring

**Step 3.3 — Monthly income (REQUIRED)**
- Numeric input with currency prefix, labeled "Monthly income"
- This step cannot be skipped via the per-step Skip button. Skip is hidden or disabled here.
- Fallback: if the user taps a "I'd rather not enter my income" link below the input, the label switches to **"Available money to spend monthly"** and that value is collected instead. Store which variant was used:
```ts
  monthlyAmount: { value: number; type: 'income' | 'available_to_spend' }
```
- The global "Skip onboarding" link still works here — skipping the entire flow is always allowed, but advancing past this step requires a value.
- Optional secondary field: income frequency (monthly / bi-weekly / weekly / irregular) — only shown if type is 'income'

**Step 3.4 — Monthly budget**
- Numeric input for total monthly budget, currency prefix
- Pre-fill suggested allocation using the EXISTING categories from the app (read from wherever they're defined — do not hardcode)
- Skippable

**Step 3.5 — Expense categories**
- Display all existing default categories as pre-selected, editable chips/toggles:
  Rent, Groceries, Dining, Transport, Subscriptions, Entertainment, Health, Shopping, Utilities, Other
- User can deselect any of them (deselecting hides them from their personal view; do NOT delete the global category)
- "Add custom category" affordance at the end of the list — opens an inline input for name (and icon/color if the existing category model supports those fields; match the existing schema exactly)
- Custom categories are added to the user's category list using the same data model the app already uses. Do not create a parallel model.
- Skippable

**Step 3.6 — Notification preferences**
- Toggles: budget alerts, weekly summary, bill reminders, goal milestones
- Request OS notification permission only if at least one toggle is on
- Skippable

**Step 3.7 — Completion**
- Summary of what was set up
- "You can change any of this later in Settings" (only mention Settings if the app already has a Settings screen — verify first)
- Primary CTA routes to the existing main app entry point

## BEHAVIOR REQUIREMENTS

1. **Monthly amount is the only hard gate.** Every other step is individually skippable. The entire flow is skippable via the global link at any point.
2. **Resumable**: closing mid-flow and reopening lands on `lastStepId` with prior data pre-filled.
3. **Persist on every transition** (Next, Skip, Back).
4. **Idempotent routing**: a single `getOnboardingRoute()` function is the source of truth for launch routing.
5. **Settings parity**: every onboarding value must map to an existing settings field if one exists. If a setting doesn't yet exist for a value, flag it and ask — do not silently create new settings UI.
6. **Accessibility**: labeled inputs, logical focus order, WCAG AA contrast (inherit from existing tokens), 44pt min tap targets, screen-reader friendly.

## DELIVERABLES

- New screen components, styled exclusively with existing tokens and primitives
- An `OnboardingProvider` exposing `currentStep`, `data`, `next()`, `back()`, `skip()`, `skipAll()`, `complete()`
- A `useOnboardingGuard()` hook for launch routing
- Storage using the EXISTING storage mechanism in the app
- Unit tests for the routing matrix, the monthly-amount gate (income vs available-to-spend), and resume logic
- A short summary of every existing file you touched and every new file you created

## WORKFLOW

1. Run the discovery step and report findings.
2. Propose the integration plan.
3. Wait for approval.
4. Build.
5. Report changed/new files.

Do not skip step 1. Do not assume. Ask when unclear.