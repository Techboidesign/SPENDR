import { useAppearance } from '../../context/AppearanceContext';
import { uiIconChipStyle } from '../../theme/darkModeUi';

const RANK_PALETTES = [
  { accentColor: '#3E37FF', lightBg: '#EDEDFF' },
  { accentColor: '#7C3AED', lightBg: '#F3E8FF' },
  { accentColor: '#6B7280', lightBg: '#F3F4F6' },
] as const;

export function RankIconChip({
  rank,
  size = 36,
  radius = 10,
}: {
  rank: number;
  size?: number;
  radius?: number;
}) {
  const { isDark } = useAppearance();
  const palette = RANK_PALETTES[Math.min(rank - 1, RANK_PALETTES.length - 1)];
  const chip = uiIconChipStyle(palette.accentColor, isDark, palette.lightBg);

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...chip.containerStyle,
      }}
    >
      <span
        className="font-figure"
        style={{
          fontSize: size <= 32 ? 14 : 16,
          fontWeight: 800,
          color: chip.iconColor,
          lineHeight: 1,
        }}
      >
        {rank}
      </span>
    </div>
  );
}
