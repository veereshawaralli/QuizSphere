// Main app component - sets up routing and providers

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Quizzes from "./pages/Quizzes";
import CreateQuiz from "./pages/CreateQuiz";
import EditQuiz from "./pages/EditQuiz";
import AttemptQuiz from "./pages/AttemptQuiz";
import Results from "./pages/Results";
import Materials from "./pages/Materials";
import AdminPanel from "./pages/AdminPanel";
import VerifyCertificate from "./pages/VerifyCertificate";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import EmailVerified from "./pages/EmailVerified";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/quizzes/create" element={<CreateQuiz />} />
              <Route path="/quizzes/:quizId/edit" element={<EditQuiz />} />
              <Route path="/quizzes/:quizId/attempt" element={<AttemptQuiz />} />
              <Route path="/results" element={<Results />} />
              <Route path="/materials" element={<Materials />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

