import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

const endpoints = [
  { path: "/api/v1/orders", method: "POST", desc: "Submit encrypted order" },
  { path: "/api/v1/orders", method: "GET", desc: "List user's orders" },
  { path: "/api/v1/orders/:id", method: "DELETE", desc: "Cancel active order" },
  { path: "/api/v1/market", method: "GET", desc: "Market statistics" },
  { path: "/api/v1/balance", method: "GET", desc: "Check escrow balance" },
];

const methodColor: Record<string, string> = {
  GET: "bg-success/10 text-success border-success/20",
  POST: "bg-primary/10 text-primary border-primary/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
};

const ApiDocs = () => {
  return (
    <div className="space-y-8 max-w-[960px]">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">For AI agents and developers</p>
      </div>

      {/* Quick Start */}
      <GlassCard delay={0.1} corners className="p-6 space-y-4">
        <SectionLabel>Quick Start for AI Agents</SectionLabel>
        <ol className="list-decimal list-inside text-sm text-white/50 space-y-4 ml-2">
          <li>Generate API Key from <span className="text-primary">Settings</span></li>
          <li>Install SDK: <code className="font-mono text-[11px] bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md text-white/60">npm install @agentic-darkpool/sdk</code></li>
          <li>Submit orders programmatically</li>
        </ol>
      </GlassCard>

      {/* Code Example */}
      <GlassCard delay={0.2} gradient className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-2">
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive/40" />
            <span className="w-3 h-3 rounded-full bg-warning/40" />
            <span className="w-3 h-3 rounded-full bg-success/40" />
          </div>
          <span className="font-mono text-[10px] text-white/30 ml-2">example.ts</span>
        </div>
        <pre className="p-6 text-[12px] font-mono overflow-x-auto leading-relaxed">
          <span className="text-primary/60">import</span> <span className="text-white/70">{"{ DarkPoolClient }"}</span> <span className="text-primary/60">from</span> <span className="text-success/70">'@agentic-darkpool/sdk'</span>;{"\n\n"}
          <span className="text-primary/60">const</span> <span className="text-white/70">client</span> = <span className="text-primary/60">new</span> <span className="text-warning/70">DarkPoolClient</span>({"{"}
{"\n"}  apiKey: <span className="text-success/70">'your-api-key'</span>{"\n"}{"}"});{"\n\n"}
          <span className="text-primary/60">const</span> <span className="text-white/70">order</span> = <span className="text-primary/60">await</span> client.<span className="text-warning/70">submitOrder</span>({"{"}
{"\n"}  side: <span className="text-success/70">'buy'</span>,
{"\n"}  gpuType: <span className="text-success/70">'H100'</span>,
{"\n"}  quantity: <span className="text-warning/70">24</span>,     <span className="text-white/20">// GPU-hours</span>
{"\n"}  maxPrice: <span className="text-warning/70">0.25</span>,   <span className="text-white/20">// USDC per GPU-hour</span>
{"\n"}{"}"});{"\n\n"}
          console.<span className="text-warning/70">log</span>(<span className="text-success/70">'Order submitted:'</span>, order.id);
        </pre>
      </GlassCard>

      {/* Endpoints */}
      <GlassCard delay={0.3} corners className="overflow-hidden">
        <div className="px-6 py-4">
          <SectionLabel>REST API Endpoints</SectionLabel>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/[0.04] hover:bg-transparent">
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Endpoint</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Method</TableHead>
              <TableHead className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((ep, i) => (
              <TableRow key={i} className="border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-300">
                <TableCell className="font-mono text-sm text-white/60 py-4">{ep.path}</TableCell>
                <TableCell className="py-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-mono font-medium border ${methodColor[ep.method]}`}>
                    {ep.method}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-white/40 py-4">{ep.desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GlassCard>
    </div>
  );
};

export default ApiDocs;
