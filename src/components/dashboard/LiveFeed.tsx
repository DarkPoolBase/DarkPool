const feedItems = [
  {
    title: "Batch #4521 settled",
    detail: "340 GPU-hrs @ $0.21/hr — 23 orders matched",
    time: "Just now",
    highlight: false,
  },
  {
    title: "Your order #4521 filled!",
    detail: "24 H100-hours @ $0.22/hr",
    time: "2 min ago",
    highlight: true,
  },
  {
    title: "Batch #4520 settled",
    detail: "520 GPU-hrs @ $0.19/hr — 41 orders matched",
    time: "5 min ago",
    highlight: false,
  },
  {
    title: "Batch #4519 settled",
    detail: "180 GPU-hrs @ $0.24/hr — 12 orders matched",
    time: "10 min ago",
    highlight: false,
  },
  {
    title: "Your order #4517 filled!",
    detail: "168 A100-hours @ $0.16/hr",
    time: "32 min ago",
    highlight: true,
  },
];

export function LiveFeed() {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 p-4 border-b border-border">
        <span className="h-2 w-2 rounded-full bg-destructive animate-pulse-glow" />
        <h3 className="text-sm font-medium">Live Batch Settlements</h3>
      </div>
      <div className="divide-y divide-border max-h-[320px] overflow-y-auto">
        {feedItems.map((item, i) => (
          <div
            key={i}
            className={`p-3 text-sm ${item.highlight ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`font-medium text-xs ${item.highlight ? "text-primary" : ""}`}>
                {item.title}
              </span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
            <p className="text-xs text-muted-foreground">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
