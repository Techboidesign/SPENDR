import { useNavigate } from 'react-router';
import { Button } from '../../ui/button';
import { AuthScreenShell } from '../../auth/AuthScreenShell';
import { WelcomeBrandSequence } from '../../auth/WelcomeBrandSequence';
import { APP_PRIMARY, AUTH_THEME, AUTH_WELCOME_GRADIENT } from '../../../theme/authTheme';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <AuthScreenShell background={AUTH_WELCOME_GRADIENT}>
      <WelcomeBrandSequence>
        <div
          style={{
            padding: '0 20px max(28px, env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <Button
            className="!bg-[#3E37FF] !text-white border-0 shadow-none hover:!bg-[#3E37FF]/90"
            onClick={() => navigate('/signup')}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: APP_PRIMARY,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(62, 55, 255, 0.3)',
            }}
          >
            Get Started
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: 'rgba(5, 5, 58, 0.35)',
              color: AUTH_THEME.textPrimary,
              border: `1px solid ${AUTH_THEME.surfaceBorder}`,
              borderRadius: 20,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            Log In
          </Button>

          <p
            style={{
              fontSize: 12,
              color: AUTH_THEME.textFaint,
              margin: '12px 0 0',
              textAlign: 'center',
            }}
          >
            By Alejandro Alvarez ·{' '}
            <a
              href="https://www.techboi.design"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: AUTH_THEME.accentMint, textDecoration: 'none' }}
            >
              www.techboi.design
            </a>
          </p>
        </div>
      </WelcomeBrandSequence>
    </AuthScreenShell>
  );
}
