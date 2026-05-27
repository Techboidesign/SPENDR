# Primary Goal–Tailored Budget Experience

**Version:** 1.0  
**Status:** Implemented  
**Scope:** Budget tab (`BudgetScreen`) and supporting data layer

---

## 1. Product intent

During onboarding, users answer **“What’s your main goal?”** with one of six choices:

| ID | Label |
|----|--------|
| `save` | Save for a goal |
| `track` | Track my spending |
| `debt` | Pay off debt |
| `emergency` | Build emergency fund |
| `invest` | Start investing |
| `exploring` | Just exploring |

`primaryGoal` is persisted to `profiles.primary_goal`. This feature makes that choice **visible and useful** on the **Budget** tab—a focused add-on that reinforces why the user signed up.

**North star:** *“My Budget screen understands why I’m here and shows me progress toward that intention.”*

---

## 2. Scope

### In scope
- Hydrate `primaryGoal` into `AppState` (read from profile on load).
- **“Your focus”** card on `BudgetScreen` (first card in the scroll stack).
- Goal-specific progress math, copy, accents, and animated progress bar.
- Light tailoring: Monthly budget card subtitle, categories section title, sort order, optional “Focus” badge on one category.
- Onboarding Step 4: goal-aware default allocation weights when `primaryGoal` is set.
- Config layer: `primaryGoalConfig.ts`, `primaryGoalProgress.ts`.

### Out of scope (v1)
- Home / Expenses / notification changes.
- User-editable goal targets (debt balance, EF target amount).
- Settings UI to change goal (data action `SET_PRIMARY_GOAL` is wired for future use).

---

## 3. Data model

- `AppState.primaryGoal`: `'save' | 'track' | 'debt' | 'emergency' | 'invest' | 'exploring' | null`
- Loaded via `profileToAppFields` / `fetchAppState` from `profiles.primary_goal`.
- Set in `mergeOnboardingIntoAppState` from onboarding data.
- Invalid/null DB values resolve to `'exploring'`.

---

## 4. Goal → behavior matrix

| Goal | Progress % | Metric line | Inverted bar (high = good) |
|------|------------|-------------|----------------------------|
| **save** | `(income − spent) / income` | Saved this month · $X | Yes |
| **track** | Categories with spend ÷ categories with budget | Categories tracked · N/M | Yes |
| **debt** | `(budget − spent) / budget` | Room in budget · $X left | Yes |
| **emergency** | Unspent flow toward 20% of budget target | Safety net progress | Yes |
| **invest** | `100 − budget usage%` | Ready to invest | Yes |
| **exploring** | Categories with budget ÷ total categories | Setup progress | Yes |

Empty state when income and budget are both 0: helper text instead of misleading %.

---

## 5. UX/UI

- Card uses same visual family as `FeaturedBudgetCard` (gradient, compact bar, motion).
- Phosphor icons only; accents match `Step2Goal`.
- `role="region"` + `progressbar` ARIA on focus card.
- Monthly budget card: goal `budgetCardHint` as **subtitle**; threshold alerts unchanged.
- Categories: goal-specific `SectionTitle`; emphasized ids sorted first (`track` sorts by spend).

---

## 6. Engineering

| File | Purpose |
|------|---------|
| `src/app/data/primaryGoalConfig.ts` | Definitions, weights, sort helpers |
| `src/app/utils/primaryGoalProgress.ts` | Pure progress + copy |
| `src/app/components/budget/PrimaryGoalFocusCard.tsx` | Focus card UI |
| `src/app/components/screens/BudgetScreen.tsx` | Composition |
| `src/app/services/appDataService.ts` | Hydration + `SET_PRIMARY_GOAL` sync |

---

## 7. Acceptance criteria

- [x] Each of the 6 goals shows distinct copy and accent on the focus card.
- [x] Progress bar animates on mount.
- [x] Expense updates refresh progress without navigation.
- [x] Null/legacy profiles default to `exploring`.
- [x] Light and dark mode supported via `useAppColors`.
- [x] No changes to Expenses/Home notifications in v1.

---

## 8. Future extensions

- Settings → change primary goal.
- User-defined targets ($ emergency fund, debt balance).
- Home widget mirroring focus card.
- Notification copy keyed off `primaryGoal`.
