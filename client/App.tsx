import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Tenants from "./pages/Tenants";
import PayRent from "./pages/PayRent";
import RentSettings from "./pages/RentSettings";
import NotFound from "./pages/NotFound";
import PaymentHistory from "./pages/PaymentHistory";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenants" element={<Tenants />} />
          <Route path="/pay-rent" element={<PayRent />} />
          <Route path="/rent-settings" element={<RentSettings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/notifications" element={<Notifications />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/payments" element={<PaymentHistory />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
