import { useEffect, useState } from 'react';

/** True on real phones / installed PWA — use full viewport, no design mockup frame. */
export function getNativeDeviceShell(): boolean {
  if (typeof window === 'undefined') return false;

  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const coarseMobile = window.matchMedia(
    '(max-width: 520px) and (hover: none) and (pointer: coarse)',
  ).matches;

  return standaloneMedia || iosStandalone || coarseMobile;
}

export function useDeviceShell(): boolean {
  const [native, setNative] = useState(getNativeDeviceShell);

  useEffect(() => {
    const update = () => setNative(getNativeDeviceShell());

    const standaloneMq = window.matchMedia('(display-mode: standalone)');
    const mobileMq = window.matchMedia(
      '(max-width: 520px) and (hover: none) and (pointer: coarse)',
    );

    standaloneMq.addEventListener('change', update);
    mobileMq.addEventListener('change', update);
    window.addEventListener('resize', update);

    return () => {
      standaloneMq.removeEventListener('change', update);
      mobileMq.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return native;
}
