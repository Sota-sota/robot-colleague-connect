import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/UploadPage";
import ResultsPage from "./pages/ResultsPage";
import NetworkPage from "./pages/NetworkPage";
import RobotProfilePage from "./pages/RobotProfilePage";
import DataFormatterPage from "./pages/DataFormatterPage";
import MarketplacePage from "./pages/MarketplacePage";
import AIAgentPage from "./pages/AIAgentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/profile/:id" element={<RobotProfilePage />} />
          <Route path="/formatter" element={<DataFormatterPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="/agent" element={<AIAgentPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
