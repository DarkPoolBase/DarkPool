import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

export function SectionLabel({ children, pulse = false, className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
        </span>
      )}
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        {children}
      </span>
    </div>
  );
}
