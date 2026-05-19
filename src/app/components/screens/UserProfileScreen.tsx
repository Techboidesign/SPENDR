import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Camera, User, At, EnvelopeSimple, Phone,
  Lock, ShieldCheck, CalendarBlank, Crown, SignOut,
  Check, X, CaretRight, Eye, EyeSlash,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { useSubPageNav } from '../SubPageLayout';
import { AvatarCropModal } from '../AvatarCropModal';

/* ─────────── Shared sub-components ─────────── */

function SectionLabel({ title }: { title: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 600, color: '#9CA3AF',
      letterSpacing: 0.8, padding: '14px 20px 6px', margin: 0,
    }}>
      {title.toUpperCase()}
    </p>
  );
}

function ProfileCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF', borderRadius: 16,
      overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}>
      {children}
    </div>
  );
}

/* ─────────── Tap-to-edit field row ─────────── */
interface FieldRowProps {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  last?: boolean;
  inputType?: string;
  onSave?: (v: string) => void;
  readOnly?: boolean;
}

function FieldRow({
  icon: Icon, iconBg, iconColor, label, value,
  last, inputType = 'text', onSave, readOnly = false,
}: FieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => {
    if (readOnly) return;
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const confirm = () => { onSave?.(draft.trim() || value); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div>
      <button
        onClick={open}
        disabled={readOnly}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '13px 16px', width: '100%',
          border: 'none', background: 'none',
          cursor: readOnly ? 'default' : 'pointer',
          borderBottom: (!last && !editing) ? '1px solid #F7F7FA' : 'none',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 9, backgroundColor: iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={16} weight="light" color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 1px', fontWeight: 500 }}>{label}</p>
          <p style={{
            fontSize: 14, fontWeight: 500, color: '#1A1A2E', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{value || '—'}</p>
        </div>
        {!readOnly && <CaretRight size={15} weight="light" color="#D1D5DB" />}
      </button>

      {editing && (
        <div style={{
          padding: '10px 16px 14px',
          backgroundColor: '#F7F7FA',
          borderBottom: last ? 'none' : '1px solid #F0F0F5',
        }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              ref={inputRef}
              type={inputType}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
              style={{
                flex: 1, height: 40, padding: '0 12px',
                borderRadius: 10, border: '2px solid #3E37FF',
                fontSize: 14, color: '#1A1A2E',
                outline: 'none', background: '#FFFFFF',
                fontFamily: 'inherit',
              }}
            />
            <button onClick={confirm} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', backgroundColor: '#3E37FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={16} weight="light" color="#FFFFFF" />
            </button>
            <button onClick={cancel} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', backgroundColor: '#F0F0F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={16} weight="light" color="#9CA3AF" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Password change bottom sheet ─────────── */
function PasswordSheet({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const save = () => {
    if (!current) { setError('Enter your current password.'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setError(''); setSuccess(true);
    setTimeout(onClose, 1500);
  };

  const PwField = ({ label, value, onChange, show, toggle }: {
    label: string; value: string; onChange: (v: string) => void; show: boolean; toggle: () => void;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} placeholder="••••••••"
          style={{
            width: '100%', height: 44, padding: '0 44px 0 14px',
            borderRadius: 12, border: '1.5px solid #E5E7EB',
            fontSize: 14, color: '#1A1A2E', outline: 'none',
            background: '#F7F7FA', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        <button onClick={toggle} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {show ? <EyeSlash size={16} weight="light" color="#9CA3AF" /> : <Eye size={16} weight="light" color="#9CA3AF" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,46,0.4)', zIndex: 200 }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF', borderRadius: '24px 24px 0 0',
        padding: '8px 20px 32px', zIndex: 201,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Change Password</h3>
          <button onClick={onClose} style={{ background: '#F7F7FA', border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} weight="light" color="#6B7280" />
          </button>
        </div>
        {success ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} weight="light" color="#10B981" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>Password updated!</p>
          </div>
        ) : (
          <>
            <PwField label="Current Password" value={current} onChange={setCurrent} show={showCurrent} toggle={() => setShowCurrent(v => !v)} />
            <PwField label="New Password" value={next} onChange={setNext} show={showNext} toggle={() => setShowNext(v => !v)} />
            <PwField label="Confirm New Password" value={confirm} onChange={setConfirm} show={showNext} toggle={() => setShowNext(v => !v)} />
            {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '-6px 0 12px' }}>{error}</p>}
            <button
              onClick={save}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: '#3E37FF', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Update Password
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ─────────── Main screen ─────────── */
export default function UserProfileScreen() {
  const { state, dispatch } = useApp();
  const { exit } = useSubPageNav();
  const navigate = useNavigate();
  const { logout } = useOnboarding();

  // File input for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const handleSignOut = () => {
    setShowSignOutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  /* Avatar upload flow */
  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCropSrc(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = ''; // reset so same file can be re-selected
  };
  const handleCropSave = (base64: string) => {
    dispatch({ type: 'SET_USER_AVATAR', avatar: base64 });
    setCropSrc(null);
    showToast('Profile photo updated');
  };

  /* Field save handlers — all persist to context */
  const saveName = (v: string) => {
    dispatch({ type: 'SET_USER_FULL_NAME', fullName: v });
    dispatch({ type: 'SET_USER_NAME', name: v.split(' ')[0] });
    showToast('Name updated');
  };
  const saveUsername = (v: string) => {
    const clean = v.startsWith('@') ? v : `@${v}`;
    dispatch({ type: 'SET_USER_USERNAME', username: clean });
    showToast('Username updated');
  };
  const saveEmail = (v: string) => { dispatch({ type: 'SET_USER_EMAIL', email: v }); showToast('Email updated'); };
  const savePhone = (v: string) => { dispatch({ type: 'SET_USER_PHONE', phone: v }); showToast('Phone updated'); };

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#F7F7FA', paddingBottom: TAB_BAR_CLEARANCE, position: 'relative' }}>

      {/* Hidden file input */}
      <input
        ref={fileInputRef} type="file" accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 12, left: 20, right: 20,
          backgroundColor: '#1A1A2E', color: '#FFFFFF',
          borderRadius: 12, padding: '12px 16px',
          fontSize: 13, fontWeight: 500, textAlign: 'center',
          zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {/* Nav header */}
      <div style={{
        backgroundColor: '#FFFFFF', padding: '14px 20px 16px',
        borderBottom: '1px solid #F0F0F5',
        display: 'flex', alignItems: 'center',
        position: 'relative',
      }}>
        <button
          onClick={() => exit('/settings')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={18} weight="light" color="#3E37FF" />
          <span style={{ fontSize: 15, fontWeight: 500, color: '#3E37FF' }}>Settings</span>
        </button>
        <h2 style={{
          fontSize: 17, fontWeight: 700, color: '#1A1A2E',
          margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>Profile</h2>
      </div>

      {/* Avatar hero */}
      <div style={{
        backgroundColor: '#FFFFFF', padding: '28px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: '1px solid #F0F0F5',
      }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          {/* Avatar — photo or gradient initial */}
          {state.userAvatar ? (
            <img
              src={state.userAvatar} alt="avatar"
              style={{
                width: 80, height: 80, borderRadius: 40,
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 40,
              background: 'linear-gradient(135deg, #3E37FF 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, color: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(62,55,255,0.3)',
            }}>
              {state.userFullName[0]}
            </div>
          )}
          {/* Camera button */}
          <button
            onClick={handleAvatarClick}
            style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 28, height: 28, borderRadius: 14,
              backgroundColor: '#FFFFFF',
              border: '2px solid #F7F7FA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            }}
          >
            <Camera size={14} weight="light" color="#6B7280" />
          </button>
        </div>

        <p style={{ fontSize: 19, fontWeight: 800, color: '#1A1A2E', margin: '0 0 3px' }}>{state.userFullName}</p>
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 8px' }}>{state.userUsername}</p>
        <div style={{ padding: '4px 12px', borderRadius: 20, backgroundColor: '#EDEDFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#3E37FF' }}>Personal · Free</span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Account fields */}
        <SectionLabel title="Account" />
        <ProfileCard>
          <FieldRow icon={User}           iconBg="#EDEDFF" iconColor="#3E37FF"  label="Full Name" value={state.userFullName}  onSave={saveName} />
          <FieldRow icon={At}             iconBg="#F3E8FF" iconColor="#7C3AED"  label="Username"  value={state.userUsername}  onSave={saveUsername} />
          <FieldRow icon={EnvelopeSimple} iconBg="#D1FAE5" iconColor="#10B981"  label="Email"     value={state.userEmail}     inputType="email" onSave={saveEmail} />
          <FieldRow icon={Phone}          iconBg="#FEF3C7" iconColor="#D97706"  label="Phone"     value={state.userPhone}     inputType="tel"   onSave={savePhone} last />
        </ProfileCard>

        {/* Security */}
        <SectionLabel title="Security" />
        <ProfileCard>
          <button
            onClick={() => setShowPasswordSheet(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 16px', width: '100%',
              border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: '1px solid #F7F7FA', textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Lock size={16} weight="light" color="#EF4444" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 1px', fontWeight: 500 }}>Password</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1A1A2E', margin: 0, letterSpacing: 2 }}>••••••••</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#3E37FF', marginRight: 4 }}>Change</span>
            <CaretRight size={15} weight="light" color="#D1D5DB" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldCheck size={16} weight="light" color="#16A34A" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 1px', fontWeight: 500 }}>Two-Factor Auth</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#9CA3AF', margin: 0 }}>Coming soon</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', backgroundColor: '#F3F4F6', borderRadius: 20, padding: '3px 10px' }}>OFF</span>
          </div>
        </ProfileCard>

        {/* Info */}
        <SectionLabel title="Account Info" />
        <ProfileCard>
          <FieldRow icon={CalendarBlank} iconBg="#F0FDF4" iconColor="#16A34A" label="Member Since" value="January 2026" readOnly />
          <FieldRow icon={Crown}         iconBg="#FEF3C7" iconColor="#D97706" label="Plan"         value="Personal · Free" readOnly last />
        </ProfileCard>

        {/* Actions */}
        <SectionLabel title="Account Actions" />
        <ProfileCard>
          <button
            onClick={() => setShowSignOutConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <SignOut size={16} weight="light" color="#F97316" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#F97316' }}>Sign Out</span>
          </button>
        </ProfileCard>
      </div>

      {/* Canvas crop modal */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onSave={handleCropSave}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {/* Password sheet */}
      {showPasswordSheet && <PasswordSheet onClose={() => setShowPasswordSheet(false)} />}

      {/* Sign out confirm */}
      {showSignOutConfirm && (
        <>
          <div onClick={() => setShowSignOutConfirm(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,46,0.4)', zIndex: 200 }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#FFFFFF', borderRadius: '24px 24px 0 0',
            padding: '24px 20px 32px', zIndex: 201, boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <SignOut size={24} weight="light" color="#F97316" />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', textAlign: 'center', margin: '0 0 6px' }}>Sign Out?</p>
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', margin: '0 0 24px' }}>Your data is saved locally and will be here when you return.</p>
            <button onClick={handleSignOut}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: '#F97316', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              Sign Out
            </button>
            <button onClick={() => setShowSignOutConfirm(false)}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: '#F7F7FA', color: '#6B7280', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
