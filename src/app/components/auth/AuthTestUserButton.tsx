import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useOnboarding } from '../../context/OnboardingContext';
import { AUTH_THEME } from '../../theme/authTheme';

type AuthTestUserButtonProps = {
  /** Use on welcome gradient — slightly brighter ghost text. */
  variant?: 'welcome' | 'form';
};

export function AuthTestUserButton({ variant = 'form' }: AuthTestUserButtonProps) {
  const navigate = useNavigate();
  const { signInAsTestUser } = useOnboarding();
  const [loading, setLoading] = useState(false);

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

  const color = variant === 'welcome' ? AUTH_THEME.textFaint : AUTH_THEME.textMuted;

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={loading}
      aria-label="Try the app with demo data as Test user"
      style={{
        alignSelf: 'center',
        marginTop: variant === 'welcome' ? 4 : 8,
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        fontSize: 13,
        fontWeight: 500,
        color,
        opacity: loading ? 0.45 : 0.72,
        cursor: loading ? 'wait' : 'pointer',
        fontFamily: 'inherit',
        letterSpacing: 0.2,
        textDecoration: 'underline',
        textDecorationColor: 'transparent',
        textUnderlineOffset: 3,
        transition: 'opacity 0.15s ease, text-decoration-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.textDecorationColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = loading ? '0.45' : '0.72';
        e.currentTarget.style.textDecorationColor = 'transparent';
      }}
    >
      {loading ? 'Loading demo…' : 'Test user'}
    </button>
  );
}
