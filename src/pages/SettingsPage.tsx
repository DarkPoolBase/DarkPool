import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Copy, RefreshCw, Trash2 } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="space-y-6 max-w-[800px]">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your wallet, API keys, and notifications</p>
      </div>

      {/* Wallet */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-medium">Connected Wallet</h3>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted-foreground">0x7a3b...f82c</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">Disconnect</Button>
            <Button variant="outline" size="sm" className="text-xs">Change Wallet</Button>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-medium">API Keys</h3>
        {[
          { label: "Production Key", key: "sk_live_****************************" },
          { label: "Test Key", key: "sk_test_****************************" },
        ].map((item) => (
          <div key={item.label} className="border border-border rounded-md p-3 space-y-2">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-mono text-sm">{item.key}</p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7"><Copy className="h-3 w-3" /> Copy</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7"><RefreshCw className="h-3 w-3" /> Regenerate</Button>
              <Button variant="outline" size="sm" className="text-xs gap-1 h-7 text-destructive hover:text-destructive"><Trash2 className="h-3 w-3" /> Revoke</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-medium">Notification Preferences</h3>
        {[
          { label: "Order filled", defaultChecked: true },
          { label: "Batch settlements", defaultChecked: true },
          { label: "Price alerts", defaultChecked: false },
          { label: "Provider earnings", defaultChecked: true },
          { label: "Marketing updates", defaultChecked: false },
        ].map((pref) => (
          <div key={pref.label} className="flex items-center justify-between py-1">
            <span className="text-sm">{pref.label}</span>
            <Switch defaultChecked={pref.defaultChecked} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
