/** Shared motion tokens — sheets, tabs, FAB, and screen choreography. */

export const EASE_OUT_QUINT = [0.32, 0.72, 0, 1] as const;

/** CSS-equivalent ease-out-sine — gentle deceleration for short scroll nudges. */
export const EASE_OUT_SINE = [0.61, 1, 0.88, 1] as const;

/** Horizontal chip-strip scroll when category is auto-selected from name. */
export const CHIP_STRIP_SCROLL_MS = 220;

/** Disabled save hint — pop above ADD button */
export const SAVE_HINT_VISIBLE_MS = 2000;
export const SAVE_HINT_ENTER_S = 0.22;
export const SAVE_HINT_EXIT_S = 0.18;
export const SAVE_HINT_EASE_IN = [0.55, 0, 0.75, 0] as const;

export const MODAL_ANIMATION_MS = 0.3;

export const MODAL_TRANSITION = {
  duration: MODAL_ANIMATION_MS,
  ease: EASE_OUT_QUINT,
} as const;

export const MODAL_TRANSITION_REDUCED = {
  duration: 0.12,
  ease: EASE_OUT_QUINT,
} as const;

/** Bottom sheets & sub-pages (Expenses search slide, etc.). */
export const SLIDE_EASE = EASE_OUT_QUINT;
export const SLIDE_DURATION = 0.32;

export const FAB_POP_TRANSITION = {
  duration: 0.18,
  ease: EASE_OUT_QUINT,
} as const;

export const FAB_POP_TRANSITION_REDUCED = { duration: 0 } as const;

export const FAB_ICON_SWAP_TRANSITION = {
  duration: 0.09,
  ease: [0.33, 1, 0.32, 1] as const,
};

export const FAB_COLOR_TRANSITION = {
  duration: 0.07,
  ease: [0.4, 0, 0.2, 1] as const,
};

/** Shared-element slide for the active tab pill in the bottom bar. */
export const TAB_LAYOUT_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 34,
};

export const TAB_LAYOUT_INSTANT = { duration: 0 } as const;

export const TAB_PRESS_TRANSITION = {
  duration: 0.1,
  ease: EASE_OUT_QUINT,
} as const;

/** Home screen — runs on every visit; tuned faster while keeping flow. */
export const HOME_CHOREOGRAPHY = {
  slideUp: 'slideUpFade 0.42s cubic-bezier(0.32, 0.72, 0, 1) both',
  slideUpDelayed: 'slideUpFade 0.42s cubic-bezier(0.32, 0.72, 0, 1) 0.12s both',
  fadeIn: 'fadeIn 0.38s ease-out both',
  fadeInDelayed: (delayS: number) => `fadeIn 0.38s ease-out ${delayS}s both`,
  donutWedge: (index: number) =>
    `fadeIn 0.38s ease-out ${index * 0.04}s both`,
  statsCell: (index: number) =>
    `fadeIn 0.38s ease-out ${0.22 + index * 0.05}s both`,
  centreOverlay: 'fadeIn 0.45s ease-out 0.18s both',
  tooltip: 'fadeIn 0.18s ease-out',
} as const;

/** Insights — chart motion only; sections use a single quick enter. */
export const INSIGHTS_CHOREOGRAPHY = {
  header: 'fadeIn 0.35s ease-out both',
  chartCard: 'fadeSlideUp 0.38s cubic-bezier(0.32, 0.72, 0, 1) 0.05s both',
  sectionCard: 'fadeSlideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) both',
  barGrow: (index: number) =>
    `barGrow 0.4s cubic-bezier(0.32, 0.72, 0, 1) ${index * 0.03}s both`,
  progressBar: 'progressBarFill 0.45s cubic-bezier(0.32, 0.72, 0, 1) both',
} as const;

export const CHART_BAR_GROW_MS = 550;
export const CHART_BAR_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
