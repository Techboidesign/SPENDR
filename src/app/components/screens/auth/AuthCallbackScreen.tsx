import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import { AuthScreenShell } from '../../auth/AuthScreenShell';
import { Button } from '../../ui/button';
import {
  getOnboardingRoute,
  useOnboarding,
} from '../../../context/OnboardingContext';
import { getSupabase, isSupabaseConfigured } from '../../../../lib/supabase';
import { AUTH_THEME } from '../../../theme/authTheme';

type CallbackPhase = 'confirming' | 'success' | 'error';

function parseHashParams(): URLSearchParams {
  const raw = window.location.hash.replace(/^#/, '');
  return new URLSearchParams(raw);
}

export default function AuthCallbackScreen() {
  const navigate = useNavigate();
  const { auth, authLoading, onboarding } = useOnboarding();
  const hashParams = useMemo(() => parseHashParams(), []);

  const linkType = hashParams.get('type');
  const hashError =
    hashParams.get('error_description') ?? hashParams.get('error');

  const [phase, setPhase] = useState<CallbackPhase>(() =>
    hashError ? 'error' : 'confirming',
  );
  const [errorMessage, setErrorMessage] = useState(() =>
    hashError ? decodeURIComponent(hashError.replace(/\+/g, ' ')) : '',
  );

  const successCopy =
    linkType === 'recovery'
      ? 'Link verified. Taking you to your account…'
      : linkType === 'signup' || linkType === 'email'
        ? 'Email confirmed! Taking you to setup…'
        : 'Signed in. Taking you to the app…';

  const confirmingCopy =
    linkType === 'recovery'
      ? 'Verifying your reset link…'
      : 'Confirming your email…';

  // Ensure Supabase processes the hash (detectSessionInUrl is on; this nudges recovery)
  useEffect(() => {
    if (!isSupabaseConfigured || hashError) return;
    void getSupabase().auth.getSession();
  }, [hashError]);

  // Redirect once session is established
  useEffect(() => {
    if (!isSupabaseConfigured || hashError || authLoading) return;

    if (auth.isAuthenticated) {
      setPhase('success');
      const target = getOnboardingRoute(auth, onboarding);
      const timer = window.setTimeout(() => {
        navigate(target, { replace: true });
      }, 1400);
      return () => window.clearTimeout(timer);
    }
  }, [auth.isAuthenticated, authLoading, auth, onboarding, navigate, hashError]);

  // Timed out waiting for session
  useEffect(() => {
    if (!isSupabaseConfigured || hashError || authLoading || auth.isAuthenticated) {
      return;
    }

    const hasAuthFragment =
      hashParams.has('access_token') || hashParams.has('refresh_token');

    if (!hasAuthFragment) {
      setPhase('error');
      setErrorMessage('This confirmation link is invalid or has expired.');
      return;
    }

    const timeout = window.setTimeout(() => {
      setPhase('error');
      setErrorMessage(
        'We could not finish signing you in. Try logging in with your email and password.',
      );
    }, 12_000);

    return () => window.clearTimeout(timeout);
  }, [
    auth.isAuthenticated,
    authLoading,
    hashError,
    hashParams,
  ]);

  if (!isSupabaseConfigured) {
    return (
      <AuthScreenShell>
        <CallbackBody
          icon={<WarningCircle size={48} color="#FCA5A5" weight="light" />}
          title="Auth not configured"
          message="Supabase environment variables are missing on this deployment."
          action={
            <Button onClick={() => navigate('/welcome', { replace: true })}>
              Back to Welcome
            </Button>
          }
        />
      </AuthScreenShell>
    );
  }

  if (phase === 'error') {
    return (
      <AuthScreenShell>
        <CallbackBody
          icon={<WarningCircle size={48} color="#FCA5A5" weight="light" />}
          title="Something went wrong"
          message={errorMessage || 'This link may have expired. Request a new one or log in.'}
          action={
            <Button
              onClick={() => navigate('/login', { replace: true })}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 20,
                backgroundColor: AUTH_THEME.buttonPrimary,
                color: AUTH_THEME.buttonPrimaryText,
              }}
            >
              Go to Log In
            </Button>
          }
        />
      </AuthScreenShell>
    );
  }

  if (phase === 'success') {
    return (
      <AuthScreenShell>
        <CallbackBody
          icon={<CheckCircle size={48} color={AUTH_THEME.accentMint} weight="light" />}
          title="You're all set"
          message={successCopy}
        />
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell>
      <CallbackBody
        title={confirmingCopy}
        message="Please wait a moment…"
        spinner
      />
    </AuthScreenShell>
  );
}

function CallbackBody({
  icon,
  title,
  message,
  action,
  spinner,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
  spinner?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      {spinner ? (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.2)',
            borderTopColor: AUTH_THEME.accentMint,
            animation: 'auth-callback-spin 0.8s linear infinite',
            marginBottom: 24,
          }}
        />
      ) : (
        icon && <div style={{ marginBottom: 20 }}>{icon}</div>
      )}
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: -0.5,
          margin: '0 0 12px',
        }}
      >
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: AUTH_THEME.textMuted,
          lineHeight: 1.5,
          margin: action ? '0 0 28px' : 0,
          maxWidth: 320,
        }}
      >
        {message}
      </p>
      {action}
      {spinner ? (
        <style>{`@keyframes auth-callback-spin { to { transform: rotate(360deg); } }`}</style>
      ) : null}
    </div>
  );
}
