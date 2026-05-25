import { motion } from 'motion/react';

const WAVE_EASE = [0.22, 1, 0.36, 1] as const;

/** From public/SPLASH_CIRCLES.svg — inner → outer */
const SPLASH_RECTS = [
  {
    x: 225.068,
    y: 203.69,
    width: 205,
    height: 205,
    rx: 39.5,
    rotate: -4.93125,
    peakOpacity: 0.6,
    stroke: 'url(#splash-paint0)',
    delay: 0,
  },
  {
    x: 181.404,
    y: 196.2,
    width: 261,
    height: 261,
    rx: 63.5,
    rotate: -11.8947,
    peakOpacity: 0.6,
    stroke: 'url(#splash-paint1)',
    delay: 0.04,
  },
  {
    x: 110.505,
    y: 211.605,
    width: 341,
    height: 341,
    rx: 95.5,
    rotate: -24.2582,
    peakOpacity: 0.4,
    stroke: 'url(#splash-paint2)',
    delay: 0.08,
  },
  {
    x: 13.8567,
    y: 197.059,
    width: 477,
    height: 477,
    rx: 123.5,
    rotate: -27.7641,
    peakOpacity: 0.25,
    stroke: 'url(#splash-paint3)',
    delay: 0.12,
  },
  {
    x: -143.557,
    y: 196.256,
    width: 693,
    height: 693,
    rx: 123.5,
    rotate: -33.136,
    peakOpacity: 0.25,
    stroke: 'url(#splash-paint4)',
    delay: 0.16,
  },
  {
    x: -340.258,
    y: 217.253,
    width: 963,
    height: 963,
    rx: 123.5,
    rotate: -38.2745,
    peakOpacity: 0.25,
    stroke: 'url(#splash-paint5)',
    delay: 0.2,
  },
] as const;

type SplashContourBackgroundProps = {
  playKey: string | number;
};

/** Figma export: SPLASH_CIRCLES.svg with wave-in per rectangle */
export function SplashContourBackground({ playKey }: SplashContourBackgroundProps) {
  return (
    <motion.svg
      key={playKey}
      aria-hidden
      viewBox="0 0 673 812"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="splash-paint0" x1="327.527" y1="203.235" x2="327.527" y2="409.235" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
        <linearGradient id="splash-paint1" x1="311.812" y1="195.814" x2="311.812" y2="457.814" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
        <linearGradient id="splash-paint2" x1="280.844" y1="211.354" x2="280.844" y2="553.354" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
        <linearGradient id="splash-paint3" x1="252.181" y1="196.849" x2="252.181" y2="674.849" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
        <linearGradient id="splash-paint4" x1="202.751" y1="196.11" x2="202.751" y2="890.11" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
        <linearGradient id="splash-paint5" x1="141.04" y1="217.17" x2="141.04" y2="1181.17" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0058AB" />
          <stop offset="1" stopColor="#6668FF" />
        </linearGradient>
      </defs>

      {SPLASH_RECTS.map((rect, index) => (
        <motion.rect
          key={`${rect.width}-${index}`}
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          rx={rect.rx}
          fill="none"
          stroke={rect.stroke}
          strokeWidth={1}
          transform={`rotate(${rect.rotate} ${rect.x} ${rect.y})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: rect.peakOpacity }}
          transition={{
            delay: rect.delay,
            duration: 0.28,
            ease: WAVE_EASE,
          }}
        />
      ))}
    </motion.svg>
  );
}
