import { cn } from "@/lib/utils";

interface GlowBlobProps {
  className?: string;
  color?: "purple" | "blue" | "green";
  size?: "sm" | "md" | "lg";
}

const colorMap = {
  purple: "bg-violet-500/10",
  blue: "bg-blue-500/10",
  green: "bg-emerald-500/10",
};

const sizeMap = {
  sm: "w-32 h-32",
  md: "w-64 h-64",
  lg: "w-96 h-96",
};

export function GlowBlob({ className, color = "purple", size = "md" }: GlowBlobProps) {
  return (
    <div
      className={cn(
        "absolute rounded-full blur-[80px] pointer-events-none animate-float",
        colorMap[color],
        sizeMap[size],
        className
      )}
    />
  );
}
