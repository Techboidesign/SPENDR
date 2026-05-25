import { useEffect, useState, type ReactNode } from 'react';
import { figureTextStyle } from '../../theme/typography';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { progressTrackColor } from '../../theme/darkModeUi';
import {
  getBudgetProgressColor,
  getBudgetRingFillPercent,
} from '../../utils/budgetProgress';

const EASE = [0.32, 0.72, 0, 1] as const;

export function CircularProgress({
  percent,
  color,
  size = 52,
  animationDelay = 0,
  children,
  trackColor,
  strokeWidth = 4,
}: {
  percent: number;
  color?: string;
  size?: number;
  animationDelay?: number;
  children?: ReactNode;
  trackColor?: string;
  strokeWidth?: number;
}) {
  const c = useAppColors();
  const { isDark } = useAppearance();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const displayPercent = Math.max(0, Math.round(percent));
  const ringFillPercent = getBudgetRingFillPercent(percent);
  const strokeColor = color ?? getBudgetProgressColor(percent);
  const targetOffset = circumference - (ringFillPercent / 100) * circumference;
  const center = size / 2;
  const isOver = percent > 100;
  const track = trackColor ?? progressTrackColor(c, isDark);
  const overTrack = isDark ? 'rgba(248, 113, 113, 0.18)' : '#FEE2E2';

  const [dashOffset, setDashOffset] = useState(circumference);
  const [labelPct, setLabelPct] = useState(0);

  useEffect(() => {
    setDashOffset(circumference);
    setLabelPct(0);
    const start = window.setTimeout(() => {
      setDashOffset(targetOffset);
      setLabelPct(displayPercent);
    }, animationDelay + 40);
    return () => window.clearTimeout(start);
  }, [circumference, targetOffset, displayPercent, animationDelay]);

  const ring = (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={isOver ? overTrack : track}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          transition: `stroke-dashoffset 0.85s cubic-bezier(${EASE.join(',')}), stroke 0.25s ease`,
        }}
      />
      {!children && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={strokeColor}
          style={{
            ...figureTextStyle,
            fontSize: displayPercent >= 100 ? 9 : 10,
            fill: strokeColor,
            transition: 'opacity 0.3s ease, fill 0.25s ease',
            opacity: labelPct > 0 ? 1 : 0,
          }}
        >
          {labelPct}%
        </text>
      )}
    </svg>
  );

  if (!children) return ring;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {ring}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
}
