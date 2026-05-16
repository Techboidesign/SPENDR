import { useNavigate } from 'react-router';
import { Wallet } from '@phosphor-icons/react';
import { Button } from '../../ui/button';

export default function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5FA',
      padding: '0 20px',
    }}>
      {/* Logo */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(62, 55, 255, 0.3)',
      }}>
        <Wallet size={40} weight="light" color="#FFFFFF" />
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: 32,
        fontWeight: 800,
        color: '#1A1A2E',
        margin: '0 0 12px',
      }}>
        Spendr
      </h1>

      {/* Value prop */}
      <p style={{
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 1.5,
        margin: '0 0 48px',
      }}>
        Take control of your finances. Track expenses, set budgets, and reach your goals.
      </p>

      {/* CTAs */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        <Button
          onClick={() => navigate('/signup')}
          style={{
            width: '100%',
            height: 52,
            fontSize: 16,
            fontWeight: 700,
            backgroundColor: '#3E37FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 20,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(62,55,255,0.30)',
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
            backgroundColor: '#FFFFFF',
            color: '#3E37FF',
            border: '2px solid #E5E7EB',
            borderRadius: 20,
            cursor: 'pointer',
          }}
        >
          Log In
        </Button>
      </div>

      {/* Footer */}
      <p style={{
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 32,
      }}>
        By Alejandro Alvarez · <a href="https://www.techboi.design" target="_blank" rel="noopener noreferrer" style={{ color: '#3E37FF', textDecoration: 'none' }}>www.techboi.design</a>
      </p>
    </div>
  );
}
