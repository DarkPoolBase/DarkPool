import { DollarSign, BarChart3, CheckCircle } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OrderTable } from "@/components/dashboard/OrderTable";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { LiveFeed } from "@/components/dashboard/LiveFeed";
import { AuctionTimer } from "@/components/dashboard/AuctionTimer";
import { SectionLabel } from "@/components/ui/section-label";

const Dashboard = () => {
  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold text-gradient">Dashboard</h1>
        <p className="text-sm text-white/40 mt-1">Overview of your portfolio and market activity</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={DollarSign} label="Escrow Balance" value="$2,450.00" change="+12.5%" changeType="positive" glow delay={0} />
        <StatsCard icon={BarChart3} label="Active Orders" value="3" delay={0.1} />
        <StatsCard icon={CheckCircle} label="Filled Today" value="156 GPU-hrs" change="+24%" changeType="positive" delay={0.2} />
        <AuctionTimer />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrderTable />
          <QuickActions />
        </div>
        <div>
          <LiveFeed />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
