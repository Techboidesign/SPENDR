import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { AUTH_THEME } from '../../theme/authTheme';

type AuthTestUserButtonProps = {
  /** Welcome gradient — full-width subtle ghost, matches Get Started / Log In rhythm. */
  variant?: 'welcome' | 'form';
};

const welcomeBase: CSSProperties = {
  width: '100%',
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 16px',
  borderRadius: 20,
  border: `1px solid rgba(255, 255, 255, 0.1)`,
  backgroundColor: 'rgba(255, 255, 255, 0.06)',
  backdropFilter: 'blur(8px)',
  fontSize: 15,
  fontWeight: 600,
  color: AUTH_THEME.textMuted,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: 0.15,
  textAlign: 'center',
  transition: 'background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease',
};

const formBase: CSSProperties = {
  ...welcomeBase,
  marginTop: 16,
  height: 48,
  backgroundColor: AUTH_THEME.buttonGhost,
  border: `1px solid ${AUTH_THEME.surfaceBorder}`,
  color: AUTH_THEME.textFaint,
};

export function AuthTestUserButton({ variant = 'form' }: AuthTestUserButtonProps) {
  const navigate = useNavigate();
  const { signInAsTestUser } = useOnboarding();
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await signInAsTestUser();
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Showcase sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const base = variant === 'welcome' ? welcomeBase : formBase;
  const idleBg = base.backgroundColor as string;
  const hoverBg =
    variant === 'welcome' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(255, 255, 255, 0.14)';

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      aria-label="Try the app with demo data as Test user"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...base,
        opacity: loading ? 0.55 : 1,
        cursor: loading ? 'wait' : 'pointer',
        backgroundColor: hovered && !loading ? hoverBg : idleBg,
      }}
    >
      {loading ? 'Loading demo…' : 'Test user'}
    </button>
  );
}
