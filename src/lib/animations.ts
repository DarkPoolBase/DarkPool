// Shared animation config for consistent premium feel across all dashboard pages

export const ease = [0.25, 0.1, 0.25, 1] as const; // cubic-bezier for smooth premium motion

export const pageHeader = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease },
};

export const stagger = {
  container: {
    animate: { transition: { staggerChildren: 0.08 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, ease },
  },
};

export const cardTransition = (delay = 0) => ({
  duration: 0.5,
  delay,
  ease,
});

export const barGrow = (delay = 0) => ({
  initial: { width: 0 },
  animate: { width: "auto" },
  transition: { duration: 0.8, delay, ease: "easeOut" as const },
});
