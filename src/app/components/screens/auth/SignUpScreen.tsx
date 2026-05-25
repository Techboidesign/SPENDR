import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { FormInput } from '../../shared/FormFields';
import { useOnboarding } from '../../../context/OnboardingContext';
import { AuthScreenShell } from '../../auth/AuthScreenShell';
import { AUTH_THEME, ONBOARDING_FIRST_STEP } from '../../../theme/authTheme';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const { signUpWithEmail } = useOnboarding();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSignUp = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and privacy policy');
      return;
    }

    if (passwordStrength.score < 3) {
      setError('Password is too weak');
      return;
    }

    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUpWithEmail(email.trim(), password);
      if (needsEmailConfirmation) {
        setEmailSent(true);
        return;
      }
      navigate(`/onboarding/${ONBOARDING_FIRST_STEP}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <AuthScreenShell>
        <div
          style={{
            flex: 1,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 12px' }}>Confirm your email</h1>
          <p style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5, margin: '0 0 24px' }}>
            We sent a link to <strong style={{ color: AUTH_THEME.textPrimary }}>{email}</strong>.
            After confirming, log in to continue setup.
          </p>
          <Button
            onClick={() => navigate('/login')}
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
        </div>
      </AuthScreenShell>
    );
  }

  return (
    <AuthScreenShell>
          <div
            style={{
              flex: 1,
              padding: '24px 20px 24px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
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
                marginBottom: 20,
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={20} color={AUTH_THEME.textPrimary} weight="light" />
            </button>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: -0.5,
                margin: '0 0 8px',
              }}
            >
              Create your account
            </h1>
            <p style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5, margin: '0 0 28px' }}>
              Start tracking your expenses in minutes
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

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Email
              </label>
              <FormInput
                type="email"
                tone="dark"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FormInput
                  type={showPassword ? 'text' : 'password'}
                  tone="dark"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
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

              {password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(level => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            level <= passwordStrength.score
                              ? passwordStrength.color
                              : AUTH_THEME.progressTrack,
                        }}
                      />
                    ))}
                  </div>
                  <p style={{ fontSize: 12, color: passwordStrength.color, margin: 0 }}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 24,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
                style={{ width: 20, height: 20, cursor: 'pointer', marginTop: 2 }}
              />
              <span style={{ fontSize: 14, color: AUTH_THEME.textMuted, lineHeight: 1.5 }}>
                I agree to the{' '}
                <a href="/settings/privacy" style={{ color: AUTH_THEME.accentMint, textDecoration: 'none' }}>
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/settings/privacy" style={{ color: AUTH_THEME.accentMint, textDecoration: 'none' }}>
                  Privacy Policy
                </a>
              </span>
            </label>

            <Button
              onClick={handleSignUp}
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
              {loading ? 'Creating account…' : 'Sign Up'}
            </Button>

            <p style={{ fontSize: 14, color: AUTH_THEME.textMuted, textAlign: 'center', margin: 0 }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
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
                Log In
              </button>
            </p>
          </div>
    </AuthScreenShell>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#E5E7EB' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: '#EF4444' };
  if (score === 2) return { score, label: 'Fair', color: '#F59E0B' };
  if (score === 3) return { score, label: 'Good', color: '#10B981' };
  return { score, label: 'Strong', color: '#10B981' };
}
