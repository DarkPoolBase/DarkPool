import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Provider from "./pages/Provider";
import ApiDocs from "./pages/ApiDocs";
import SdkDocs from "./pages/SdkDocs";
import SettingsPage from "./pages/SettingsPage";
import Notifications from "./pages/Notifications";
import { MiniAppProvider } from "./miniapp/MiniAppProvider";
import { MiniAppLayout } from "./miniapp/MiniAppLayout";
import { MiniAppMarketplace } from "./miniapp/MiniAppMarketplace";
import { MiniAppOrders } from "./miniapp/MiniAppOrders";
import { MiniAppOrder } from "./miniapp/MiniAppOrder";
import AgentDashboard from "./pages/AgentDashboard";
import Activity from "./pages/Activity";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:productId" element={<ProductDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/provider" element={<Provider />} />
            <Route path="/api-docs" element={<ApiDocs />} />
            <Route path="/sdk-docs" element={<SdkDocs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/agent-dashboard" element={<AgentDashboard />} />
            <Route path="/activity" element={<Activity />} />
          </Route>

          {/* Farcaster Mini App routes */}
          <Route path="/miniapp" element={<MiniAppProvider><MiniAppLayout /></MiniAppProvider>}>
            <Route index element={<MiniAppMarketplace />} />
            <Route path="order/:gpuType" element={<MiniAppOrder />} />
            <Route path="orders" element={<MiniAppOrders />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </WalletProvider>
  </QueryClientProvider>
);

export default App;
