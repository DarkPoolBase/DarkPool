import { Plus, BarChart3, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2 border-success/30 text-success hover:bg-success/10"
          onClick={() => navigate("/marketplace")}
        >
          <Plus className="h-3.5 w-3.5" /> Buy Order
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => navigate("/marketplace")}
        >
          <Plus className="h-3.5 w-3.5" /> Sell Order
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => navigate("/analytics")}
        >
          <BarChart3 className="h-3.5 w-3.5" /> View Market
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="justify-start gap-2"
          onClick={() => navigate("/settings")}
        >
          <Key className="h-3.5 w-3.5" /> API Keys
        </Button>
      </div>
    </div>
  );
}
