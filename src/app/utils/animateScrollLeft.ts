import { CHIP_STRIP_SCROLL_MS } from '../theme/motion';

/** ease-out-sine: 0 → 1 */
export function easeOutSine(t: number): number {
  return Math.sin((t * Math.PI) / 2);
}

export function clampScrollLeft(element: HTMLElement, target: number): number {
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  return Math.max(0, Math.min(max, target));
}

/**
 * Scroll offset to bring `chip` into view inside a horizontal scroll container.
 * `align: 'center'` feels natural when auto-highlighting a suggested category.
 */
export function scrollOffsetToRevealChip(
  container: HTMLElement,
  chip: HTMLElement,
  options?: { align?: 'center' | 'nearest'; padding?: number },
): number {
  const padding = options?.padding ?? 0;
  const align = options?.align ?? 'center';
  const containerRect = container.getBoundingClientRect();
  const chipRect = chip.getBoundingClientRect();
  const chipLeft = chipRect.left - containerRect.left + container.scrollLeft;
  const chipRight = chipLeft + chipRect.width;
  const viewLeft = container.scrollLeft;
  const viewRight = viewLeft + container.clientWidth;

  if (align === 'center') {
    const chipCenter = chipLeft + chipRect.width / 2;
    return clampScrollLeft(container, chipCenter - container.clientWidth / 2);
  }

  if (chipLeft < viewLeft + padding) {
    return clampScrollLeft(container, chipLeft - padding);
  }
  if (chipRight > viewRight - padding) {
    return clampScrollLeft(container, chipRight - container.clientWidth + padding);
  }
  return container.scrollLeft;
}

const activeScrollFrames = new WeakMap<HTMLElement, number>();

export function animateScrollLeft(
  element: HTMLElement,
  target: number,
  options?: { durationMs?: number; reducedMotion?: boolean },
): void {
  const to = clampScrollLeft(element, target);
  const from = element.scrollLeft;
  const delta = to - from;

  if (Math.abs(delta) < 1) return;

  const prev = activeScrollFrames.get(element);
  if (prev !== undefined) cancelAnimationFrame(prev);

  if (options?.reducedMotion) {
    element.scrollLeft = to;
    return;
  }

  const duration = options?.durationMs ?? CHIP_STRIP_SCROLL_MS;
  const start = performance.now();

  const run = (now: number) => {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / duration);
    element.scrollLeft = from + delta * easeOutSine(t);
    if (t < 1) {
      activeScrollFrames.set(element, requestAnimationFrame(run));
    } else {
      activeScrollFrames.delete(element);
    }
  };

  activeScrollFrames.set(element, requestAnimationFrame(run));
}
