import { ArrowLeft, ShieldCheck } from '@phosphor-icons/react';
import { useAppColors } from '../../context/AppearanceContext';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { useSubPageNav } from '../SubPageLayout';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `Spendr operates entirely on-device. We do not collect, transmit, or store any personal financial data on external servers.\n\nThe information you enter — expenses, budgets, income, and categories — exists solely on your device and is never shared with third parties.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `All data you enter is used exclusively to power the features you see within the app: spending insights, budget tracking, and category breakdowns.\n\nWe do not use your data for advertising, profiling, or any purpose beyond the core app functionality.`,
  },
  {
    title: '3. Data Storage & Security',
    body: `Your data is stored using your device's local storage. We recommend keeping your device updated and using a strong device passcode to protect your information.\n\nA future cloud sync feature (opt-in) will use end-to-end encryption. You will always be in full control.`,
  },
  {
    title: '4. Analytics & Crash Reports',
    body: `We may collect anonymous, non-identifiable crash reports to help improve app stability. This data contains no personal or financial information and cannot be linked back to you.`,
  },
  {
    title: '5. Third-Party Services',
    body: `Spendr does not integrate with third-party analytics platforms, advertising networks, or data brokers. No financial data ever leaves your device.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to:\n• Access all data stored by the app (visible directly within the app)\n• Export your data (Settings → Data → Export)\n• Delete all your data by uninstalling the app\n\nFor GDPR or CCPA enquiries, contact us at privacy@spendr.app.`,
  },
  {
    title: '7. Children\'s Privacy',
    body: `Spendr is not directed at children under the age of 13. We do not knowingly collect any information from children.`,
  },
  {
    title: '8. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of any significant changes via an in-app notice. Continued use of Spendr after changes constitutes acceptance of the updated policy.`,
  },
  {
    title: '9. Contact Us',
    body: `If you have questions about this Privacy Policy, please contact:\n\nAlejandro Alvarez\nEmail: privacy@spendr.app\nInstagram / X: @techboi_design`,
  },
];

export default function PrivacyScreen() {
  const c = useAppColors();
  const { exit } = useSubPageNav();

  return (
    <div
      data-app-scroll
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'none',
        backgroundColor: c.canvas,
        paddingBottom: TAB_BAR_CLEARANCE,
      }}
    >

      {/* Header */}
      <div style={{
        backgroundColor: c.surface,
        padding: '14px 20px 16px',
        borderBottom: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center',
        position: 'relative',
      }}>
        <button
          onClick={() => exit('/settings')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={18} weight="light" color="#3E37FF" />
          <span style={{ fontSize: 15, fontWeight: 500, color: c.accent }}>Settings</span>
        </button>
        <h2 style={{
          fontSize: 17, fontWeight: 700, color: c.text,
          margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          Privacy Policy
        </h2>
      </div>

      {/* Hero */}
      <div style={{
        backgroundColor: c.surface,
        padding: '24px 20px',
        borderBottom: `1px solid ${c.border}`,
        textAlign: 'center',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 30,
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 12px',
          boxShadow: '0 8px 20px rgba(16,185,129,0.25)',
        }}>
          <ShieldCheck size={26} weight="light" color="#FFFFFF" />
        </div>
        <p style={{ fontSize: 17, fontWeight: 700, color: c.text, margin: '0 0 4px' }}>Your privacy matters</p>
        <p style={{ fontSize: 13, color: c.textFaint, margin: '0 0 10px', lineHeight: 1.5 }}>
          Spendr is built on a simple principle: your financial data is yours.
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          backgroundColor: '#F0FDF4', borderRadius: 20, padding: '5px 14px',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#10B981' }}>Last updated: April 2026</span>
        </div>
      </div>

      {/* Sections */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SECTIONS.map((section, i) => (
          <div
            key={i}
            style={{
              backgroundColor: c.surface,
              borderRadius: 16,
              padding: '16px',
              boxShadow: c.shadowCard,
            }}
          >
            <p style={{
              fontSize: 14, fontWeight: 700, color: c.text,
              margin: '0 0 8px',
            }}>
              {section.title}
            </p>
            <p style={{
              fontSize: 13, color: c.textMuted,
              margin: 0, lineHeight: 1.65,
              whiteSpace: 'pre-line',
            }}>
              {section.body}
            </p>
          </div>
        ))}

        <p style={{ fontSize: 12, color: c.textFaint, textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          Spendr v1.0.0 · © 2026 Alejandro Alvarez · @techboi_design
        </p>
      </div>
    </div>
  );
}