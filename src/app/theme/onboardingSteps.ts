/** Canonical onboarding flow order (matches routes & stepper). */
export const ONBOARDING_STEPS = [
  { id: 'goal', route: '/onboarding/goal' },
  { id: 'monthly-income', route: '/onboarding/monthly-income' },
  { id: 'budget', route: '/onboarding/budget' },
  { id: 'categories', route: '/onboarding/categories' },
  { id: 'notifications', route: '/onboarding/notifications' },
  { id: 'name-basics', route: '/onboarding/name-basics' },
  { id: 'complete', route: '/onboarding/complete' },
] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id'];

export const ONBOARDING_STEP_COUNT = ONBOARDING_STEPS.length;

export function getOnboardingStepIndex(stepId: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.id === stepId);
}

export function getOnboardingStepRoute(stepId: OnboardingStepId): string {
  return ONBOARDING_STEPS.find((s) => s.id === stepId)?.route ?? '/onboarding/goal';
}
