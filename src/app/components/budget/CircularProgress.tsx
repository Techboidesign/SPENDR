import { useEffect, useState, type ReactNode } from 'react';

const EASE = [0.32, 0.72, 0, 1] as const;

export function CircularProgress({
  percent,
  color,
  size = 52,
  animationDelay = 0,
  children,
  trackColor = '#E8EAEF',
  strokeWidth = 4,
}: {
  percent: number;
  color: string;
  size?: number;
  animationDelay?: number;
  children?: ReactNode;
  trackColor?: string;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(percent, 0), 100);
  const targetOffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  const [dashOffset, setDashOffset] = useState(circumference);
  const [labelPct, setLabelPct] = useState(0);

  useEffect(() => {
    setDashOffset(circumference);
    setLabelPct(0);
    const start = window.setTimeout(() => {
      setDashOffset(targetOffset);
      setLabelPct(clamped);
    }, animationDelay + 40);
    return () => window.clearTimeout(start);
  }, [circumference, targetOffset, clamped, animationDelay]);

  const ring = (
    <svg width={size} height={size} style={{ display: 'block', flexShrink: 0 }}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform={`rotate(-90 ${center} ${center})`}
        style={{
          transition: `stroke-dashoffset 0.85s cubic-bezier(${EASE.join(',')})`,
        }}
      />
      {!children && (
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'inherit',
            transition: 'opacity 0.3s ease',
            opacity: labelPct > 0 ? 1 : 0,
          }}
        >
          {Math.round(labelPct)}%
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
