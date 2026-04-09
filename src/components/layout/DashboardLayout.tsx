import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { WebGLBackground } from "@/components/ui/webgl-background";
import { WalletGate } from "@/components/WalletGate";
import { Github } from "lucide-react";
import { useNotificationListener } from "@/hooks/useNotifications";

export function DashboardLayout() {
  const location = useLocation();
  useNotificationListener();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden bg-[#030305]">
        <WebGLBackground />

        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <DashboardHeader />
          <WalletGate>
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 30,
                    mass: 0.8,
                  }}
                  style={{ willChange: "transform, opacity" }}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
          </WalletGate>
          <footer className="border-t border-white/[0.06] px-6 py-3 flex items-center justify-between text-xs text-white/40">
            <span>© {new Date().getFullYear()} DarkPool</span>
            <a
              href="https://github.com/DarkPoolBase/DarkPool"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white/70 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}

