import { useState } from 'react';
import { useAppColors } from '../../context/AppearanceContext';
import { ArrowLeft, Plus, Minus, EnvelopeSimple, ChatCircleDots } from '@phosphor-icons/react';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { useSubPageNav } from '../SubPageLayout';

const FAQ_ITEMS = [
  {
    q: 'How do I add a new expense?',
    a: 'Tap the + button in the centre of the bottom tab bar. Fill in the amount, category, date, and expense type (one-time, monthly, or yearly), then tap Save.',
  },
  {
    q: 'How do I set or change my monthly budget?',
    a: 'Go to Settings → Monthly Budget and tap the row to edit your budget inline. You can also adjust per-category budgets inside the Budget & Goals screen.',
  },
  {
    q: 'Can I edit or delete an existing expense?',
    a: 'Yes. In the Expenses screen, tap any expense to open it in edit mode. To delete, open the expense and tap the trash icon in the top-right corner.',
  },
  {
    q: 'What is the difference between one-time, monthly, and yearly expenses?',
    a: 'One-time expenses are single purchases. Monthly and yearly expenses are recurring — they appear in your spending trend across months automatically.',
  },
  {
    q: 'How do I export my data?',
    a: 'Go to Settings → Data and tap Export data. You get a JSON backup with expenses, income, budget, saving goals, and categories.',
  },
  {
    q: 'Is my data stored securely?',
    a: 'All data is stored locally on your device. No personal financial data is sent to external servers. A cloud sync option is on our roadmap.',
  },
];

function FAQItem({ item, isOpen, onToggle }: {
  item: typeof FAQ_ITEMS[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const c = useAppColors();
  return (
    <div style={{ borderBottom: `1px solid ${c.divider}` }}>
      <button
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '15px 16px', width: '100%',
          border: 'none', background: 'none', cursor: 'pointer',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: c.text, lineHeight: 1.4 }}>
          {item.q}
        </span>
        <div style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: isOpen ? '#3E37FF' : '#F3F4F6',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background-color 0.2s',
        }}>
          {isOpen
            ? <Minus size={12} weight="light" color="#FFFFFF" />
            : <Plus size={12} weight="light" color="#9CA3AF" />
          }
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <p style={{
            fontSize: 13, color: c.textMuted, margin: 0, lineHeight: 1.6,
          }}>
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  const c = useAppColors();
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, color: c.textFaint,
      letterSpacing: 0.8, padding: '14px 20px 6px', margin: 0,
    }}>
      {title.toUpperCase()}
    </p>
  );
}

export default function HelpScreen() {
  const c = useAppColors();
  const { exit } = useSubPageNav();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

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
        position: 'relative',
      }}
    >

      {toast && (
        <div style={{
          position: 'absolute', top: 12, left: 20, right: 20,
          backgroundColor: c.text, color: c.onAccent,
          borderRadius: 12, padding: '12px 16px',
          fontSize: 13, fontWeight: 500, textAlign: 'center',
          zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      <div style={{
        backgroundColor: c.surface,
        padding: '14px 20px 16px',
        borderBottom: `1px solid ${c.border}`,
        display: 'flex', alignItems: 'center',
      }}>
        <button
          onClick={() => exit('/settings')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={18} weight="light" color={c.accent} />
          <span style={{ fontSize: 15, fontWeight: 500, color: c.accent }}>Settings</span>
        </button>
        <h2 style={{
          fontSize: 17, fontWeight: 700, color: c.text,
          margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          FAQ
        </h2>
      </div>

      <div style={{ padding: '0 16px' }}>
        <SectionLabel title="Contact" />
        <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
          <button
            onClick={() => showToast('Opening email client…')}
            style={{
              flex: 1, padding: '14px 12px', borderRadius: 14,
              border: 'none', backgroundColor: c.surface, cursor: 'pointer',
              boxShadow: c.shadowCard,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.chipSelectedBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EnvelopeSimple size={20} weight="light" color="#3E37FF" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>Email Us</span>
            <span style={{ fontSize: 10, color: c.textFaint }}>support@spendr.app</span>
          </button>

          <button
            onClick={() => showToast('Opening feedback form…')}
            style={{
              flex: 1, padding: '14px 12px', borderRadius: 14,
              border: 'none', backgroundColor: c.surface, cursor: 'pointer',
              boxShadow: c.shadowCard,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChatCircleDots size={20} weight="light" color="#10B981" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: c.text }}>Feedback</span>
            <span style={{ fontSize: 10, color: c.textFaint }}>Share ideas</span>
          </button>
        </div>

        <SectionLabel title="Frequently Asked Questions" />
        <div style={{ backgroundColor: c.surface, borderRadius: 16, overflow: 'hidden', boxShadow: c.shadowCard }}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              item={item}
              isOpen={openFaq === i}
              onToggle={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>

        <p style={{ fontSize: 12, color: c.textFaint, textAlign: 'center', marginTop: 20, lineHeight: 1.5 }}>
          Spendr v1.0.0 · Made with ♥ by Alejandro Alvarez
        </p>
      </div>
    </div>
  );
}
