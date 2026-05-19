import type { CSSProperties } from 'react';

/** Shared visual tokens for Feature Cards (insights, budget highlights, expense insights). */
export const FEATURE_CARD = {
  shadow: '0 4px 16px rgba(0,0,0,0.07)',
  radius: 16,
  radiusLg: 20,
  padding: '10px 12px',
  paddingLg: '16px 16px 14px',
  icon: {
    outer: 36,
    inner: 18,
    radius: 10,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: 700,
    color: '#9CA3AF',
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  headline: {
    fontSize: 16,
    fontWeight: 800,
    color: '#1A1A2E',
    lineHeight: 1.2,
    letterSpacing: -0.5,
  },
  detail: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 1.3,
  },
} as const;

export function featureCardGradient(accentBg: string): string {
  return `linear-gradient(145deg, ${accentBg} 0%, #FFFFFF 55%)`;
}

export function featureCardSurface(
  accentBg: string,
  options?: { radius?: number; padding?: string },
): CSSProperties {
  return {
    background: featureCardGradient(accentBg),
    boxShadow: FEATURE_CARD.shadow,
    borderRadius: options?.radius ?? FEATURE_CARD.radius,
    padding: options?.padding ?? FEATURE_CARD.padding,
  };
}
