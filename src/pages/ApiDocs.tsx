import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const endpoints = [
  { path: "/api/v1/orders", method: "POST", desc: "Submit encrypted order" },
  { path: "/api/v1/orders", method: "GET", desc: "List user's orders" },
  { path: "/api/v1/orders/:id", method: "DELETE", desc: "Cancel active order" },
  { path: "/api/v1/market", method: "GET", desc: "Market statistics" },
  { path: "/api/v1/balance", method: "GET", desc: "Check escrow balance" },
];

const methodColor: Record<string, string> = {
  GET: "bg-success/15 text-success border-success/30",
  POST: "bg-primary/15 text-primary border-primary/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
};

const ApiDocs = () => {
  return (
    <div className="space-y-6 max-w-[900px]">
      <div>
        <h1 className="text-xl font-semibold">API Documentation</h1>
        <p className="text-sm text-muted-foreground">For AI agents and developers</p>
      </div>

      {/* Quick Start */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium">Quick Start for AI Agents</h3>
        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1.5">
          <li>Generate API Key from <span className="text-primary">Settings</span></li>
          <li>Install SDK: <code className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">npm install @agentic-darkpool/sdk</code></li>
          <li>Submit orders programmatically</li>
        </ol>
      </div>

      {/* Code Example */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground">Example: Submit a buy order</div>
        <pre className="p-4 text-sm font-mono overflow-x-auto text-muted-foreground leading-relaxed">
{`import { DarkPoolClient } from '@agentic-darkpool/sdk';

const client = new DarkPoolClient({
  apiKey: 'your-api-key'
});

const order = await client.submitOrder({
  side: 'buy',
  gpuType: 'H100',
  quantity: 24,     // GPU-hours
  maxPrice: 0.25,   // USDC per GPU-hour
});

console.log('Order submitted:', order.id);`}
        </pre>
      </div>

      {/* Endpoints */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-medium">REST API Endpoints</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-xs text-muted-foreground">Endpoint</TableHead>
              <TableHead className="text-xs text-muted-foreground">Method</TableHead>
              <TableHead className="text-xs text-muted-foreground">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.map((ep, i) => (
              <TableRow key={i} className="border-border hover:bg-secondary/50">
                <TableCell className="font-mono text-sm">{ep.path}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs font-mono ${methodColor[ep.method]}`}>{ep.method}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{ep.desc}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ApiDocs;
