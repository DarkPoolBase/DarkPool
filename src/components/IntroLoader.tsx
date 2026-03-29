import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_LINES = [
  { text: "initializing secure connection...", delay: 0 },
  { text: "loading kernel modules ████████ ok", delay: 400 },
  { text: "verifying node integrity... done", delay: 900 },
  { text: "decrypting transport layer... done", delay: 1400 },
  { text: "syncing block height: 19,482,301", delay: 1900 },
  { text: "establishing p2p mesh... 12 peers", delay: 2400 },
  { text: "gpu cluster status: nominal", delay: 2800 },
  { text: "loading interface...", delay: 3300 },
  { text: "system ready.", delay: 3800, isReady: true },
];

interface StatusLineProps {
  text: string;
  isReady?: boolean;
  index: number;
}

const StatusLine = ({ text, isReady, index }: StatusLineProps) => {
  const [displayed, setDisplayed] = useState("");
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
    }, 14 + Math.random() * 10);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
      className={`font-mono text-[12px] md:text-[13px] leading-[1.8] tracking-wide ${
        isReady ? "text-emerald-400/90" : "text-white/40"
      }`}
    >
      <span className="text-white/15 mr-2 select-none">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="text-white/20 mr-2 select-none">$</span>
      {displayed}
      {!done && (
        <span className="inline-block w-[6px] h-[13px] ml-[1px] align-middle bg-current animate-pulse" />
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

  useEffect(() => {
    const timers = STATUS_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, i]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 4600);
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
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[9999] bg-[#030305] flex items-start justify-center overflow-hidden pt-[20vh]"
        >
          {/* Content */}
          <div className="relative z-40 w-full max-w-[540px] px-8">
            {/* Terminal header bar */}
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className="flex gap-[6px]">
                <div className="w-[10px] h-[10px] rounded-full bg-white/[0.06]" />
                <div className="w-[10px] h-[10px] rounded-full bg-white/[0.06]" />
                <div className="w-[10px] h-[10px] rounded-full bg-white/[0.06]" />
              </div>
              <span className="font-mono text-[10px] text-white/15 tracking-[0.15em] ml-2">
                darkpool — bash — 80×24
              </span>
            </div>

            {/* Terminal body */}
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
              {/* Prompt header */}
              <div className="font-mono text-[10px] text-white/20 tracking-[0.2em] uppercase mb-4 pb-3 border-b border-white/[0.04]">
                aero@node-0x7a3b ~ boot
              </div>

              {/* Status lines */}
              <div className="space-y-0">
                {visibleLines.map((lineIdx) => {
                  const line = STATUS_LINES[lineIdx];
                  return (
                    <StatusLine
                      key={lineIdx}
                      index={lineIdx}
                      text={line.text}
                      isReady={line.isReady}
                    />
                  );
                })}
              </div>

              {/* Progress indicator */}
              <div className="mt-5 pt-3 border-t border-white/[0.04]">
                <div className="h-[2px] w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/20"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4.4, ease: "linear" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
