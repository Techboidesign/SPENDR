import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { motion } from 'motion/react';
import { SplashContourBackground } from './SplashContourBackground';

const EASE = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  animate: { opacity: 1, y: 0, scale: 1 },
};

type WelcomeBrandSequenceProps = {
  children?: ReactNode;
  /** Called once intro (rings → logo → wordmark) finishes */
  onIntroComplete?: () => void;
};

export function WelcomeBrandSequence({ children, onIntroComplete }: WelcomeBrandSequenceProps) {
  const location = useLocation();
  const [splashPlay, setSplashPlay] = useState(0);

  useEffect(() => {
    setSplashPlay((n) => n + 1);
  }, [location.key]);

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 20px',
          minHeight: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {/* Rings centered on the logo; wordmark 40px below logo */}
          <div
            style={{
              position: 'relative',
              width: 110,
              height: 110,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 'min(400px, 108vw)',
                aspectRatio: '673 / 812',
                transform: 'translate(-50%, calc(-52% + 93px)) scale(1.3)',
                transformOrigin: 'center center',
                pointerEvents: 'none',
              }}
            >
              <SplashContourBackground playKey={splashPlay} />
            </div>

            <motion.img
              key={`logo-${splashPlay}`}
              src="/spender-logo.png"
              alt=""
              width={110}
              height={110}
              {...fadeUp}
              transition={{ delay: 0.28, duration: 0.5, ease: EASE }}
              style={{
                display: 'block',
                height: 'auto',
                position: 'relative',
                zIndex: 2,
              }}
            />
          </div>

          <motion.img
            key={`text-${splashPlay}`}
            src="/spender-text.png"
            alt="SPENDR — Smart expense tracker"
            width={260}
            height={89}
            {...fadeUp}
            transition={{ delay: 0.48, duration: 0.45, ease: EASE }}
            onAnimationComplete={() => {
              window.setTimeout(() => onIntroComplete?.(), 120);
            }}
            style={{
              display: 'block',
              width: 'min(260px, 78vw)',
              height: 'auto',
              marginTop: 8,
              position: 'relative',
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {children ? (
        <motion.div
          key={`cta-${splashPlay}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.82, duration: 0.45, ease: EASE }}
          style={{ position: 'relative', zIndex: 2, flexShrink: 0 }}
        >
          {children}
        </motion.div>
      ) : null}
    </div>
  );
}
