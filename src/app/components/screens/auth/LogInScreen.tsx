import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { FormInput } from '../../shared/FormFields';
import { useOnboarding, type OnboardingState } from '../../../context/OnboardingContext';
import { fetchOnboarding } from '../../../services/onboardingService';
import { getSupabase, isSupabaseConfigured } from '../../../../lib/supabase';
import { AuthScreenShell } from '../../auth/AuthScreenShell';
import { AUTH_THEME } from '../../../theme/authTheme';

export default function LogInScreen() {
  const navigate = useNavigate();
  const { signInWithEmail, onboarding } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const routeAfterLogin = (o: OnboardingState) => {
    if (o.status === 'completed' || o.status === 'skipped') {
      navigate('/');
    } else if (o.status === 'in_progress' && o.lastStepId) {
      navigate(`/onboarding/${o.lastStepId}`);
    } else {
      navigate('/onboarding/goal');
    }
  };

  const handleLogIn = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      let nextOnboarding = onboarding;
      if (isSupabaseConfigured) {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (session?.user) {
          const remote = await fetchOnboarding(session.user.id);
          if (remote) nextOnboarding = remote;
        }
      }
      routeAfterLogin(nextOnboarding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Log in failed. Check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreenShell>
      <div style={{ flex: 1, padding: '24px 20px 24px', display: 'flex', flexDirection: 'column' }}>
        <button
          type="button"
          onClick={() => navigate('/welcome')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 20,
            backgroundColor: AUTH_THEME.buttonGhost,
            border: `1px solid ${AUTH_THEME.surfaceBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            marginBottom: 24,
          }}
        >
          <ArrowLeft size={20} color={AUTH_THEME.textPrimary} weight="light" />
        </button>

        <div style={{ width: '100%' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, margin: '0 0 8px' }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5, margin: '0 0 32px' }}>
          Log in to your account to continue
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 14,
              color: '#FCA5A5',
            }}
          >
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Email</label>
          <FormInput
            type="email"
            tone="dark"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Password</label>
          <div style={{ position: 'relative' }}>
            <FormInput
              type={showPassword ? 'text' : 'password'}
              tone="dark"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
              }}
            >
              {showPassword ? (
                <EyeSlash size={20} color={AUTH_THEME.textMuted} />
              ) : (
                <Eye size={20} color={AUTH_THEME.textMuted} />
              )}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            style={{
              background: 'none',
              border: 'none',
              color: AUTH_THEME.accentMint,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Forgot password?
          </button>
        </div>

        {/* Log in button */}
        <Button
          onClick={handleLogIn}
          disabled={loading}
          style={{
            width: '100%',
            height: 52,
            fontSize: 16,
            fontWeight: 700,
            backgroundColor: AUTH_THEME.buttonPrimary,
            color: AUTH_THEME.buttonPrimaryText,
            borderRadius: 20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            marginBottom: 24,
          }}
        >
          {loading ? 'Logging in…' : 'Log In'}
        </Button>

        <p style={{ fontSize: 14, color: AUTH_THEME.textMuted, textAlign: 'center', margin: 0 }}>
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            style={{
              background: 'none',
              border: 'none',
              color: AUTH_THEME.accentMint,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
          >
            Sign Up
          </button>
        </p>
        </div>
      </div>
    </AuthScreenShell>
  );
}
