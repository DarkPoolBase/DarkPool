import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Outlet, useLocation } from "react-router-dom";
import { GlowBlob } from "@/components/ui/glow-blob";
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
      <div className="min-h-screen flex w-full relative overflow-hidden">
        {/* Mouse-follow flashlight */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background: "radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(108,60,233,0.04), transparent 40%)",
          }}
        />

        {/* Ambient glow blobs */}
        <GlowBlob className="top-20 left-1/4 opacity-50" color="purple" size="lg" />
        <GlowBlob className="bottom-40 right-1/4 opacity-30" color="blue" size="md" />

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
