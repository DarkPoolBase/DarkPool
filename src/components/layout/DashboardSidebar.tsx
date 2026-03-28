import {
  BarChart3,
  ShoppingCart,
  ClipboardList,
  LineChart,
  Monitor,
  FileText,
  Settings,
  Globe,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SectionLabel } from "@/components/ui/section-label";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Provider Panel", url: "/provider", icon: Monitor },
  { title: "API Docs", url: "/api-docs", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/[0.06] bg-[hsl(var(--sidebar-background))]">
      {/* Logo area with gradient accent */}
      <div className="relative px-4 py-5 border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <Globe className="h-7 w-7 text-primary shrink-0" />
            <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
          </div>
          {!collapsed && (
            <span className="font-mono text-[11px] font-semibold tracking-[0.15em] uppercase text-white/80">
              Agentic Dark Pool
            </span>
          )}
        </div>
      </div>

      <SidebarContent className="pt-4">
        {!collapsed && (
          <div className="px-4 mb-2">
            <SectionLabel>Navigation</SectionLabel>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url || (item.url === "/dashboard" && location.pathname === "/dashboard");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className="relative gap-3 text-white/50 hover:text-white/80 hover:bg-white/[0.03] transition-all duration-300 rounded-lg mx-1"
                        activeClassName="text-white bg-primary/10 shadow-[inset_3px_0_0_hsl(var(--primary)),0_0_12px_rgba(108,60,233,0.15)]"
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="text-[13px]">{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Version tag at bottom */}
        {!collapsed && (
          <div className="mt-auto px-4 py-4">
            <SectionLabel pulse>System Online</SectionLabel>
            <p className="font-mono text-[10px] text-white/20 mt-1">v0.1.0-alpha · Base Mainnet</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
