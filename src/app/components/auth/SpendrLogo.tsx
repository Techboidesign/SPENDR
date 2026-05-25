type SpendrLogoProps = {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

/** App icon — use for auth, onboarding header, and branding. */
export function SpendrLogo({ size = 72, className, style }: SpendrLogoProps) {
  const { background, backgroundColor, ...logoStyle } = style ?? {};

  return (
    <img
      src="/spendr-logo.png"
      alt="Spendr"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'block',
        borderRadius: size * 0.22,
        objectFit: 'contain',
        background: 'none',
        backgroundColor: 'transparent',
        ...logoStyle,
      }}
    />
  );
}
