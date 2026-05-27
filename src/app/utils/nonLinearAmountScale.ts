/** Max amount for onboarding income slider */
export const AMOUNT_SLIDER_MAX = 1_000_000;

/** Fine-grained range covers the first ~2/3 of the track (when max > this) */
export const AMOUNT_SLIDER_FINE_MAX = 10_000;

export const AMOUNT_SLIDER_FINE_FRACTION = 2 / 3;

const SLIDER_STEPS = 1000;

export type AmountSliderScale = {
  max: number;
  fineMax: number;
  fineFraction: number;
  usesFineSplit: boolean;
};

export function resolveAmountSliderScale(maxAmount?: number): AmountSliderScale {
  const max = maxAmount ?? AMOUNT_SLIDER_MAX;
  if (max <= 0) {
    return { max: 0, fineMax: 0, fineFraction: 1, usesFineSplit: false };
  }
  if (max <= AMOUNT_SLIDER_FINE_MAX) {
    return { max, fineMax: max, fineFraction: 1, usesFineSplit: false };
  }
  return {
    max,
    fineMax: AMOUNT_SLIDER_FINE_MAX,
    fineFraction: AMOUNT_SLIDER_FINE_FRACTION,
    usesFineSplit: true,
  };
}

/** Map dollars → slider position 0–1 */
export function amountToSliderPosition(value: number, maxAmount?: number): number {
  const { max, fineMax, fineFraction, usesFineSplit } = resolveAmountSliderScale(maxAmount);
  if (max <= 0) return 0;

  const v = Math.max(0, Math.min(max, value));
  if (!usesFineSplit) {
    return v / max;
  }
  if (v <= fineMax) {
    return (v / fineMax) * fineFraction;
  }
  return (
    fineFraction +
    ((v - fineMax) / (max - fineMax)) * (1 - fineFraction)
  );
}

/** Map slider position 0–1 → dollars */
export function sliderPositionToAmount(position: number, maxAmount?: number): number {
  const { max, fineMax, fineFraction, usesFineSplit } = resolveAmountSliderScale(maxAmount);
  if (max <= 0) return 0;

  const t = Math.max(0, Math.min(1, position));
  if (!usesFineSplit) {
    return Math.round((t / fineFraction) * max);
  }
  if (t <= fineFraction) {
    return Math.round((t / fineFraction) * fineMax);
  }
  const raw =
    fineMax +
    ((t - fineFraction) / (1 - fineFraction)) * (max - fineMax);
  return Math.round(raw);
}

export function clampSliderAmount(value: number, maxAmount?: number): number {
  const max = resolveAmountSliderScale(maxAmount).max;
  if (max <= 0) return Math.max(0, Math.round(value));
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function amountToSliderStep(value: number, maxAmount?: number): number {
  return Math.round(amountToSliderPosition(clampSliderAmount(value, maxAmount), maxAmount) * SLIDER_STEPS);
}

export function sliderStepToAmount(step: number, maxAmount?: number): number {
  return sliderPositionToAmount(step / SLIDER_STEPS, maxAmount);
}

/** Short label for slider endpoints (e.g. $4.2k, $10k, $1M). */
export function formatSliderAmountLabel(amount: number): string {
  if (amount >= 1_000_000) return '$1M';
  if (amount >= 10_000) {
    const k = amount / 1000;
    return Number.isInteger(k) ? `$${k}k` : `$${k.toFixed(1)}k`;
  }
  if (amount >= 1_000) {
    const k = amount / 1000;
    return Number.isInteger(k) ? `$${k}k` : `$${k.toFixed(1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

/** Interior tick positions (0–1) for a given scale max. */
export function buildSliderTickPositions(maxAmount?: number): number[] {
  const { max, usesFineSplit } = resolveAmountSliderScale(maxAmount);
  if (max <= 0) return [];

  const positions = new Set<number>();

  if (!usesFineSplit) {
    const step = max <= 2_000 ? 250 : max <= 5_000 ? 500 : 1_000;
    for (let amount = step; amount < max; amount += step) {
      positions.add(amountToSliderPosition(amount, maxAmount));
    }
  } else {
    for (let amount = 500; amount < AMOUNT_SLIDER_FINE_MAX; amount += 500) {
      positions.add(amountToSliderPosition(amount, maxAmount));
    }
    positions.add(amountToSliderPosition(AMOUNT_SLIDER_FINE_MAX, maxAmount));

    for (let amount = 15_000; amount < max; amount += 25_000) {
      positions.add(amountToSliderPosition(amount, maxAmount));
    }
  }

  return [...positions]
    .filter(pos => pos > 0.008 && pos < 0.992)
    .sort((a, b) => a - b);
}
