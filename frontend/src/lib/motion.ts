import { type Transition, type Variants } from "framer-motion";

export const transition = {
  fast: { duration: 0.15, ease: "easeOut" } satisfies Transition,
  base: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } satisfies Transition,
  spring: { type: "spring", stiffness: 350, damping: 30 } satisfies Transition,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: transition.base },
  exit: { opacity: 0, y: -6, transition: transition.fast },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transition.base },
  exit: { opacity: 0, transition: transition.fast },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: transition.spring },
  exit: { opacity: 0, scale: 0.98, transition: transition.fast },
};

export const stagger = (staggerChildren = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren, delayChildren: 0.04 } },
});
