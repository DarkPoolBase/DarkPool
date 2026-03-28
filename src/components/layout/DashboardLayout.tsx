import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function DashboardLayout() {
  const location = useLocation();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
    document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden bg-[#030305]">
        {/* Mouse-follow flashlight */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(139,92,246,0.03), transparent 40%)",
          }}
        />

        {/* Fixed ambient auras */}
        <div className="fixed top-20 left-1/4 w-[600px] h-[600px] bg-violet-500/[0.04] blur-[150px] rounded-full pointer-events-none" />
        <div className="fixed bottom-40 right-1/4 w-[400px] h-[400px] bg-fuchsia-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
