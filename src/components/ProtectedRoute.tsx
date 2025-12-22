import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/lib/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('driver' | 'admin' | 'super_admin')[];
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  allowedRoles = ['driver', 'admin', 'super_admin'],
  redirectTo = '/login'
}: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = apiService.getToken();
    const userRole = localStorage.getItem('user_role') as 'driver' | 'admin' | 'super_admin' | null;

    if (!token) {
      navigate(redirectTo);
      return;
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect based on role
      if (userRole === 'driver') {
        navigate('/invoices');
      } else if (userRole === 'admin' || userRole === 'super_admin') {
        navigate('/admin');
      } else {
        navigate(redirectTo);
      }
      return;
    }
  }, [navigate, allowedRoles, redirectTo]);

  return <>{children}</>;
};

export default ProtectedRoute;