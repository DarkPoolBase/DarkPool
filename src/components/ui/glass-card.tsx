import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useRef, useCallback } from "react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  glow?: boolean;
  gradient?: boolean;
  corners?: boolean;
  delay?: number;
  children: React.ReactNode;
}

export function GlassCard({
  glow = false,
  gradient = false,
  corners = false,
  delay = 0,
  className,
  children,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || !glowRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glowRef.current.style.opacity = "1";
    glowRef.current.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(139,92,246,0.12), rgba(255,255,255,0.04) 40%, transparent 70%)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  }, []);

  const content = (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative rounded-2xl bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden",
        "border border-white/[0.06]",
        "hover:border-white/[0.1] transition-all duration-500",
        glow && "shadow-[0_0_30px_rgba(108,60,233,0.15)]",
        className
      )}
      style={{
        boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(255,255,255,0.03)",
      }}
      {...props}
    >
      {/* Mouse-following border glow */}
      <div
        ref={glowRef}
        className="absolute inset-0 z-0 pointer-events-none rounded-2xl opacity-0 transition-opacity duration-500"
      />
      {/* Subtle top edge highlight */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent z-10 pointer-events-none" />
      {corners && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/[0.08] rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/[0.08] rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/[0.08] rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/[0.08] rounded-br-sm" />
        </>
      )}
      <div className="relative z-10 flex flex-col flex-1">{children}</div>
    </motion.div>
  );

  return content;
}
