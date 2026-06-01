import { useReducedMotion } from 'motion/react';
import {
  FAB_POP_TRANSITION,
  FAB_POP_TRANSITION_REDUCED,
  MODAL_TRANSITION,
  MODAL_TRANSITION_REDUCED,
} from '../theme/motion';

export function useAppMotion() {
  const reduceMotion = useReducedMotion() ?? false;

  return {
    reduceMotion,
    modalTransition: reduceMotion ? MODAL_TRANSITION_REDUCED : MODAL_TRANSITION,
    fabPopTransition: reduceMotion ? FAB_POP_TRANSITION_REDUCED : FAB_POP_TRANSITION,
    sheetMotion: reduceMotion
      ? {
          initial: { y: 0 },
          animate: { y: 0 },
          exit: { y: 0 },
        }
      : {
          initial: { y: '100%' as const },
          animate: { y: 0 },
          exit: { y: '100%' as const },
        },
    backdropMotion: reduceMotion
      ? {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        }
      : {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
        },
    /** Scale enter/exit for menus and icon swaps — never from zero. */
    popScale: reduceMotion
      ? {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 1, opacity: 0 },
        }
      : {
          initial: { scale: 0.92, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.92, opacity: 0 },
        },
  };
}
