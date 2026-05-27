/** Split `€1,234.56` → main `€1,234` + decimals `.56` for typographic hierarchy. */
export function splitCurrencyForDisplay(formatted: string): {
  main: string;
  decimals: string | null;
} {
  const dot = formatted.lastIndexOf('.');
  if (dot === -1) return { main: formatted, decimals: null };
  return {
    main: formatted.slice(0, dot),
    decimals: formatted.slice(dot),
  };
}

const SIZES = {
  default: { main: 26, decimals: 17 },
  compact: { main: 18, decimals: 12 },
} as const;

/**
 * Large figure-style currency — integer part full size, decimal suffix smaller.
 */
export function CurrencyFigureAmount({
  formatted,
  color,
  size = 'default',
}: {
  formatted: string;
  color: string;
  size?: keyof typeof SIZES;
}) {
  const { main, decimals } = splitCurrencyForDisplay(formatted);
  const { main: mainSize, decimals: decimalSize } = SIZES[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        lineHeight: 1.2,
      }}
    >
      <span
        className="font-figure"
        style={{
          fontSize: mainSize,
          color,
          letterSpacing: size === 'compact' ? -0.35 : -0.5,
        }}
      >
        {main}
      </span>
      {decimals ? (
        <span
          className="font-figure"
          style={{
            fontSize: decimalSize,
            color,
            letterSpacing: -0.3,
            opacity: 0.88,
          }}
        >
          {decimals}
        </span>
      ) : null}
    </span>
  );
}
