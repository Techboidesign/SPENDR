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

const MAIN_SIZE = 26;
const DECIMAL_SIZE = 17;

/**
 * Large figure-style currency — integer part full size, decimal suffix smaller.
 */
export function CurrencyFigureAmount({
  formatted,
  color,
}: {
  formatted: string;
  color: string;
}) {
  const { main, decimals } = splitCurrencyForDisplay(formatted);

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
          fontSize: MAIN_SIZE,
          color,
          letterSpacing: -0.5,
        }}
      >
        {main}
      </span>
      {decimals ? (
        <span
          className="font-figure"
          style={{
            fontSize: DECIMAL_SIZE,
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
