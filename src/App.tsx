import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import InvoiceList from "./pages/InvoiceList";
import InvoiceListGrouped from "./pages/InvoiceListGrouped";
import InvoiceDetail from "./pages/InvoiceDetail";
import SignatureCapture from "./pages/SignatureCapture";
import CustomerVisitDetail from "./pages/CustomerVisitDetail";
import CustomerVisitSignature from "./pages/CustomerVisitSignature";
import CustomerGroupDetail from "./pages/CustomerGroupDetail";
import CustomerGroupSignature from "./pages/CustomerGroupSignature";
import Confirmation from "./pages/Confirmation";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import LiveMap from "./pages/LiveMap";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        {/* New grouped invoice routes (primary for drivers) */}
        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <InvoiceListGrouped />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-group/:groupId"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <CustomerGroupDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-group/:groupId/signature"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <CustomerGroupSignature />
            </ProtectedRoute>
          }
        />
        {/* Legacy individual invoice routes (still available) */}
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <InvoiceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/signature/:id"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <SignatureCapture />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-visits/:customerName/:routeNumber/:routeDate"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <CustomerVisitDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-visits/:customerName/:routeNumber/:routeDate/signature"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <CustomerVisitSignature />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirmation/:id"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <Confirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/live-map"
          element={
            <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
              <LiveMap />
            </ProtectedRoute>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
