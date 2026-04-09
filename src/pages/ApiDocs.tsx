import { GlassCard } from "@/components/ui/glass-card";
import { SectionLabel } from "@/components/ui/section-label";

const methodColor: Record<string, string> = {
  GET:    "bg-success/10 text-success border-success/20",
  POST:   "bg-primary/10 text-primary border-primary/20",
  DELETE: "bg-destructive/10 text-destructive border-destructive/20",
  PATCH:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const MethodBadge = ({ m }: { m: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border ${methodColor[m]}`}>
    {m}
  </span>
);

const sections = [
  {
    title: "Authentication",
    desc: "DarkPool uses Sign-In with Ethereum (SIWE / EIP-4361). Exchange a wallet signature for a JWT, then pass it as a Bearer token.",
    rows: [
      { method: "GET",  path: "/api/auth/nonce",        auth: "Public",  desc: "Get nonce for wallet address" },
      { method: "POST", path: "/api/auth/verify",       auth: "Public",  desc: "Verify SIWE signature → returns accessToken + refreshToken" },
      { method: "POST", path: "/api/auth/refresh",      auth: "Public",  desc: "Refresh access token" },
      { method: "POST", path: "/api/auth/api-keys",     auth: "JWT",     desc: "Create API key (label optional)" },
      { method: "GET",  path: "/api/auth/api-keys",     auth: "JWT",     desc: "List your API keys" },
      { method: "DELETE", path: "/api/auth/api-keys/:id", auth: "JWT",   desc: "Revoke API key" },
    ],
  },
  {
    title: "Orders",
    desc: "Submit buy or sell orders. Orders enter the next 45-second batch auction. On match, escrow is released and GPU provisioning begins automatically.",
    rows: [
      { method: "POST",   path: "/api/orders",              auth: "JWT",     desc: "Submit buy or sell order" },
      { method: "GET",    path: "/api/orders",              auth: "JWT",     desc: "List your orders (filter: status, side, gpuType)" },
      { method: "GET",    path: "/api/orders/:id",          auth: "JWT",     desc: "Get order details" },
      { method: "GET",    path: "/api/orders/:id/fulfillment", auth: "JWT",  desc: "Get GPU provisioning status (SSH host/port once running)" },
      { method: "DELETE", path: "/api/orders/:id",          auth: "JWT",     desc: "Cancel active order" },
      { method: "GET",    path: "/api/orders/stats",        auth: "JWT",     desc: "Your order statistics" },
      { method: "GET",    path: "/api/orders/metrics",      auth: "Public",  desc: "System-wide order metrics" },
    ],
  },
  {
    title: "AI Agent Orders",
    desc: "Agent endpoints use an API key (X-API-Key header) instead of a JWT. Generate a key from Settings.",
    rows: [
      { method: "POST",   path: "/api/agents/orders",           auth: "API Key", desc: "Submit order (same body as /api/orders)" },
      { method: "GET",    path: "/api/agents/orders",           auth: "API Key", desc: "List your agent orders" },
      { method: "DELETE", path: "/api/agents/orders/:orderId",  auth: "API Key", desc: "Cancel agent order" },
      { method: "GET",    path: "/api/agents/balance",          auth: "API Key", desc: "Get escrow balance" },
    ],
  },
  {
    title: "Market Data",
    desc: "Public market data — no authentication required. GPU prices are derived from settlement clearing prices.",
    rows: [
      { method: "GET", path: "/api/market/prices",               auth: "Public", desc: "Current spot prices per GPU type" },
      { method: "GET", path: "/api/market/prices/history",       auth: "Public", desc: "OHLCV candles — params: gpuType, interval (1h/4h/1d/1w), limit" },
      { method: "GET", path: "/api/market/volume",               auth: "Public", desc: "24h / 7d / 30d volume per GPU type" },
      { method: "GET", path: "/api/market/stats",                auth: "Public", desc: "Total providers, volume, trades, avg clearing price" },
      { method: "GET", path: "/api/market/availability",         auth: "Public", desc: "Live Vast.ai instance counts per GPU type (2-min cache)" },
    ],
  },
  {
    title: "Settlements",
    desc: "Read settlement history. Each settlement corresponds to a completed batch auction.",
    rows: [
      { method: "GET", path: "/api/settlements",          auth: "Public", desc: "List recent settlements (param: limit, default 20)" },
      { method: "GET", path: "/api/settlements/:batchId", auth: "Public", desc: "Get settlement by batch ID" },
    ],
  },
  {
    title: "Providers",
    desc: "Register GPU capacity and earn USDC when your bids are matched. Backed by live Vast.ai instances.",
    rows: [
      { method: "POST",   path: "/api/providers",                  auth: "JWT", desc: "Register as a provider" },
      { method: "GET",    path: "/api/providers",                  auth: "Public", desc: "List all active providers" },
      { method: "GET",    path: "/api/providers/me",               auth: "JWT", desc: "Your provider profile" },
      { method: "GET",    path: "/api/providers/me/earnings",      auth: "JWT", desc: "Your earnings history" },
      { method: "PATCH",  path: "/api/providers/:id/capacity",     auth: "JWT", desc: "Update GPU capacity" },
      { method: "PATCH",  path: "/api/providers/:id/min-price",    auth: "JWT", desc: "Update minimum price per hour" },
      { method: "DELETE", path: "/api/providers/me",               auth: "JWT", desc: "Deregister as provider" },
    ],
  },
  {
    title: "x402 Payment Protocol",
    desc: "Machine-native payment flow for AI agents. Send a single HTTP request with an X-Payment header — no wallets, no approval flows. Backed by USDC on Base.",
    rows: [
      { method: "POST", path: "/api/payments/requirements", auth: "Public", desc: "Get payment requirements for an endpoint (returns 402 + payment headers)" },
      { method: "POST", path: "/api/payments/verify",       auth: "Public", desc: "Verify an x402 payment tx hash" },
    ],
  },
  {
    title: "Activity",
    desc: "Unified wallet activity timeline — order fills, settlements, and cancellations in one feed.",
    rows: [
      { method: "GET", path: "/api/activity", auth: "JWT", desc: "Get your activity timeline (param: limit, default 50, max 200)" },
    ],
  },
  {
    title: "Health",
    desc: "Liveness check.",
    rows: [
      { method: "GET", path: "/api/health", auth: "Public", desc: "API health status" },
    ],
  },
];

const ApiDocs = () => {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-thin tracking-tight text-foreground">API Documentation</h1>
        <p className="text-sm text-muted-foreground mt-2 font-mono text-[11px]">For AI agents and developers</p>
      </div>

      {/* Quick Start */}
      <GlassCard delay={0.1} corners className="p-6 space-y-4">
        <SectionLabel>Quick Start for AI Agents</SectionLabel>
        <ol className="list-decimal list-inside text-sm text-white/50 space-y-4 ml-2">
          <li>Generate an API Key from <span className="text-primary">Settings → API Keys</span></li>
          <li>Pass it as a header: <code className="font-mono text-[11px] bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md text-white/60">X-API-Key: your-key</code></li>
          <li>Submit orders to <code className="font-mono text-[11px] bg-white/[0.04] border border-white/[0.06] px-2 py-1 rounded-md text-white/60">POST /api/agents/orders</code></li>
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
          <span className="font-mono text-[10px] text-white/30 ml-2">agent-example.ts</span>
        </div>
        <pre className="p-6 text-[12px] font-mono overflow-x-auto leading-relaxed">
          <span className="text-white/30">// Submit a BUY order via API key (no wallet signature needed){"\n"}</span>
          <span className="text-primary/60">const</span> <span className="text-white/70"> res</span> = <span className="text-primary/60">await</span> <span className="text-warning/70">fetch</span>(<span className="text-success/70">'https://api.darkpool.finance/api/agents/orders'</span>, {"{"}{"\n"}
          {"  "}<span className="text-white/50">method</span>: <span className="text-success/70">'POST'</span>,{"\n"}
          {"  "}<span className="text-white/50">headers</span>: {"{"}{"\n"}
          {"    "}<span className="text-success/70">'Content-Type'</span>: <span className="text-success/70">'application/json'</span>,{"\n"}
          {"    "}<span className="text-success/70">'X-API-Key'</span>: <span className="text-success/70">'your-api-key'</span>,{"\n"}
          {"  "}{"}"},{"  "}{"\n"}
          {"  "}<span className="text-white/50">body</span>: <span className="text-warning/70">JSON</span>.<span className="text-warning/70">stringify</span>({"{"}{"\n"}
          {"    "}<span className="text-white/50">side</span>: <span className="text-success/70">'buy'</span>,{"\n"}
          {"    "}<span className="text-white/50">gpuType</span>: <span className="text-success/70">'H100'</span>,{"\n"}
          {"    "}<span className="text-white/50">quantity</span>: <span className="text-warning/70">24</span>,{"    "}<span className="text-white/20">// GPU-hours</span>{"\n"}
          {"    "}<span className="text-white/50">maxPrice</span>: <span className="text-success/70">'2.50'</span>,{"  "}<span className="text-white/20">// USDC per GPU-hour</span>{"\n"}
          {"    "}<span className="text-white/50">durationHours</span>: <span className="text-warning/70">24</span>,{"\n"}
          {"  "}{")"},{"\n"}
          {"}"});{"\n\n"}
          <span className="text-primary/60">const</span> <span className="text-white/70"> order</span> = <span className="text-primary/60">await</span> res.<span className="text-warning/70">json</span>();{"\n"}
          console.<span className="text-warning/70">log</span>(<span className="text-success/70">'Order ID:'</span>, order.id, <span className="text-success/70">'Status:'</span>, order.status);
        </pre>
      </GlassCard>

      {/* Base URL + Auth note */}
      <GlassCard delay={0.25} className="p-5 space-y-3">
        <SectionLabel>Base URL &amp; Auth</SectionLabel>
        <div className="space-y-2 font-mono text-[11px] text-white/50">
          <p><span className="text-white/30">Base URL: </span><span className="text-primary/70">https://api.darkpool.finance</span></p>
          <p><span className="text-white/30">JWT header: </span><span className="text-white/60">Authorization: Bearer &lt;accessToken&gt;</span></p>
          <p><span className="text-white/30">Agent header: </span><span className="text-white/60">X-API-Key: &lt;apiKey&gt;</span></p>
          <p className="text-white/30 pt-1">All responses are JSON. Authenticated endpoints return <span className="text-white/50">401</span> if token is missing or expired.</p>
        </div>
      </GlassCard>

      {/* x402 Agent Payment Example */}
      <GlassCard delay={0.28} gradient className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive/40" />
              <span className="w-3 h-3 rounded-full bg-warning/40" />
              <span className="w-3 h-3 rounded-full bg-success/40" />
            </div>
            <span className="font-mono text-[10px] text-white/30 ml-2">x402-agent.ts</span>
          </div>
          <span className="font-mono text-[9px] px-2 py-0.5 rounded-full border border-violet-500/20 bg-violet-500/05 text-violet-400/60 uppercase tracking-wider">x402 Protocol</span>
        </div>
        <pre className="p-6 text-[11px] font-mono overflow-x-auto leading-relaxed">
          <span className="text-white/20">{"// AI agent auto-pays for compute access via HTTP 402\n"}</span>
          <span className="text-white/20">{"// No wallets, no approval flows — pure HTTP + USDC on Base\n\n"}</span>
          <span className="text-primary/60">{"async function "}</span><span className="text-warning/70">{"submitAgentOrder"}</span>{"() {\n"}
          {"  "}<span className="text-white/20">{"// Step 1: Hit endpoint — server returns 402 + payment requirements\n"}</span>
          {"  "}<span className="text-primary/60">{"let"}</span>{" res = "}<span className="text-primary/60">{"await"}</span>{" "}<span className="text-warning/70">{"fetch"}</span>{"("}<span className="text-success/70">{"'https://api.darkpool.finance/api/orders'"}</span>{", {\n"}
          {"    method: "}<span className="text-success/70">{"'POST'"}</span>{", headers: { "}<span className="text-success/70">{"'X-API-Key'"}</span>{": apiKey },\n"}
          {"    body: "}<span className="text-warning/70">{"JSON"}</span>{".stringify({ side: "}<span className="text-success/70">{"'BUY'"}</span>{", gpuType: "}<span className="text-success/70">{"'H100'"}</span>{", quantity: "}<span className="text-warning/70">{"1"}</span>{", pricePerHour: "}<span className="text-warning/70">{"2.50"}</span>{", duration: "}<span className="text-warning/70">{"24"}</span>{" }),\n"}
          {"  });\n\n"}
          {"  "}<span className="text-primary/60">{"if"}</span>{" (res.status === "}<span className="text-warning/70">{"402"}</span>{") {\n"}
          {"    "}<span className="text-white/20">{"// Step 2: Read payment requirements from headers\n"}</span>
          {"    "}<span className="text-primary/60">{"const"}</span>{" amount = res.headers.get("}<span className="text-success/70">{"'X-Payment-Amount'"}</span>{");    "}<span className="text-white/20">{"// '0.01'\n"}</span>
          {"    "}<span className="text-primary/60">{"const"}</span>{" token  = res.headers.get("}<span className="text-success/70">{"'X-Payment-Token'"}</span>{");     "}<span className="text-white/20">{"// USDC on Base\n"}</span>
          {"    "}<span className="text-primary/60">{"const"}</span>{" recip  = res.headers.get("}<span className="text-success/70">{"'X-Payment-Recipient'"}</span>{");\n\n"}
          {"    "}<span className="text-white/20">{"// Step 3: Send USDC on Base\n"}</span>
          {"    "}<span className="text-primary/60">{"const"}</span>{" txHash = "}<span className="text-primary/60">{"await"}</span>{" "}<span className="text-warning/70">{"sendUSDC"}</span>{"(recip, amount); "}<span className="text-white/20">{"// agent wallet signs\n\n"}</span>
          {"    "}<span className="text-white/20">{"// Step 4: Retry with payment proof\n"}</span>
          {"    res = "}<span className="text-primary/60">{"await"}</span>{" "}<span className="text-warning/70">{"fetch"}</span>{"("}<span className="text-success/70">{"'https://api.darkpool.finance/api/orders'"}</span>{", {\n"}
          {"      method: "}<span className="text-success/70">{"'POST'"}</span>{",\n"}
          {"      headers: { "}<span className="text-success/70">{"'X-API-Key'"}</span>{": apiKey, "}<span className="text-success/70">{"'X-Payment-Tx'"}</span>{": txHash, "}<span className="text-success/70">{"'X-Payment-Amount'"}</span>{": amount },\n"}
          {"      body: "}<span className="text-warning/70">{"JSON"}</span>{".stringify({ side: "}<span className="text-success/70">{"'BUY'"}</span>{", gpuType: "}<span className="text-success/70">{"'H100'"}</span>{", quantity: "}<span className="text-warning/70">{"1"}</span>{", pricePerHour: "}<span className="text-warning/70">{"2.50"}</span>{", duration: "}<span className="text-warning/70">{"24"}</span>{" }),\n"}
          {"    });\n"}
          {"  }\n\n"}
          {"  "}<span className="text-primary/60">{"const"}</span>{" order = "}<span className="text-primary/60">{"await"}</span>{" res."}<span className="text-warning/70">{"json"}</span>{"();\n"}
          {"  "}<span className="text-warning/70">{"console"}</span>{"."}<span className="text-warning/70">{"log"}</span>{"("}<span className="text-success/70">{"'Order matched in next batch:'"}</span>{", order.id);\n"}
          {"}"}
        </pre>
      </GlassCard>

      {/* Endpoint Sections */}
      {sections.map((section, si) => (
        <GlassCard key={section.title} delay={0.3 + si * 0.05} corners className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.04]">
            <SectionLabel>{section.title}</SectionLabel>
            <p className="font-mono text-[10px] text-white/30 mt-1.5 leading-relaxed">{section.desc}</p>
          </div>
          <div className="divide-y divide-white/[0.03]">
            {section.rows.map((row, ri) => (
              <div key={ri} className="flex items-start gap-4 px-6 py-3 hover:bg-white/[0.015] transition-colors">
                <div className="w-16 shrink-0 pt-0.5">
                  <MethodBadge m={row.method} />
                </div>
                <div className="w-80 shrink-0">
                  <span className="font-mono text-[11px] text-white/60">{row.path}</span>
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[10px] text-white/35">{row.desc}</span>
                </div>
                <div className="shrink-0">
                  <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                    row.auth === "Public"  ? "bg-white/[0.04] text-white/25" :
                    row.auth === "API Key" ? "bg-amber-500/10 text-amber-400/60" :
                    "bg-primary/10 text-primary/50"
                  }`}>{row.auth}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
};

export default ApiDocs;
