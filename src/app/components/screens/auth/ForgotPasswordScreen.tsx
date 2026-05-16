import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Check } from '@phosphor-icons/react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

export default function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = () => {
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    // Mock sending reset email
    setSent(true);
  };

  if (sent) {
    return (
      <div style={{
        height: '100%',
        backgroundColor: '#F5F5FA',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: '100%', textAlign: 'center' }}>
          {/* Success icon */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#D1FAE5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <Check size={32} color="#10B981" weight="bold" />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 12px' }}>
            Check your email
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px', lineHeight: 1.5 }}>
            We've sent password reset instructions to <strong>{email}</strong>.
            Please check your inbox and follow the link to reset your password.
          </p>

          <Button
            onClick={() => navigate('/login')}
            style={{
              width: '100%',
              height: 52,
              fontSize: 16,
              fontWeight: 700,
              backgroundColor: '#3E37FF',
              color: '#FFFFFF',
              borderRadius: 20,
              boxShadow: '0 4px 14px rgba(62,55,255,0.30)',
            }}
          >
            Back to Log In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      backgroundColor: '#F5F5FA',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <button
        onClick={() => navigate('/login')}
        style={{
          width: 36,
          height: 36,
          borderRadius: 20,
          backgroundColor: '#FFFFFF',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}
      >
        <ArrowLeft size={20} color="#1A1A2E" weight="light" />
      </button>

      <div style={{ width: '100%' }}>
        {/* Title */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.5, margin: '0 0 8px' }}>
          Forgot password?
        </h1>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 32px', lineHeight: 1.5 }}>
          No worries! Enter your email and we'll send you instructions to reset your password.
        </p>

        {/* Error */}
        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #EF4444',
            borderRadius: 14,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 14,
            color: '#EF4444',
          }}>
            {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1A1A2E', marginBottom: 8 }}>
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ width: '100%', height: 50, fontSize: 16, borderRadius: 14 }}
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          style={{
            width: '100%',
            height: 52,
            fontSize: 16,
            fontWeight: 700,
            backgroundColor: '#3E37FF',
            color: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 4px 14px rgba(62,55,255,0.30)',
            marginBottom: 20,
          }}
        >
          Send Reset Link
        </Button>

        {/* Back to log in */}
        <p style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', margin: 0 }}>
          Remember your password?{' '}
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none',
              border: 'none',
              color: '#3E37FF',
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
    </div>
  );
}
