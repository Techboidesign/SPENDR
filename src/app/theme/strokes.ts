/** App-wide UI stroke width — borders, outlines, and ring shadows mimicking borders. */
export const APP_STROKE_WIDTH_PX = 1;

export function appBorder(style: 'solid' | 'dashed' | 'transparent' = 'solid'): string {
  return `${APP_STROKE_WIDTH_PX}px ${style}`;
}

/** `box-shadow` ring (e.g. `0 0 0 1px ${color}`). */
export function appStrokeRing(color: string): string {
  return `0 0 0 ${APP_STROKE_WIDTH_PX}px ${color}`;
}
