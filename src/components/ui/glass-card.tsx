import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

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
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[#0B0C0E]/80 backdrop-blur-xl shadow-2xl overflow-hidden",
        glow && "shadow-[0_0_30px_rgba(108,60,233,0.15)]",
        className
      )}
      {...props}
    >
      {corners && (
        <>
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/10 rounded-tl-sm" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/10 rounded-tr-sm" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/10 rounded-bl-sm" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/10 rounded-br-sm" />
        </>
      )}
      {children}
    </motion.div>
  );

  if (gradient) {
    return (
      <div className="p-px rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent">
        {content}
      </div>
    );
  }

  return content;
}
