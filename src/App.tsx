import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicRoute } from "@/components/auth/PublicRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { VoiceNavigation } from "@/components/layout/VoiceNavigation";

// Public pages
import Home from "./pages/Home";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Attendance from "./pages/Attendance";
import Complaints from "./pages/Complaints";
import Passes from "./pages/Passes";
import Notices from "./pages/Notices";
import Students from "./pages/Students";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

import { ThemeProvider } from "@/components/theme-provider";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class" enableSystem={false}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* ═══════════════ PUBLIC ROUTES ═══════════════ */}
            <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
            <Route path="/student/login" element={<PublicRoute><StudentLogin /></PublicRoute>} />
            <Route path="/student/register" element={<PublicRoute><StudentRegister /></PublicRoute>} />
            <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
            <Route path="/admin/register" element={<PublicRoute><AdminRegister /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Home /></PublicRoute>} />

            {/* ═══════════════ STUDENT ROUTES ═══════════════ */}
            <Route
              element={
                <ProtectedRoute requiredRole="student">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/passes" element={<Passes />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* ═══════════════ ADMIN ROUTES ═══════════════ */}
            <Route
              element={
                <ProtectedRoute requiredRole="admin">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/menu" element={<Menu />} />
              <Route path="/admin/attendance" element={<Attendance />} />
              <Route path="/admin/complaints" element={<Complaints />} />
              <Route path="/admin/passes" element={<Passes />} />
              <Route path="/admin/notices" element={<Notices />} />
              <Route path="/admin/students" element={<Students />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <VoiceNavigation />
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
