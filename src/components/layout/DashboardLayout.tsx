import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { WebGLBackground } from "@/components/ui/webgl-background";

export function DashboardLayout() {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden bg-[#030305]">
        <WebGLBackground />

        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
