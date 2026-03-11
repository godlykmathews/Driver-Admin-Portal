import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Truck,
  LogOut,
  Loader2,
  Search,
  Filter,
  X,
  Package,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { apiService, CustomerGroupInfo } from "@/lib/api";
import { toast } from "sonner";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const InvoiceListGrouped = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<CustomerGroupInfo[]>([]);
  const [routes, setRoutes] = useState<
    Array<{
      route_number: number;
      route_name?: string | null;
      route_display?: string | null;
      created_date?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "delivered"
  >("all");
  const [routeFilter, setRouteFilter] = useState<string>("all");
  // When a route is selected the API now expects the created_date for that route
  // so we store the selected route's created_date here and pass it to the invoices API.
  const [selectedRouteDate, setSelectedRouteDate] = useState<string | null>(
    null
  );
  const [totalGroups, setTotalGroups] = useState(0);
  const [pendingGroups, setPendingGroups] = useState(0);
  const [deliveredGroups, setDeliveredGroups] = useState(0);
  const driverName = localStorage.getItem("user_name");

  // Offline sync hook
  const { isOnline, pendingCount, getCachedGroups, saveGroupsCache } =
    useOfflineSync();

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchRoutes();
    fetchGroupedInvoices();
  }, [navigate]);

  const fetchRoutes = async () => {
    try {
      // First try to get routes for today
      let response = await apiService.getDriverRoutes(getTodayDate());

      // If no routes found for today, try to get all routes
      if (!response.routes || response.routes.length === 0) {
        console.log("No routes found for today, trying to get all routes...");
        response = await apiService.getDriverRoutes(); // No date filter
      }

      setRoutes(response.routes || []);
    } catch (error) {
      console.error("Failed to fetch routes", error);
      setRoutes([]);
    }
  };

  // Re-fetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchGroupedInvoices();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, routeFilter, selectedRouteDate]);

  const fetchGroupedInvoices = async () => {
    try {
      setLoading(true);

      // Check cache first (valid for 24 hours)
      const cached = await getCachedGroups();
      if (cached && !isOnline) {
        setGroups(cached.groups);
        setTotalGroups(cached.total_groups);
        setPendingGroups(cached.pending_groups);
        setDeliveredGroups(cached.delivered_groups);
        setLoading(false);
        return;
      }

      // Use the selected route's created_date when available, otherwise default to today
      const filters: any = {
        created_date: selectedRouteDate ?? getTodayDate(),
      };

      // Add search filter
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      // Add status filter
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      // Add route filter
      if (routeFilter !== "all") {
        const rn = parseInt(routeFilter);
        if (!Number.isNaN(rn)) filters.route_number = rn;
      }

      let response = await apiService.getGroupedInvoices(filters);

      // If no invoices found for today, do NOT fall back to previous dates.
      // We want to show the "No deliveries assigned" message for today instead
      // of loading earlier invoices. Keep the response as-is (empty) so the
      // UI displays the appropriate "no deliveries assigned" view.
      if (response.total_groups === 0) {
        console.log(
          "No invoices found for today; showing no deliveries assigned for today."
        );
      }

      setGroups(response.groups);
      setTotalGroups(response.total_groups);
      setPendingGroups(response.pending_groups);
      setDeliveredGroups(response.delivered_groups);

      // Cache the response if online
      if (isOnline) {
        await saveGroupsCache(response);
      }
    } catch (error) {
      console.error("Failed to fetch grouped invoices", error);
      // If offline and no cache, show message
      if (!isOnline) {
        toast.error("Offline - No cached data available");
      } else {
        toast.error("Failed to load invoices");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleGroupClick = (group: CustomerGroupInfo) => {
    navigate(
      `/customer-group/${encodeURIComponent(group.customer_visit_group)}`
    );
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 sm:w-10 sm:h-10 flex items-center justify-center border border-primary-foreground/20 flex-shrink-0">
                <img src="/logo.png" alt="" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-bold font-serif truncate">
                  Dlive Driver Portal
                </h1>
                {driverName && (
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    Welcome, {driverName}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isOnline ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isOnline ? "Online" : "Offline"}
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-xs text-orange-600 font-medium">
                      ({pendingCount} pending sync)
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-medium self-start sm:self-auto"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              Customer Deliveries
            </h2>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-1 sm:mt-2 font-medium">
                {pendingGroups} pending • {deliveredGroups} completed •{" "}
                {totalGroups} total deliveries
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={fetchGroupedInvoices}
            className="font-medium px-4 sm:px-6 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-6 bg-card p-4 sm:p-6 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-semibold font-serif">
              Search & Filters
            </h3>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Search by customer name or invoice number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base border-2"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            )}
          </div>

          {/* Status and Route Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Status Filter */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Delivery Status
              </Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="font-medium px-3 sm:px-4 py-2 h-auto text-xs sm:text-sm flex-1 min-w-0"
                >
                  All ({totalGroups})
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className="font-medium px-3 sm:px-4 py-2 h-auto text-xs sm:text-sm flex-1 min-w-0"
                >
                  Pending ({pendingGroups})
                </Button>
                <Button
                  variant={statusFilter === "delivered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("delivered")}
                  className="font-medium px-3 sm:px-4 py-2 h-auto text-xs sm:text-sm flex-1 min-w-0"
                >
                  Completed ({deliveredGroups})
                </Button>
              </div>
            </div>

            {/* Route Filter */}
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-semibold text-foreground">
                Route Filter
              </Label>
              <Select
                value={routeFilter}
                onValueChange={(value) => {
                  setRouteFilter(value);
                  if (value === "all") {
                    setSelectedRouteDate(null);
                  } else {
                    const rn = parseInt(value);
                    const selected = routes.find((r) => r.route_number === rn);
                    setSelectedRouteDate(selected?.created_date ?? null);
                  }
                }}
              >
                <SelectTrigger className="h-10 sm:h-12 border-2 text-sm">
                  <SelectValue placeholder="All Routes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem
                      key={`${route.route_number}-${route.created_date ?? ""}`}
                      value={route.route_number.toString()}
                    >
                      {route.route_display ||
                        route.route_name ||
                        `Route ${route.route_number}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2 sm:space-y-3 sm:col-span-2 lg:col-span-1">
              <Label className="text-sm font-semibold text-foreground">
                Actions
              </Label>
              <div className="flex gap-2">
                {(searchQuery ||
                  statusFilter !== "all" ||
                  routeFilter !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setRouteFilter("all");
                    }}
                    className="font-medium px-4 sm:px-6 py-2 sm:py-3 h-10 sm:h-12 border-2 flex-1 text-sm"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : groups.length === 0 ? (
          <Card className="border-2 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              {searchQuery ||
              statusFilter !== "all" ||
              routeFilter !== "all" ? (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Search className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold font-serif text-foreground mb-1 sm:mb-2">
                      No customers match your filters
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium px-4">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="default"
                    className="font-medium px-4 sm:px-6 border-2"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setRouteFilter("all");
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold font-serif text-foreground mb-1 sm:mb-2">
                      No deliveries assigned
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium px-4">
                      You don't have any deliveries scheduled for today
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3">
              {groups.map((group) => (
                <Card
                  key={group.customer_visit_group}
                  className="border-2 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleGroupClick(group)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-foreground truncate">
                            {highlightText(group.customer_name, searchQuery)}
                          </h3>
                          {group.branch && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {group.branch}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            group.status === "delivered"
                              ? "default"
                              : "secondary"
                          }
                          className={`font-medium text-xs ${
                            group.status === "delivered"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-orange-100 text-orange-800 border-orange-200"
                          }`}
                        >
                          {group.status === "delivered"
                            ? "Completed"
                            : "Pending"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {group.invoice_count}{" "}
                            {group.invoice_count === 1 ? "invoice" : "invoices"}
                          </span>
                        </div>
                        {group.route_display && (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border-2"
                          >
                            {group.route_display}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <Card className="border-2 shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2">
                        <TableHead className="font-bold text-foreground text-sm py-4">
                          Customer Name
                        </TableHead>
                        <TableHead className="font-bold text-foreground text-sm py-4">
                          Invoices
                        </TableHead>
                        <TableHead className="font-bold text-foreground text-sm py-4">
                          Route
                        </TableHead>
                        <TableHead className="font-bold text-foreground text-sm py-4">
                          Branch
                        </TableHead>
                        <TableHead className="font-bold text-foreground text-sm py-4">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groups.map((group) => (
                        <TableRow
                          key={group.customer_visit_group}
                          className="cursor-pointer hover:bg-muted/30 border-b transition-colors"
                          onClick={() => handleGroupClick(group)}
                        >
                          <TableCell className="font-medium py-4">
                            {highlightText(group.customer_name, searchQuery)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <Badge
                                variant="secondary"
                                className="font-medium"
                              >
                                {group.invoice_count}{" "}
                                {group.invoice_count === 1
                                  ? "invoice"
                                  : "invoices"}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {group.route_display ? (
                              <Badge
                                variant="outline"
                                className="text-xs font-medium border-2"
                              >
                                {group.route_display}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm font-medium">
                                No route
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 font-medium">
                            {group.branch || "N/A"}
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant={
                                group.status === "delivered"
                                  ? "default"
                                  : "secondary"
                              }
                              className={`font-medium ${
                                group.status === "delivered"
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-orange-100 text-orange-800 border-orange-200"
                              }`}
                            >
                              {group.status === "delivered"
                                ? "Completed"
                                : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default InvoiceListGrouped;
