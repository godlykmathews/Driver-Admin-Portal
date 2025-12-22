import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Truck, LogOut, Loader2, Search, Filter, X, ArrowUpDown } from "lucide-react";
import { apiService, Invoice } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import TablePagination from "@/components/TablePagination";

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

const InvoiceList = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "acknowledged">("all");
  const [dateFilter, setDateFilter] = useState("today"); // Default to today
  const [routeFilter, setRouteFilter] = useState<number | "all">("all");
  const [routeDateFilter, setRouteDateFilter] = useState<string>("");
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "amount" | "shop">("recent");
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10
  });
  const driverName = localStorage.getItem('user_name');

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchInvoices();
  }, [navigate]);

  // Re-fetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInvoices(1);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, statusFilter, dateFilter, routeFilter, routeDateFilter]);

  // Function to get date ranges based on filter selection (for created_at filtering)
  const getDateRangeForFilter = (filter: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (filter) {
      case "today":
        return { fromDate: todayStr, toDate: todayStr };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return { fromDate: weekAgo.toISOString().split('T')[0], toDate: todayStr };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return { fromDate: monthAgo.toISOString().split('T')[0], toDate: todayStr };
      default:
        return { fromDate: "", toDate: "" };
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery("");
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const handleRefresh = () => {
    fetchInvoices(1);
  };

  const handlePageChange = (page: number) => {
    fetchInvoices(page);
  };

  // Fetch available routes for the current driver
  const fetchAvailableRoutes = async () => {
    try {
      console.log('Fetching routes for driver...');
      const response = await apiService.getRoutes(); // This will get driver's routes since it's driver role
      console.log('Driver routes response:', response);
      setAvailableRoutes(response.routes || []);
    } catch (error) {
      console.error('Failed to fetch routes:', error);
      setAvailableRoutes([]);
    }
  };

  // Fetch routes when component mounts
  useEffect(() => {
    fetchAvailableRoutes();
  }, []);

  const fetchInvoices = async (page: number = 1) => {
    try {
      setLoading(true);
      const role = localStorage.getItem('user_role');
      
      const filters: any = {
        page,
        per_page: 10
      };

      // Add search filter
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      // Add status filter
      if (statusFilter !== "all") {
        filters.status_filter = statusFilter;
      }

      // Add date filters (use created_at for system entry filtering)
      const dateRange = getDateRangeForFilter(dateFilter);
      if (dateRange.fromDate) {
        filters.from_date = dateRange.fromDate;
        console.log('Date filter applied - from_date:', dateRange.fromDate);
      }
      if (dateRange.toDate) {
        filters.to_date = dateRange.toDate;
        console.log('Date filter applied - to_date:', dateRange.toDate);
      }

      // Add route filters
      if (routeFilter !== "all") {
        // Find the selected route from availableRoutes to get proper filtering
        const selectedRoute = availableRoutes.find(r => r.route_number === routeFilter);
        console.log('Route filter selected:', routeFilter, 'Found route:', selectedRoute);
        if (selectedRoute) {
          filters.route_number = selectedRoute.route_number;
          if (selectedRoute.created_date) {
            filters.route_date = selectedRoute.created_date;
          }
          console.log('Route filters added:', { route_number: filters.route_number, route_date: filters.route_date });
        } else {
          filters.route_number = routeFilter;
        }
      }

      if (routeDateFilter) {
        filters.route_date = routeDateFilter;
        console.log('Manual route date filter:', routeDateFilter);
      }

      let response;
      console.log('Fetching invoices with filters:', filters);
      if (role === 'driver') {
        response = await apiService.getDriverInvoices(filters);
      } else {
        // admin or super_admin
        response = await apiService.getInvoicesAdmin(filters);
      }
      console.log('Invoice response:', response);

      // Handle pagination data
      if (response.pagination) {
        setPagination({
          current_page: response.pagination.current_page,
          total_pages: response.pagination.total_pages,
          total_count: response.pagination.total_count,
          per_page: response.pagination.per_page
        });
      } else if (response.total !== undefined) {
        // Driver response format
        setPagination({
          current_page: response.page || 1,
          total_pages: response.total_pages || 1,
          total_count: response.total || 0,
          per_page: response.per_page || 20
        });
      } else {
        // Fallback
        setPagination({
          current_page: 1,
          total_pages: 1,
          total_count: (response.invoices || []).length,
          per_page: 20
        });
      }

      setInvoices(response.invoices || []);
    } catch (error) {
      // log to console for easier debugging in dev
      // eslint-disable-next-line no-console
      console.error('Failed to fetch invoices', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  // Sort invoices by customer and date
  const sortedInvoices = useMemo(() => {
    const sorted = [...invoices];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "shop":
          const shopA = a.shop_name || a.customer_name || '';
          const shopB = b.shop_name || b.customer_name || '';
          return shopA.localeCompare(shopB);
        case "recent":
        default:
          // First sort by customer name
          const customerA = a.customer_name || a.shop_name || '';
          const customerB = b.customer_name || b.shop_name || '';
          if (customerA !== customerB) {
            return customerA.localeCompare(customerB);
          }
          // Then sort by route number
          if (a.route_number !== b.route_number) {
            return (a.route_number || 0) - (b.route_number || 0);
          }
          // Finally sort by delivery date
          if (a.delivery_date && b.delivery_date) {
            return new Date(b.delivery_date).getTime() - new Date(a.delivery_date).getTime();
          }
          return 0;
      }
    });
    return sorted;
  }, [invoices, sortBy]);

  // Get counts for each status
  const statusCounts = useMemo(() => {
    const pending = invoices.filter(inv => !inv.is_acknowledged).length;
    const delivered = invoices.filter(inv => inv.is_acknowledged).length;
    return {
      all: pagination.total_count,
      pending,
      delivered
    };
  }, [invoices, pagination.total_count]);

  const handleLogout = () => {
    apiService.logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
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
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Dlive</h1>
              {driverName && <p className="text-sm text-muted-foreground">Welcome, {driverName}</p>}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Assigned Deliveries</h2>
            {!loading && (
              <p className="text-sm text-muted-foreground mt-1">
                {`${statusCounts.pending} pending • ${statusCounts.delivered} acknowledged`}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search invoices... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex gap-2">
              <Button 
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                All ({statusCounts.all})
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending ({statusCounts.pending})
              </Button>
              <Button
                variant={statusFilter === "acknowledged" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("acknowledged")}
              >
                Delivered ({statusCounts.delivered})
              </Button>
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const sortOptions = ["recent", "amount", "shop"] as const;
                  const currentIndex = sortOptions.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % sortOptions.length;
                  setSortBy(sortOptions[nextIndex]);
                }}
                className="flex items-center gap-2 min-w-[120px]"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortBy === "recent" && "Grouped"}
                {sortBy === "amount" && "Amount"}
                {sortBy === "shop" && "Shop A-Z"}
              </Button>
            </div>
          </div>

          {/* Route Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Route Filter */}
            <Select value={routeFilter.toString()} onValueChange={(value) => setRouteFilter(value === "all" ? "all" : parseInt(value))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Routes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Routes</SelectItem>
                {availableRoutes.length > 0 ? (
                  availableRoutes.map(route => (
                    <SelectItem key={`${route.route_number}-${route.created_date}`} value={route.route_number.toString()}>
                      {route.route_display}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-routes" disabled>
                    No routes found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Route Date Filter */}
            <Input
              type="date"
              value={routeDateFilter}
              onChange={(e) => setRouteDateFilter(e.target.value)}
              className="w-[140px]"
              placeholder="Filter by route date"
            />

            {/* Clear Route Filters */}
            {(routeFilter !== "all" || routeDateFilter) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRouteFilter("all");
                  setRouteDateFilter("");
                }}
                className="px-3 py-2 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear Routes
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedInvoices.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              {searchQuery || statusFilter !== "all" ? (
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-2">No invoices match your filters</p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDateFilter("today");
                      setRouteFilter("all");
                      setRouteDateFilter("");
                      setSortBy("recent");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <p className="text-lg text-muted-foreground">No invoices assigned</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            {(searchQuery || statusFilter !== "all" || dateFilter !== "today" || routeFilter !== "all" || routeDateFilter || sortBy !== "recent") && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <p>
                  {(() => {
                    const start = (pagination.current_page - 1) * pagination.per_page + 1;
                    const end = Math.min(pagination.current_page * pagination.per_page, pagination.total_count);
                    return `${start}-${end}`;
                  })()} of {pagination.total_count}
                  {searchQuery && ` matching "${searchQuery}"`}
                </p>
                {(searchQuery || statusFilter !== "all" || dateFilter !== "today" || routeFilter !== "all" || routeDateFilter || sortBy !== "recent") && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDateFilter("today");
                      setRouteFilter("all");
                      setRouteDateFilter("");
                      setSortBy("recent");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Shop/Customer</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          {searchQuery || statusFilter !== "all" || dateFilter !== "today" || routeFilter !== "all" || routeDateFilter ? "No invoices match your filters" : "No invoices assigned"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedInvoices.map((invoice, index) => {
                        // Check if this is the first invoice of a group or a standalone invoice
                        const isGroupStart = index === 0 || 
                          (invoice.customer_name || invoice.shop_name) !== (sortedInvoices[index - 1].customer_name || sortedInvoices[index - 1].shop_name) ||
                          invoice.route_number !== sortedInvoices[index - 1].route_number;

                        // Get all invoices in this group if this is the start of a group
                        const groupInvoices = (() => {
                          if (!isGroupStart) return [];
                          const customerName = invoice.customer_name || invoice.shop_name;
                          const routeNumber = invoice.route_number;
                          return sortedInvoices.filter((inv, i) => 
                            i >= index && 
                            (inv.customer_name || inv.shop_name) === customerName && 
                            inv.route_number === routeNumber
                          );
                        })();

                        const elements = [];
                        
                        // Add group header if this is the start of a group with multiple invoices
                        if (isGroupStart && groupInvoices.length > 1) {
                          elements.push(
                            <TableRow key={`group-${invoice.id}`} className="bg-muted/20">
                              <TableCell colSpan={9} className="py-1 px-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-muted-foreground">
                                    Group: {highlightText(invoice.customer_name || invoice.shop_name || 'N/A', searchQuery)} ({groupInvoices.length} invoices)
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/customer-visits/${encodeURIComponent(invoice.customer_name || invoice.shop_name || '')}/${invoice.route_number}/${invoice.delivery_date?.split('T')[0]}`);
                                      }}
                                    >
                                      Collect Group Signature
                                    </Button>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        }

                        // Add the invoice row
                        elements.push(
                          <TableRow 
                            key={invoice.id}
                            className={`cursor-pointer hover:bg-muted/50 ${
                              isGroupStart && groupInvoices.length === 1 ? 'border-t-2 border-primary' : ''
                            }`}
                            onClick={() => navigate(`/invoices/${invoice.id}`)}
                          >
                            <TableCell className="font-medium">
                              {highlightText(invoice.shop_name || invoice.customer_name || 'N/A', searchQuery)}
                            </TableCell>
                            <TableCell>
                              {highlightText(invoice.invoice_id || invoice.invoice_number || 'N/A', searchQuery)}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {invoice.shop_address ? highlightText(invoice.shop_address, searchQuery) : 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              ₹{invoice.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {invoice.route_display ? (
                                <Badge variant="secondary" className="text-xs">
                                  {invoice.route_display}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">No route</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {invoice.branch_name || invoice.branch}
                            </TableCell>
                            <TableCell>
                              <Badge variant={invoice.is_acknowledged ? "success" : "warning"}>
                                {invoice.is_acknowledged ? "Acknowledged" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.invoice_date)}
                            </TableCell>
                            <TableCell>
                              {formatDate(invoice.delivery_date)}
                            </TableCell>
                          </TableRow>
                        );

                        return elements;
                      }).flat()
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.total_count > 0 && (
          <div className="mt-8">
            <TablePagination 
              pagination={pagination}
              onPageChange={handlePageChange}
              showInfo={true}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default InvoiceList;