import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, Loader2, Info } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
// Removed development helpers; Login now uses real API only

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.login(credentials);

      // Store user data in localStorage
      localStorage.setItem("user_name", response.user.name);
      localStorage.setItem("user_role", response.user.role);
      localStorage.setItem(
        "user_branches",
        JSON.stringify(response.user.branches),
      );
      localStorage.setItem("user_id", response.user.id);
      localStorage.setItem("user_email", response.user.email);
      localStorage.setItem("is_active", response.user.is_active.toString());

      toast.success("Login successful!");

      // Route based on role
      if (response.user.role === "driver") {
        navigate("/invoices");
      } else if (
        response.user.role === "admin" ||
        response.user.role === "super_admin"
      ) {
        navigate("/admin");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  // No dev quick-login helper; production-only login

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-32 h-32 flex items-center justify-center border-2 border-white">
            <img src="/logo.png" alt="Dlive Logo" />
          </div>
          <div>
            <CardDescription className="text-base mt-2 font-medium">
              Delivery Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Production login form only. Quick-login dev UI removed. */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                disabled={loading}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                disabled={loading}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
