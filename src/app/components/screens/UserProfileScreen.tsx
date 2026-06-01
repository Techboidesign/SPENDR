import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft, Camera, User, EnvelopeSimple, Phone,
  Lock, ShieldCheck, CalendarBlank, Crown, SignOut,
  Check, X, CaretRight, Eye, EyeSlash,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import { AppIconChip } from '../ui/AppIconChip';
import { useAppColors, useAppearance } from '../../context/AppearanceContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { isSupabaseConfigured } from '../../../lib/supabase';
import { uploadAvatar } from '../../services/appDataService';
import { TAB_BAR_CLEARANCE } from '../BottomTabBar';
import { useSubPageNav } from '../SubPageLayout';
import { AvatarCropModal } from '../AvatarCropModal';
import { BottomSheetModal } from '../BottomSheetModal';
import { bottomSheetChrome } from '../../theme/modalSheet';

/* ─────────── Shared sub-components ─────────── */

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

function ProfileCard({ children }: { children: React.ReactNode }) {
  const c = useAppColors();
  return (
    <div style={{
      backgroundColor: c.surface, borderRadius: 16,
      overflow: 'hidden', boxShadow: c.shadowCard,
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
  const c = useAppColors();
  const { isDark } = useAppearance();
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
          borderBottom: (!last && !editing) ? `1px solid ${c.divider}` : 'none',
          textAlign: 'left', fontFamily: 'inherit',
        }}
      >
        <AppIconChip icon={Icon} accentColor={iconColor} lightBg={iconBg} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 1px', fontWeight: 500 }}>{label}</p>
          <p style={{
            fontSize: 14, fontWeight: 500, color: c.text, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{value || '—'}</p>
        </div>
        {!readOnly && <CaretRight size={15} weight="light" color={c.textFaint} />}
      </button>

      {editing && (
        <div style={{
          padding: '10px 16px 14px',
          backgroundColor: c.canvas,
          borderBottom: last ? 'none' : `1px solid ${c.border}`,
        }}>
          <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              ref={inputRef}
              type={inputType}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); }}
              style={{
                flex: 1, height: 40, padding: '0 12px',
                borderRadius: 10, border: '1px solid #3E37FF',
                fontSize: 14, color: c.text,
                outline: 'none', background: c.surface,
                fontFamily: 'inherit',
              }}
            />
            <button onClick={confirm} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', backgroundColor: '#3E37FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Check size={16} weight="light" color="#FFFFFF" />
            </button>
            <button onClick={cancel} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', backgroundColor: c.border, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={16} weight="light" color="#9CA3AF" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────── Password change bottom sheet ─────────── */
function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  const c = useAppColors();
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={label.includes('Current') ? 'current-password' : 'new-password'}
          style={{
            width: '100%',
            height: 44,
            padding: '0 44px 0 14px',
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            fontSize: 14,
            color: c.text,
            outline: 'none',
            background: c.inputBg,
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {show ? (
            <EyeSlash size={16} weight="light" color="#9CA3AF" />
          ) : (
            <Eye size={16} weight="light" color="#9CA3AF" />
          )}
        </button>
      </div>
    </div>
  );
}

function PasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const c = useAppColors();
  const { updatePassword } = useOnboarding();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setCurrent('');
      setNext('');
      setConfirm('');
      setShowCurrent(false);
      setShowNext(false);
      setShowConfirm(false);
      setSuccess(false);
      setError('');
    }
  }, [open]);

  const save = async () => {
    if (!current) { setError('Enter your current password.'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setError('');
    try {
      await updatePassword(next);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update password.');
    }
  };

  return (
    <BottomSheetModal
      open={open}
      onClose={onClose}
      sheetStyle={{
        ...bottomSheetChrome(c),
        padding: '8px 20px max(32px, env(safe-area-inset-bottom, 0px))',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 20px' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: c.text, margin: 0 }}>Change Password</h3>
        <button type="button" onClick={onClose} style={{ background: c.inputBg, border: 'none', borderRadius: 20, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} weight="light" color="#6B7280" />
        </button>
      </div>
      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Check size={24} weight="light" color="#10B981" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: c.text, margin: 0 }}>Password updated!</p>
        </div>
      ) : (
        <>
          <PasswordField
            label="Current Password"
            value={current}
            onChange={setCurrent}
            show={showCurrent}
            onToggle={() => setShowCurrent(v => !v)}
          />
          <PasswordField
            label="New Password"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggle={() => setShowNext(v => !v)}
          />
          <PasswordField
            label="Confirm New Password"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm(v => !v)}
          />
          {error && <p style={{ fontSize: 12, color: '#EF4444', margin: '-6px 0 12px' }}>{error}</p>}
          <button
            type="button"
            onClick={save}
            style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: '#3E37FF', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Update Password
          </button>
        </>
      )}
    </BottomSheetModal>
  );
}

/* ─────────── Main screen ─────────── */
export default function UserProfileScreen() {
  const c = useAppColors();
  const { state, dispatch } = useApp();
  const { exit } = useSubPageNav();
  const navigate = useNavigate();
  const { logout, auth } = useOnboarding();

  // File input for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2200); };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    await logout();
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
  const handleCropSave = async (base64: string) => {
    try {
      if (isSupabaseConfigured && auth.userId && base64.startsWith('data:')) {
        const res = await fetch(base64);
        const blob = await res.blob();
        const url = await uploadAvatar(auth.userId, blob, 'jpg');
        dispatch({ type: 'SET_USER_AVATAR', avatar: url });
      } else {
        dispatch({ type: 'SET_USER_AVATAR', avatar: base64 });
      }
      setCropSrc(null);
      showToast('Profile photo updated');
    } catch {
      showToast('Could not upload photo');
    }
  };

  /* Field save handlers — all persist to context */
  const saveName = (v: string) => {
    dispatch({ type: 'SET_USER_FULL_NAME', fullName: v });
    dispatch({ type: 'SET_USER_NAME', name: v.split(' ')[0] });
    showToast('Name updated');
  };
  const saveEmail = (v: string) => { dispatch({ type: 'SET_USER_EMAIL', email: v }); showToast('Email updated'); };
  const savePhone = (v: string) => { dispatch({ type: 'SET_USER_PHONE', phone: v }); showToast('Phone updated'); };

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
        backgroundColor: c.surface, padding: '14px 20px 16px',
        borderBottom: `1px solid ${c.border}`,
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
          <span style={{ fontSize: 15, fontWeight: 500, color: c.accent }}>Settings</span>
        </button>
        <h2 style={{
          fontSize: 17, fontWeight: 700, color: c.text,
          margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>Profile</h2>
      </div>

      {/* Avatar hero */}
      <div style={{
        backgroundColor: c.surface, padding: '28px 20px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: `1px solid ${c.border}`,
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
              backgroundColor: c.surface,
              border: '1px solid #F7F7FA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
            }}
          >
            <Camera size={14} weight="light" color="#6B7280" />
          </button>
        </div>

        <p style={{ fontSize: 19, fontWeight: 800, color: c.text, margin: '0 0 3px' }}>{state.userFullName}</p>
        <p style={{ fontSize: 13, color: c.textFaint, margin: '0 0 8px' }}>{state.userEmail}</p>
        <div style={{ padding: '4px 12px', borderRadius: 20, backgroundColor: c.chipSelectedBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: c.accent }}>Personal · Free</span>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>

        {/* Account fields */}
        <SectionLabel title="Account" />
        <ProfileCard>
          <FieldRow icon={User}           iconBg="#EDEDFF" iconColor="#3E37FF"  label="Full Name" value={state.userFullName}  onSave={saveName} />
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
              borderBottom: `1px solid ${c.divider}`, textAlign: 'left', fontFamily: 'inherit',
            }}
          >
            <AppIconChip icon={Lock} accentColor="#EF4444" lightBg="#FEE2E2" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 1px', fontWeight: 500 }}>Password</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: c.text, margin: 0, letterSpacing: 2 }}>••••••••</p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: c.accent, marginRight: 4 }}>Change</span>
            <CaretRight size={15} weight="light" color={c.textFaint} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px' }}>
            <AppIconChip icon={ShieldCheck} accentColor="#16A34A" lightBg="#F0FDF4" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: c.textFaint, margin: '0 0 1px', fontWeight: 500 }}>Two-Factor Auth</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: c.textFaint, margin: 0 }}>Coming soon</p>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: c.textFaint, backgroundColor: c.surfaceInset, borderRadius: 20, padding: '3px 10px' }}>OFF</span>
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
            <AppIconChip icon={SignOut} accentColor="#F97316" lightBg="#FFF7ED" />
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
      <PasswordSheet open={showPasswordSheet} onClose={() => setShowPasswordSheet(false)} />

      {/* Sign out confirm */}
      {showSignOutConfirm && (
        <>
          <div onClick={() => setShowSignOutConfirm(false)} style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(26,26,46,0.4)', zIndex: 200 }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: c.surface, borderRadius: '24px 24px 0 0',
            padding: '24px 20px 32px', zIndex: 201, boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </div>
            <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <SignOut size={24} weight="light" color="#F97316" />
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: c.text, textAlign: 'center', margin: '0 0 6px' }}>Sign Out?</p>
            <p style={{ fontSize: 13, color: c.textFaint, textAlign: 'center', margin: '0 0 24px' }}>Your data is saved locally and will be here when you return.</p>
            <button onClick={handleSignOut}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: '#F97316', color: '#FFFFFF', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>
              Sign Out
            </button>
            <button onClick={() => setShowSignOutConfirm(false)}
              style={{ width: '100%', height: 50, borderRadius: 14, border: 'none', backgroundColor: c.canvas, color: c.textMuted, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
