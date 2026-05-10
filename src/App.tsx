import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import AdminForms from "./pages/admin/AdminForms.tsx";
import FormBuilder from "./pages/admin/FormBuilder.tsx";
import EmployeeForms from "./pages/employee/EmployeeForms.tsx";
import FillForm from "./pages/employee/FillForm.tsx";
import History from "./pages/employee/History.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";

import FormResults from "./pages/admin/FormResults.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/admin/forms" element={<ProtectedRoute role="admin"><AdminForms /></ProtectedRoute>} />
            <Route path="/admin/forms/:id" element={<ProtectedRoute role="admin"><FormBuilder /></ProtectedRoute>} />
            <Route path="/admin/forms/:id/results" element={<ProtectedRoute role="admin"><FormResults /></ProtectedRoute>} />
            <Route path="/forms" element={<ProtectedRoute role="sw_employee"><EmployeeForms /></ProtectedRoute>} />
            <Route path="/forms/:id" element={<ProtectedRoute role="sw_employee"><FillForm /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute role="sw_employee"><History /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
