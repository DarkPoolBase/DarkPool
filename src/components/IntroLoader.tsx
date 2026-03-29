import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_LINES = [
  { text: "INITIALIZING SECURE CONNECTION...", delay: 0 },
  { text: "LOADING KERNEL MODULES ████████ OK", delay: 400 },
  { text: "VERIFYING NODE INTEGRITY...", delay: 900 },
  { text: "DECRYPTING TRANSPORT LAYER... DONE", delay: 1400 },
  { text: "SYNCING BLOCK HEIGHT: 19,482,301", delay: 1900 },
  { text: "ESTABLISHING P2P MESH... 12 PEERS", delay: 2400 },
  { text: "GPU CLUSTER STATUS: NOMINAL", delay: 2800 },
  { text: "WARNING: INTRUSION DETECTED.", delay: 3300, isWarning: true },
  { text: "COUNTERMEASURES ENGAGED.", delay: 3800, isWarning: true },
  { text: "SYSTEM READY.", delay: 4400, isReady: true },
];

const SCANLINE_COUNT = 6;

interface StatusLineProps {
  text: string;
  isWarning?: boolean;
  isReady?: boolean;
}

const StatusLine = ({ text, isWarning, isReady }: StatusLineProps) => {
  const [displayed, setDisplayed] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
      }
    }, 18 + Math.random() * 12);
    return () => clearInterval(interval);
  }, [text]);

  useEffect(() => {
    if (done) return;
    const blink = setInterval(() => setCursorVisible((v) => !v), 80);
    return () => clearInterval(blink);
  }, [done]);

  const colorClass = isWarning
    ? "text-rose-400"
    : isReady
    ? "text-emerald-400"
    : "text-white/50";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`font-mono text-[11px] md:text-[13px] leading-relaxed tracking-wide ${colorClass}`}
    >
      <span className="text-white/20 mr-3 select-none">{">"}</span>
      {displayed}
      {!done && (
        <span
          className={`inline-block w-[7px] h-[14px] ml-[2px] align-middle ${
            cursorVisible ? "bg-current" : "bg-transparent"
          }`}
          style={{ transition: "background-color 0.05s" }}
        />
      )}
    </motion.div>
  );
};

interface IntroLoaderProps {
  onComplete: () => void;
}

export const IntroLoader = ({ onComplete }: IntroLoaderProps) => {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [exiting, setExiting] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Trigger random glitch bursts
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 80 + Math.random() * 120);
    }, 600 + Math.random() * 1200);
    return () => clearInterval(glitchInterval);
  }, []);

  // Reveal lines with staggered timing
  useEffect(() => {
    const timers = STATUS_LINES.map((line, i) =>
      setTimeout(() => {
        setVisibleLines((prev) => [...prev, i]);
      }, line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // Exit after all lines shown
  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setExiting(true);
    }, 5200);
    return () => clearTimeout(exitTimer);
  }, []);

  const handleExitComplete = useCallback(() => {
    if (exiting) onComplete();
  }, [exiting, onComplete]);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {!exiting && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] bg-[#030305] flex items-center justify-center overflow-hidden"
        >
          {/* Scanlines overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
            }}
          />

          {/* Horizontal scan beam */}
          <motion.div
            className="absolute left-0 right-0 h-[2px] z-20 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.15) 20%, rgba(139,92,246,0.3) 50%, rgba(139,92,246,0.15) 80%, transparent 100%)",
              boxShadow: "0 0 20px 4px rgba(139,92,246,0.08)",
            }}
            animate={{ top: ["0%", "100%"] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Random horizontal glitch bars */}
          {glitchActive && (
            <>
              {Array.from({ length: SCANLINE_COUNT }).map((_, i) => {
                const top = Math.random() * 100;
                const height = 1 + Math.random() * 3;
                const offset = (Math.random() - 0.5) * 6;
                return (
                  <div
                    key={`glitch-${i}`}
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{
                      top: `${top}%`,
                      height: `${height}px`,
                      background: `rgba(139, 92, 246, ${0.05 + Math.random() * 0.1})`,
                      transform: `translateX(${offset}px)`,
                      mixBlendMode: "screen",
                    }}
                  />
                );
              })}
            </>
          )}

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
            }}
          />

          {/* Content */}
          <div
            className="relative z-40 w-full max-w-[600px] px-8 space-y-1"
            style={{
              transform: glitchActive
                ? `translate(${(Math.random() - 0.5) * 2}px, ${(Math.random() - 0.5) * 1}px)`
                : "none",
              transition: "transform 0.05s",
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <div className="font-mono text-[10px] text-white/20 tracking-[0.3em] uppercase mb-1">
                AERO://SYSTEMS
              </div>
              <div className="h-px bg-gradient-to-r from-primary/40 via-white/10 to-transparent" />
            </div>

            {/* Status lines */}
            <div className="space-y-[6px]">
              {visibleLines.map((lineIdx) => {
                const line = STATUS_LINES[lineIdx];
                return (
                  <StatusLine
                    key={lineIdx}
                    text={line.text}
                    isWarning={line.isWarning}
                    isReady={line.isReady}
                  />
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-8 pt-4">
              <div className="h-[1px] w-full bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/60 to-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-mono text-[9px] text-white/20 tracking-[0.2em]">
                  BOOT SEQUENCE
                </span>
                <motion.span
                  className="font-mono text-[9px] text-white/20 tracking-[0.2em]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  v4.2.1
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
