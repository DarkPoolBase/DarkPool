import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export function AuctionTimer() {
  const [seconds, setSeconds] = useState(32);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s <= 0 ? 60 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const isUrgent = seconds <= 10;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className={`rounded-lg border bg-card p-4 flex items-center gap-3 transition-colors ${
      isUrgent ? "border-warning/50" : "border-border"
    }`}>
      <Timer className={`h-5 w-5 ${isUrgent ? "text-warning animate-pulse-glow" : "text-muted-foreground"}`} />
      <div>
        <p className="text-xs text-muted-foreground">Next batch in</p>
        <p className={`font-mono text-lg font-semibold ${isUrgent ? "text-warning" : ""}`}>
          {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
        </p>
      </div>
    </div>
  );
}
