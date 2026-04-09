import {
  BarChart3,
  ShoppingCart,
  ClipboardList,
  LineChart,
  Monitor,
  FileText,
  Settings,
  Bot,
  Activity,
} from "lucide-react";
import darkpoolLogo from "@/assets/darkpool-logo.png";
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

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
  { title: "Marketplace", url: "/marketplace", icon: ShoppingCart },
  { title: "Orders", url: "/orders", icon: ClipboardList },
  { title: "Activity", url: "/activity", icon: Activity },
  { title: "Analytics", url: "/analytics", icon: LineChart },
  { title: "Agent Mode", url: "/agent-dashboard", icon: Bot },
  { title: "Provider Panel", url: "/provider", icon: Monitor },
  { title: "API Docs", url: "/api-docs", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-white/[0.08] bg-transparent"
      style={{
        background: 'transparent',
      }}
    >
      {/* Glassmorphic overlay */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      />
      {/* Top highlight edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        }}
      />
      {/* Left edge highlight */}
      <div
        className="absolute top-0 left-0 bottom-0 w-px z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent 50%, rgba(255,255,255,0.05))',
        }}
      />

      {/* Logo area */}
      <a href="/" className={`relative z-10 border-b border-white/[0.06] h-[56px] md:h-[68px] flex items-center ${collapsed ? 'px-2' : 'px-4'} cursor-pointer`}>
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.06] to-transparent pointer-events-none" />
        <div className={`relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="relative">
            <img src={darkpoolLogo} alt="DARKPOOL" className="h-7 w-7 object-contain shrink-0" />
            <div className="absolute inset-0 blur-xl bg-violet-500/40 rounded-full" />
          </div>
          {!collapsed && (
            <span className="font-mono text-[11px] font-semibold tracking-[0.15em] uppercase text-white/80">
              DARKPOOL
            </span>
          )}
        </div>
      </a>

      <SidebarContent className="pt-4 relative z-10">
        {!collapsed && (
          <div className="px-4 mb-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/25">Navigation</span>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard"}
                        className={`relative gap-3 transition-all duration-300 rounded-xl my-0.5 ${
                          collapsed ? 'mx-0 justify-center' : 'mx-1.5'
                        } ${
                          isActive
                            ? "text-white"
                            : "text-white/40 hover:text-white/70"
                        }`}
                        activeClassName=""
                      >
                        {/* Active glassmorphic background */}
                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-xl pointer-events-none"
                            style={{
                              background: 'rgba(139, 92, 246, 0.12)',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 0 20px rgba(139,92,246,0.15)',
                              backdropFilter: 'blur(8px)',
                            }}
                          />
                        )}
                        {/* Hover glass effect for non-active */}
                        {!isActive && (
                          <div className="absolute inset-0 rounded-xl pointer-events-none opacity-0 hover-parent-glass transition-opacity duration-300" 
                            style={{
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                          />
                        )}
                        <div className={`relative z-10 flex items-center w-full ${collapsed ? 'justify-center' : 'gap-3'}`}>
                          <item.icon className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
                            isActive ? "text-violet-400" : ""
                          }`} />
                          {!collapsed && (
                            <span className="text-[13px] font-light">{item.title}</span>
                          )}
                        </div>
                        {/* Active left accent bar */}
                        {isActive && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full"
                            style={{
                              background: 'linear-gradient(180deg, rgba(139,92,246,0.8), rgba(139,92,246,0.3))',
                              boxShadow: '0 0 8px rgba(139,92,246,0.6)',
                            }}
                          />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom section */}
        {!collapsed && (
          <div className="mt-auto px-4 py-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-emerald-400/70">System Online</span>
            </div>
            <p className="font-mono text-[10px] text-white/15">v0.8.3 · Base Mainnet</p>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
