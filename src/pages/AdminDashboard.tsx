import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Upload,
  Users,
  FileSpreadsheet,
  UserPlus,
  Truck,
  LogOut,
  Settings,
  Eye,
  Trash2,
  MoreVertical,
  Download,
  AlertCircle,
  Check,
  ChevronsUpDown,
  X,
  Search,
  Filter,
  Printer,
  Building,
  FileText,
  Calendar,
  RefreshCw,
  MapPin,
} from "lucide-react";
import { apiService, Invoice } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import TablePagination from "@/components/TablePagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Driver {
  id: string;
  username: string;
  driver_name: string;
  branches: string[];
  role: "driver";
  isTemporary?: boolean;
  temp_password?: string;
  created_at?: string;
  last_login?: string;
}

interface Admin {
  id: string;
  name: string;
  branch: string;
  role: "admin";
  created_at: string;
  last_login?: string | null;
  is_active: boolean;
  email?: string;
}

interface Branch {
  id: string;
  name: string;
  city: string;
  phone: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

interface CSVUploadData {
  file: File | null;
  selectedDriver: string;
  assignedDrivers: string[];
  isDragOver: boolean;
  routeName?: string;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  per_page: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState<CSVUploadData>({
    file: null,
    selectedDriver: "",
    assignedDrivers: [],
    isDragOver: false,
    routeName: "",
  });
  const [driverAssignmentOpen, setDriverAssignmentOpen] = useState(false);
  const [newDriver, setNewDriver] = useState({
    driver_name: "",
    email: "",
    password: "",
    selectedBranches: [] as string[], // branch IDs
    isTemporary: false,
  });
  const [newTempDriver, setNewTempDriver] = useState({
    selectedBranches: [] as string[], // branch IDs
  });
  const [tempDriverCredentials, setTempDriverCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [isCreatingTempDriver, setIsCreatingTempDriver] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    branch_id: "",
  });
  const [newBranch, setNewBranch] = useState({
    name: "",
    city: "",
    phone: "",
    email: "",
  });
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [editAdminData, setEditAdminData] = useState({
    id: "",
    name: "",
    email: "",
    branch_id: "",
  });
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showViewAdminModal, setShowViewAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [editDriverData, setEditDriverData] = useState({
    id: "",
    driver_name: "",
    email: "",
    selectedBranches: [] as string[],
  });
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [showViewDriverModal, setShowViewDriverModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<
    string | null
  >(null);

  // Modal states
  const [createDriverModalOpen, setCreateDriverModalOpen] = useState(false);
  const [tempDriverModalOpen, setTempDriverModalOpen] = useState(false);
  const [tempDriverBranchDropdownOpen, setTempDriverBranchDropdownOpen] =
    useState(false);
  const [editDriverBranchDropdownOpen, setEditDriverBranchDropdownOpen] =
    useState(false);

  // Invoice Management States
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState("today");
  const [invoiceDriverFilter, setInvoiceDriverFilter] = useState("all");
  const [invoiceBranchFilter, setInvoiceBranchFilter] = useState("all");
  const [invoiceRouteFilter, setInvoiceRouteFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Route Management States
  const [availableRoutes, setAvailableRoutes] = useState<any[]>([]);

  // Pagination states
  const [adminPagination, setAdminPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
  });
  const [superAdminPagination, setSuperAdminPagination] =
    useState<PaginationInfo>({
      current_page: 1,
      total_pages: 1,
      total_count: 0,
      per_page: 20,
    });
  const [driversPagination, setDriversPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 10,
  });

  const userRole = localStorage.getItem("user_role") as string | null;
  const userBranches = JSON.parse(
    localStorage.getItem("user_branches") || "[]",
  );
  const userName = localStorage.getItem("driver_name");
  const availableBranches = branches.filter((b) => b.is_active);
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin";

  // Initialize branch filter based on user role
  useEffect(() => {
    if (isSuperAdmin) {
      setInvoiceBranchFilter(""); // Require branch selection for super admin
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const token = apiService.getToken();
    const role = localStorage.getItem("user_role");

    if (!token || (role !== "admin" && role !== "super_admin")) {
      navigate("/login");
      return;
    }

    fetchDrivers();
    fetchBranches();
    fetchInvoicesData();
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [navigate]);

  // Fetch routes when driver or branch filter changes
  useEffect(() => {
    if (
      invoiceDriverFilter !== "all" ||
      (isSuperAdmin && invoiceBranchFilter)
    ) {
      console.log("Driver filter changed:", invoiceDriverFilter);
      fetchAvailableRoutes(
        invoiceDriverFilter !== "all" ? invoiceDriverFilter : undefined,
        isSuperAdmin && invoiceBranchFilter ? invoiceBranchFilter : undefined,
      );
    } else {
      console.log("Clearing routes - no driver selected");
      setAvailableRoutes([]);
      setInvoiceRouteFilter("all");
    }
  }, [invoiceDriverFilter, invoiceBranchFilter, isSuperAdmin, drivers]); // Added drivers to dependency array

  // Fetch invoices when any filter changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Filter changed, fetching invoices...");
      fetchInvoicesData(1);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    invoiceSearchQuery,
    invoiceStatusFilter,
    invoiceDateFilter,
    invoiceDriverFilter,
    invoiceRouteFilter,
    invoiceBranchFilter,
  ]);

  const fetchDrivers = async () => {
    try {
      const res = await apiService.getDrivers();
      // Map API response to Driver interface when possible
      const allDrivers: Driver[] = (res || []).map((d: any) => ({
        id: String(d.id),
        username: d.username || d.email || String(d.id),
        driver_name: d.name || d.driver_name || "",
        branches: d.branches || [],
        role: "driver",
        isTemporary: !!d.isTemporary,
        temp_password: d.temp_password,
        created_at: d.created_at,
        last_login: d.last_login,
      }));

      let filteredDrivers = allDrivers;
      if (userRole === "admin") {
        filteredDrivers = allDrivers.filter((driver) =>
          driver.branches.some((branch) => userBranches.includes(branch)),
        );
      }

      setDrivers(filteredDrivers);

      // Update driver pagination
      setDriversPagination({
        current_page: 1,
        total_pages: Math.ceil(filteredDrivers.length / 10),
        total_count: filteredDrivers.length,
        per_page: 10,
      });
    } catch (error) {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const handleDriverPageChange = (page: number) => {
    setDriversPagination((prev) => ({
      ...prev,
      current_page: page,
    }));
  };

  const getPaginatedDrivers = () => {
    const startIndex =
      (driversPagination.current_page - 1) * driversPagination.per_page;
    const endIndex = startIndex + driversPagination.per_page;
    return drivers.slice(startIndex, endIndex);
  };

  const fetchBranches = async () => {
    try {
      const res = await apiService.getBranches();
      // console.log('Raw branches response:', res);
      const mapped = (res || []).map((b: any) => ({
        id: String(b.id),
        name: b.name,
        // Use city field from API, fallback to address for compatibility
        city: b.city,
        phone: b.phone,
        email: b.email,
        created_at: b.created_at,
        is_active: !!b.is_active,
      }));
      // console.log('Mapped branches:', mapped);
      setBranches(mapped);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      toast.error("Failed to load branches");
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await apiService.getAdmins();
      const mapped = (res || []).map((a: any) => ({
        id: String(a.id),
        name: a.name || "",
        branch: a.branch || "",
        role: "admin" as const,
        created_at: a.created_at,
        last_login: a.last_login,
        is_active: !!a.is_active,
        email: a.email,
      }));
      setAdmins(mapped);
    } catch (error) {
      toast.error("Failed to load admins");
    }
  };

  const handleLogout = () => {
    apiService.logout();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvData((prev) => ({ ...prev, file }));
      toast.success("CSV file uploaded successfully");
    } else {
      toast.error("Please upload a valid CSV file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setCsvData((prev) => ({ ...prev, isDragOver: true }));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setCsvData((prev) => ({ ...prev, isDragOver: false }));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCsvData((prev) => ({ ...prev, isDragOver: false }));

    const files = e.dataTransfer.files;
    const file = files[0];

    if (file && file.type === "text/csv") {
      setCsvData((prev) => ({ ...prev, file }));
      toast.success("CSV file uploaded successfully");
    } else {
      toast.error("Please upload a valid CSV file");
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = `invoice_id,shop_name,shop_address,amount,delivery_date,branch_name
INV-2024-001,Sample Shop,123 Main Street,1250.75,2024-10-15,Main Branch
INV-2024-002,Another Store,456 Business Ave,890.50,2024-10-16,North Branch`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invoice_template.csv";
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV template downloaded");
  };

  const handleAssignInvoices = async () => {
    if (!csvData.file || csvData.assignedDrivers.length === 0) {
      toast.error("Please upload a CSV file and select drivers");
      return;
    }

    try {
      // Upload CSV for each selected driver
      const uploadPromises = csvData.assignedDrivers.map((driverId) =>
        apiService.uploadCSV(driverId, csvData.file!, csvData.routeName),
      );

      await Promise.all(uploadPromises);

      toast.success(
        `CSV uploaded successfully for ${csvData.assignedDrivers.length} driver(s)`,
      );
      setCsvData({
        file: null,
        selectedDriver: "",
        assignedDrivers: [],
        isDragOver: false,
        routeName: "",
      });
      setDriverAssignmentOpen(false);

      // Reset file input
      const fileInput = document.getElementById(
        "csv-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh invoices to show the new ones
      fetchInvoicesData();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload CSV file");
    }
  };

  const handleCreateDriver = async () => {
    if (!newDriver.driver_name.trim()) {
      toast.error("Driver name is required");
      return;
    }

    if (!newDriver.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!newDriver.password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (newDriver.selectedBranches.length === 0) {
      toast.error("At least one branch must be selected");
      return;
    }

    try {
      const response = await apiService.createDriver({
        driver_name: newDriver.driver_name,
        email: newDriver.email,
        password: newDriver.password,
        branch_ids: newDriver.selectedBranches,
        isTemporary: newDriver.isTemporary,
      });

      // Assuming the response contains the created driver data
      const newDriverData = {
        id: response.driver.id || `driver_${Date.now()}`,
        username: newDriver.email, // Use email as username for display
        driver_name: newDriver.driver_name,
        branches: newDriver.selectedBranches.map((id) => {
          const branch = availableBranches.find((b) => b.id === id);
          return branch ? branch.name : id;
        }),
        role: "driver" as const,
        isTemporary: newDriver.isTemporary,
        created_at: response.driver.created_at || new Date().toISOString(),
        last_login: null,
      };

      setDrivers((prev) => [...prev, newDriverData]);
      setNewDriver({
        driver_name: "",
        email: "",
        password: "",
        selectedBranches: [],
        isTemporary: false,
      });
      setBranchDropdownOpen(false);
      setCreateDriverModalOpen(false);
      toast.success("Driver created successfully");
    } catch (error) {
      console.error("Failed to create driver:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create driver",
      );
    }
  };

  const handleCreateTempDriver = async () => {
    if (newTempDriver.selectedBranches.length === 0) {
      toast.error("At least one branch must be selected");
      return;
    }

    if (isCreatingTempDriver) {
      return; // Prevent duplicate calls
    }

    setIsCreatingTempDriver(true);

    try {
      const response = await apiService.createTemporaryDriver(
        newTempDriver.selectedBranches,
      );

      // Assuming the response contains the created driver data and credentials
      const tempDriverData = {
        id: response.driver.id || `temp_${Date.now()}`,
        username: response.driver.username,
        driver_name: response.driver.driver_name || `Temporary Driver`,
        branches: newTempDriver.selectedBranches.map((id) => {
          const branch = availableBranches.find((b) => b.id === id);
          return branch ? branch.name : id;
        }),
        role: "driver" as const,
        isTemporary: true,
        created_at:
          response.driver.created_at || new Date().toISOString().split("T")[0],
        last_login: null,
        temp_password: response.credentials.password, // Store for display in UI
      };

      setDrivers((prev) => [...prev, tempDriverData]);
      setTempDriverCredentials({
        username: response.credentials.username,
        password: response.credentials.password,
      });
      setNewTempDriver({ selectedBranches: [] });
      setTempDriverBranchDropdownOpen(false);

      toast.success("Temporary driver created successfully");
    } catch (error) {
      toast.error("Failed to create temporary driver");
    } finally {
      setIsCreatingTempDriver(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await apiService.deleteAdmin(adminId);
      setAdmins((prev) => prev.filter((admin) => admin.id !== adminId));
      toast.success("Admin deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete admin");
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    try {
      await apiService.deleteDriver(driverId);
      setDrivers((prev) => prev.filter((driver) => driver.id !== driverId));
      toast.success("Driver deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete driver");
    }
  };

  // Function to get date ranges based on filter selection (for created_at filtering)
  const getDateRangeForFilter = (filter: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (filter) {
      case "today":
        return { fromDate: todayStr, toDate: todayStr };
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return {
          fromDate: weekAgo.toISOString().split("T")[0],
          toDate: todayStr,
        };
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 30);
        return {
          fromDate: monthAgo.toISOString().split("T")[0],
          toDate: todayStr,
        };
      default:
        return { fromDate: "", toDate: "" };
    }
  };

  // Invoice Management Functions
  const fetchInvoicesData = async (
    page: number = 1,
    branchFilterOverride?: string,
  ) => {
    // For super admin, only fetch if a branch is selected
    const currentBranchFilter =
      branchFilterOverride !== undefined
        ? branchFilterOverride
        : invoiceBranchFilter;
    if (isSuperAdmin && !currentBranchFilter) {
      setAllInvoices([]);
      setSuperAdminPagination({
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 20,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const filters: any = {
        page,
        per_page: 20,
      };

      // Add search filter
      if (invoiceSearchQuery.trim()) {
        filters.search = invoiceSearchQuery.trim();
      }

      // Add status filter
      if (invoiceStatusFilter !== "all") {
        filters.status_filter = invoiceStatusFilter;
      }

      // Add date filters (use created_at for system entry filtering)
      const dateRange = getDateRangeForFilter(invoiceDateFilter);
      if (dateRange.fromDate) {
        filters.from_date = dateRange.fromDate;
        console.log("Date filter applied - from_date:", dateRange.fromDate);
      }
      if (dateRange.toDate) {
        filters.to_date = dateRange.toDate;
        console.log("Date filter applied - to_date:", dateRange.toDate);
      }

      // Add driver filter (for admin/super admin)
      if ((isSuperAdmin || isAdmin) && invoiceDriverFilter !== "all") {
        const driverId = getDriverIdFromName(invoiceDriverFilter);
        if (driverId) {
          filters.driver_id = driverId;
        }
      }

      // Add route filter
      if (invoiceRouteFilter !== "all") {
        console.log("Route filter selected:", invoiceRouteFilter);
        console.log("Available routes:", availableRoutes);
        const selectedRoute = availableRoutes.find(
          (r) => r.route_display === invoiceRouteFilter,
        );
        console.log("Selected route:", selectedRoute);
        if (selectedRoute) {
          filters.route_number = selectedRoute.route_number;
          if (selectedRoute.created_date) {
            filters.route_date = selectedRoute.created_date;
          }
          console.log("Route filters added:", {
            route_number: filters.route_number,
            route_date: filters.route_date,
          });
        }
      }

      // Add branch filter (for super admin)
      if (isSuperAdmin && currentBranchFilter !== "all") {
        filters.branch_id = currentBranchFilter;
      }

      let response;
      console.log("Fetching invoices with filters:", filters);
      if (isSuperAdmin || isAdmin) {
        response = await apiService.getInvoicesAdmin(filters);
      } else {
        response = await apiService.getDriverInvoices(filters);
      }
      console.log("Invoice response:", response);

      // Handle pagination data
      if (response.pagination) {
        const paginationInfo = {
          current_page: response.pagination.current_page,
          total_pages: response.pagination.total_pages,
          total_count: response.pagination.total_count,
          per_page: response.pagination.per_page,
        };

        if (isSuperAdmin) {
          setSuperAdminPagination(paginationInfo);
        } else {
          setAdminPagination(paginationInfo);
        }

        setAllInvoices(response.invoices || []);
      } else if (response.total !== undefined) {
        // Driver response format
        const paginationInfo = {
          current_page: response.page || 1,
          total_pages: response.total_pages || 1,
          total_count: response.total || 0,
          per_page: response.per_page || 20,
        };

        setAdminPagination(paginationInfo);
        setAllInvoices(response.invoices || []);
      } else {
        // Fallback
        const paginationInfo = {
          current_page: 1,
          total_pages: 1,
          total_count: (response.invoices || []).length,
          per_page: 20,
        };

        if (isSuperAdmin) {
          setSuperAdminPagination(paginationInfo);
        } else {
          setAdminPagination(paginationInfo);
        }

        setAllInvoices(response.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      toast.error("Failed to load invoices");
      setAllInvoices([]);

      const defaultPagination = {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 20,
      };

      if (isSuperAdmin) {
        setSuperAdminPagination(defaultPagination);
      } else {
        setAdminPagination(defaultPagination);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRoutes = async (
    driverName?: string,
    branchId?: string,
  ) => {
    try {
      const filters: any = {};

      // Convert driver name to driver ID if provided
      if (driverName && driverName !== "all") {
        const driverId = getDriverIdFromName(driverName);
        if (driverId) {
          filters.driver_id = driverId;
        } else {
          console.warn(
            `Could not find driver ID for driver name: ${driverName}`,
          );
          setAvailableRoutes([]);
          return;
        }
      }

      console.log("Fetching routes with filters:", filters);
      const response = await apiService.getRoutes(filters);
      console.log("Routes response:", response);
      setAvailableRoutes(response.routes || []);
    } catch (error) {
      console.error("Failed to fetch routes:", error);
      setAvailableRoutes([]);
    }
  };

  const applyFilters = () => {
    fetchInvoicesData(1);
  };

  const handlePageChange = (page: number) => {
    fetchInvoicesData(page);
  };

  const handleBulkPrint = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select invoices to print");
      return;
    }

    // Mock bulk print functionality
    toast.success(
      `Printing ${selectedInvoices.length} invoice${
        selectedInvoices.length > 1 ? "s" : ""
      }...`,
    );

    // In a real implementation, this would trigger print jobs for selected invoices
    selectedInvoices.forEach((invoiceId) => {
      const invoice = (allInvoices || []).find((inv) => inv.id === invoiceId);
      if (invoice?.pdf_url) {
        window.open(invoice.pdf_url, "_blank");
      }
    });
  };

  const handleBulkDownload = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select invoices to download");
      return;
    }

    try {
      toast.success(
        `Preparing ${selectedInvoices.length} PDF${
          selectedInvoices.length > 1 ? "s" : ""
        } for download...`,
      );
      await apiService.bulkDownloadPDFs(selectedInvoices);
      toast.success(
        `Successfully downloaded ${selectedInvoices.length} PDF${
          selectedInvoices.length > 1 ? "s" : ""
        }`,
      );
    } catch (error) {
      console.error("Bulk download failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download PDFs",
      );
    }
  };

  const handleRouteWisePDF = async () => {
    try {
      // Check if we have active route filter
      if (invoiceRouteFilter === "all" || !invoiceRouteFilter) {
        toast.error(
          "Please select a specific route to generate route-wise PDF",
        );
        return;
      }

      // Extract route name from the filter (format is "Route 1 - 2024-10-24")
      const routeName = invoiceRouteFilter.split(" - ")[0];

      // Get the selected driver ID
      const selectedDriverName = invoiceDriverFilter;
      let driverId: number | undefined;

      if (selectedDriverName && selectedDriverName !== "all") {
        const driverData = drivers.find(
          (d) => d.driver_name === selectedDriverName,
        );
        if (driverData) {
          driverId = parseInt(driverData.id);
        }
      }

      // Get current date for filtering - only if today filter is selected
      let filterDate: string | undefined;
      if (invoiceDateFilter === "today") {
        filterDate = new Date().toISOString().split("T")[0];
      }
      // Don't filter by date for other options to get all invoices for the route

      const filters = {
        route_name: routeName,
        driver_id: driverId,
        date: filterDate, // Only set if today filter is active
      };

      console.log("Route PDF filters:", filters); // Debug logging
      toast.success("Generating route-wise PDF...");
      await apiService.downloadRouteWisePDF(filters);
      toast.success("Route PDF downloaded successfully!");
    } catch (error) {
      console.error("Route PDF generation failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate route PDF",
      );
    }
  };

  const handlePrintSingle = async (invoiceId: string) => {
    try {
      const pdfUrl = await apiService.previewInvoicePDF(invoiceId);
      const printWindow = window.open(pdfUrl, "_blank");
      if (printWindow) {
        // Wait for PDF to load, then trigger print
        printWindow.onload = () => {
          printWindow.print();
        };
        // Also trigger print after a short delay as fallback
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.print();
          }
        }, 1000);
      }
      toast.success("Print dialog opened");
    } catch (error) {
      toast.error("Failed to open print view");
    }
  };

  const handlePreviewPDF = async (invoiceId: string) => {
    try {
      await apiService.downloadInvoicePDF(invoiceId);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      await apiService.downloadInvoicePDF(invoiceId);
      toast.success("PDF download started");
    } catch (error) {
      toast.error("Failed to download PDF");
    }
  };

  const viewInvoiceDetails = (invoiceId: string) => {
    const invoice = (allInvoices || []).find((inv) => inv.id === invoiceId);
    if (invoice) {
      // In a real app, this would open a detailed view modal or navigate to details page
      toast.info(
        `Viewing details for ${
          invoice.invoice_number || invoice.invoice_id || "N/A"
        }`,
      );
    }
  };

  const exportAllInvoices = () => {
    toast.success("Exporting all invoice data...");
    // Mock CSV export functionality
    // console.log("Exporting:", allInvoices);
  };

  // Filtered invoices (server-side filtering now, so just return all)
  // Since we're using server-side pagination, allInvoices already contains filtered results
  const filteredAllInvoices = allInvoices || [];

  // Get unique drivers for filter dropdown
  const getUniqueDrivers = () => {
    const driverSet = new Set<string>();
    (allInvoices || []).forEach((invoice) => {
      const driver = invoice.driver;
      if (driver) {
        driverSet.add(driver);
      }
    });
    return Array.from(driverSet).sort();
  };

  // Get driver ID from driver name
  const getDriverIdFromName = (driverName: string) => {
    const driver = drivers.find((d) => d.driver_name === driverName);
    return driver ? driver.id : null;
  };

  const toggleDriverAssignment = (driverId: string) => {
    setCsvData((prev) => {
      const newAssignedDrivers = prev.assignedDrivers.includes(driverId)
        ? prev.assignedDrivers.filter((id) => id !== driverId)
        : [...prev.assignedDrivers, driverId];

      return { ...prev, assignedDrivers: newAssignedDrivers };
    });
  };

  const removeAssignedDriver = (driverIdToRemove: string) => {
    setCsvData((prev) => {
      const newAssignedDrivers = prev.assignedDrivers.filter(
        (id) => id !== driverIdToRemove,
      );

      return { ...prev, assignedDrivers: newAssignedDrivers };
    });
  };

  const selectAllDrivers = () => {
    setCsvData((prev) => {
      const newAssignedDrivers = drivers.map((d) => d.id);
      return { ...prev, assignedDrivers: newAssignedDrivers };
    });
  };

  const clearAllDrivers = () => {
    setCsvData((prev) => ({ ...prev, assignedDrivers: [] }));
  };

  const toggleBranchSelection = (branchId: string) => {
    setNewDriver((prev) => ({
      ...prev,
      selectedBranches: prev.selectedBranches.includes(branchId)
        ? prev.selectedBranches.filter((b) => b !== branchId)
        : [...new Set([...prev.selectedBranches, branchId])],
    }));
  };

  const removeBranch = (branchIdToRemove: string) => {
    setNewDriver((prev) => ({
      ...prev,
      selectedBranches: prev.selectedBranches.filter(
        (b) => b !== branchIdToRemove,
      ),
    }));
  };

  const selectAllBranches = () => {
    setNewDriver((prev) => ({
      ...prev,
      selectedBranches: [...new Set(availableBranches.map((b) => b.id))],
    }));
  };

  const clearAllBranches = () => {
    setNewDriver((prev) => ({
      ...prev,
      selectedBranches: [],
    }));
  };

  // Get branch details (users and drivers in a branch)
  const getBranchDetails = (branchName: string) => {
    // Derive branch users from current state (admins and drivers) which are loaded from the API
    const branchAdmins = admins.filter((a) => {
      // Admin branch field is formatted as "Branch Name,City", so we need to extract just the name
      const adminBranchName = a.branch.split(",")[0]?.trim();
      return adminBranchName === branchName;
    });
    const branchDrivers = drivers.filter((d) =>
      (d.branches || []).includes(branchName),
    );

    return {
      admins: branchAdmins,
      drivers: branchDrivers,
      totalUsers: branchAdmins.length + branchDrivers.length,
    };
  };

  const handleCreateBranch = async () => {
    if (!newBranch.name.trim()) {
      toast.error("Branch name is required");
      return;
    }

    if (!newBranch.city.trim()) {
      toast.error("Branch city is required");
      return;
    }

    if (!newBranch.email.trim()) {
      toast.error("Branch email is required");
      return;
    }

    try {
      const branchData = {
        name: newBranch.name,
        city: newBranch.city,
        phone: newBranch.phone,
        email: newBranch.email,
      };

      const createdBranch = await apiService.createBranch(branchData);

      // Refresh branches list
      await fetchBranches();

      setNewBranch({ name: "", city: "", phone: "", email: "" });
      setShowBranchForm(false);
      toast.success("Branch created successfully");
    } catch (error) {
      console.error("Failed to create branch:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create branch",
      );
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name.trim()) {
      toast.error("Admin name is required");
      return;
    }

    if (!newAdmin.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!newAdmin.password.trim()) {
      toast.error("Password is required");
      return;
    }

    if (!newAdmin.branch_id.trim()) {
      toast.error("Branch is required");
      return;
    }

    try {
      const response = await apiService.createAdmin({
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        branch_id: newAdmin.branch_id,
      });

      if (response && response.admin) {
        const newAdminData = {
          id: String(response.admin.id),
          name: response.admin.name,
          branch: response.admin.branch,
          role: "admin" as const,
          created_at: response.admin.created_at,
          last_login: response.admin.last_login,
          is_active: response.admin.is_active,
          email: newAdmin.email,
        };

        setAdmins((prev) => [...prev, newAdminData]);
        setNewAdmin({ name: "", email: "", password: "", branch_id: "" });
        setShowAdminForm(false);
        toast.success(response.message || "Admin created successfully");
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create admin",
      );
    }
  };

  const handleEditAdmin = (admin: any) => {
    setEditAdminData({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      branch_id: branches.find((b) => b.name === admin.branch)?.id || "",
    });
    setShowEditAdminModal(true);
  };

  const handleViewAdmin = (admin: any) => {
    setSelectedAdmin(admin);
    setShowViewAdminModal(true);
  };

  const handleUpdateAdmin = async () => {
    if (!editAdminData.name.trim()) {
      toast.error("Admin name is required");
      return;
    }

    if (!editAdminData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!editAdminData.branch_id.trim()) {
      toast.error("Branch is required");
      return;
    }

    try {
      const response = await apiService.updateAdmin(editAdminData.id, {
        name: editAdminData.name,
        email: editAdminData.email,
        branch_id: editAdminData.branch_id,
      });

      // Update the admin in the local state
      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === editAdminData.id
            ? {
                ...admin,
                name: editAdminData.name,
                email: editAdminData.email,
                branch:
                  branches.find((b) => b.id === editAdminData.branch_id)
                    ?.name || admin.branch,
              }
            : admin,
        ),
      );

      setShowEditAdminModal(false);
      setEditAdminData({ id: "", name: "", email: "", branch_id: "" });
      toast.success(response.message || "Admin updated successfully");
    } catch (error) {
      console.error("Failed to update admin:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update admin",
      );
    }
  };

  const handleEditDriver = (driver: any) => {
    setEditDriverData({
      id: driver.id,
      driver_name: driver.driver_name,
      email: driver.username,
      selectedBranches: driver.branches
        .map(
          (branchName: string) =>
            branches.find((b) => b.name === branchName)?.id || "",
        )
        .filter(Boolean),
    });
    setShowEditDriverModal(true);
  };

  const handleViewDriver = (driver: any) => {
    setSelectedDriver(driver);
    setShowViewDriverModal(true);
  };

  const handleUpdateDriver = async () => {
    if (!editDriverData.driver_name.trim()) {
      toast.error("Driver name is required");
      return;
    }

    if (!editDriverData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (editDriverData.selectedBranches.length === 0) {
      toast.error("At least one branch is required");
      return;
    }

    try {
      const response = await apiService.updateDriver(editDriverData.id, {
        driver_name: editDriverData.driver_name,
        email: editDriverData.email,
        branch_ids: editDriverData.selectedBranches,
      });

      // Update the driver in the local state
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === editDriverData.id
            ? {
                ...driver,
                driver_name: editDriverData.driver_name,
                email: editDriverData.email,
                branches: editDriverData.selectedBranches
                  .map(
                    (branchId) =>
                      branches.find((b) => b.id === branchId)?.name || "",
                  )
                  .filter(Boolean),
              }
            : driver,
        ),
      );

      setShowEditDriverModal(false);
      setEditDriverData({
        id: "",
        driver_name: "",
        email: "",
        selectedBranches: [],
      });
      toast.success(response.message || "Driver updated successfully");
    } catch (error) {
      console.error("Failed to update driver:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update driver",
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b-2 border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex items-center justify-center border border-primary-foreground/20">
              <img src="/logo.png" alt="" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-serif">
                Dlive Admin Portal
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                {userName && `Welcome, ${userName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-medium">
              {isSuperAdmin
                ? "Super Admin"
                : isAdmin
                  ? (branches.find((b) => b.id === userBranches[0])?.name ??
                    userBranches[0] ??
                    "Admin")
                  : "Admin"}
            </Badge>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/admin/live-map")}
              className="font-medium"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Live Map
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-medium"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs
          defaultValue={isSuperAdmin ? "branches" : "invoices"}
          className="space-y-6"
        >
          <TabsList
            className={`grid w-full ${
              isSuperAdmin ? "grid-cols-3" : "grid-cols-3"
            } border-2`}
          >
            {!isSuperAdmin && (
              <>
                <TabsTrigger
                  value="invoices"
                  className="flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Invoice Management</span>
                  <span className="sm:hidden">Invoices</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="flex items-center gap-2 font-medium"
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">CSV Upload</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="drivers"
                  className="flex items-center gap-2 font-medium"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Drivers</span>
                  <span className="sm:hidden">Drivers</span>
                </TabsTrigger>
              </>
            )}
            {isSuperAdmin && (
              <>
                <TabsTrigger
                  value="branches"
                  className="flex items-center gap-2 font-medium"
                >
                  <Building className="h-4 w-4" />
                  <span className="hidden sm:inline">Branches</span>
                  <span className="sm:hidden">Branches</span>
                </TabsTrigger>
                <TabsTrigger
                  value="admins"
                  className="flex items-center gap-2 font-medium"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Admins</span>
                  <span className="sm:hidden">Admins</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">All Invoices</span>
                  <span className="sm:hidden">Invoices</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Invoice Management Tab - NEW PRIMARY TAB FOR ADMINS */}
          {!isSuperAdmin && (
            <TabsContent value="invoices" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-serif text-foreground">
                    Invoice Management
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    Track & manage invoices across your branches
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => fetchInvoicesData()}
                  className="font-medium px-6"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {/* Invoice Management Interface */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>All Invoices</CardTitle>
                      <CardDescription>
                        Manage invoices across all your branches
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoices([])}
                        disabled={selectedInvoices.length === 0}
                      >
                        Clear Selection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedInvoices(
                            (allInvoices || []).map((inv) => inv.id),
                          )
                        }
                        disabled={
                          selectedInvoices.length === (allInvoices || []).length
                        }
                      >
                        Select All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filter */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search invoices by shop name, invoice ID, or address..."
                          value={invoiceSearchQuery}
                          onChange={(e) =>
                            setInvoiceSearchQuery(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={invoiceStatusFilter}
                        onValueChange={setInvoiceStatusFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceDateFilter}
                        onValueChange={setInvoiceDateFilter}
                      >
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
                      <Select
                        value={invoiceDriverFilter}
                        onValueChange={setInvoiceDriverFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          {getUniqueDrivers().map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceRouteFilter}
                        onValueChange={setInvoiceRouteFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Route" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Routes</SelectItem>
                          {availableRoutes.length > 0 ? (
                            availableRoutes.map((route) => (
                              <SelectItem
                                key={`${route.route_number}-${route.created_date}`}
                                value={route.route_display}
                              >
                                {route.route_display}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-routes" disabled>
                              {invoiceDriverFilter === "all"
                                ? "Select a driver first"
                                : "No routes found"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter Summary */}
                    {(invoiceSearchQuery ||
                      invoiceStatusFilter !== "all" ||
                      invoiceDateFilter !== "all" ||
                      invoiceDriverFilter !== "all" ||
                      invoiceRouteFilter !== "all") && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span>
                          {(() => {
                            const start =
                              (adminPagination.current_page - 1) *
                                adminPagination.per_page +
                              1;
                            const end = Math.min(
                              adminPagination.current_page *
                                adminPagination.per_page,
                              adminPagination.total_count,
                            );
                            return `${start}-${end}`;
                          })()}{" "}
                          of {adminPagination.total_count}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInvoiceSearchQuery("");
                            setInvoiceStatusFilter("all");
                            setInvoiceDateFilter("all");
                            setInvoiceDriverFilter("all");
                            setInvoiceRouteFilter("all");
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Route PDF Download Button */}
                  {invoiceRouteFilter !== "all" && invoiceRouteFilter && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <FileText className="h-4 w-4" />
                        <span>
                          Route: <strong>{invoiceRouteFilter}</strong>
                        </span>
                        {invoiceDriverFilter !== "all" && (
                          <span className="text-blue-600">
                            • Driver: <strong>{invoiceDriverFilter}</strong>
                          </span>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRouteWisePDF}
                        className="flex items-center gap-2 bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Download Route PDF
                      </Button>
                    </div>
                  )}

                  {/* Invoice Table */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="border-2 rounded-lg shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b-2 bg-muted/50">
                            <tr>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Select
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Invoice Number
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Customer
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Amount
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Status
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Date
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Branch
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Driver
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Route
                              </th>
                              <th className="p-4 text-left font-bold text-foreground text-sm">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAllInvoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedInvoices.includes(
                                      invoice.id,
                                    )}
                                    disabled={!invoice.is_acknowledged}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInvoices((prev) => [
                                          ...prev,
                                          invoice.id,
                                        ]);
                                      } else {
                                        setSelectedInvoices((prev) =>
                                          prev.filter(
                                            (id) => id !== invoice.id,
                                          ),
                                        );
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">
                                      {invoice.invoice_number ||
                                        invoice.invoice_id ||
                                        "N/A"}
                                    </p>
                                    {invoice.delivery_date && (
                                      <p className="text-xs text-muted-foreground">
                                        Due: {formatDate(invoice.delivery_date)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">
                                      {invoice.customer_name ||
                                        invoice.shop_name ||
                                        "N/A"}
                                    </p>
                                    {invoice.shop_address && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {invoice.shop_address}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium">
                                    ₹{invoice.amount.toFixed(2)}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant={
                                      invoice.is_acknowledged ||
                                      invoice.status === "Delivered" ||
                                      invoice.status === "delivered"
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {invoice.is_acknowledged ||
                                    invoice.status === "Delivered" ||
                                    invoice.status === "delivered"
                                      ? "Delivered"
                                      : "Pending"}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.invoice_date
                                      ? formatDate(invoice.invoice_date)
                                      : "N/A"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.branch_name ||
                                      invoice.branch ||
                                      "N/A"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.driver || "Unassigned"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.route_display ||
                                      invoice.route_name ||
                                      (invoice.route_number
                                        ? `Route ${invoice.route_number}`
                                        : "N/A")}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handlePreviewPDF(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Download PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDownloadPDF(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Download PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handlePrintSingle(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Print PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        viewInvoiceDetails(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="View Details"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {filteredAllInvoices.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {invoiceSearchQuery ||
                          invoiceStatusFilter !== "all" ||
                          invoiceDateFilter !== "all" ||
                          invoiceDriverFilter !== "all"
                            ? "No invoices match your current filters"
                            : "No invoices found"}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bulk Actions */}
                  {selectedInvoices.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">
                            {selectedInvoices.length}
                          </span>{" "}
                          invoice{selectedInvoices.length > 1 ? "s" : ""}{" "}
                          selected
                          <span className="text-muted-foreground ml-2">
                            (Total: ₹
                            {filteredAllInvoices
                              .filter((inv) =>
                                selectedInvoices.includes(inv.id),
                              )
                              .reduce((sum, inv) => sum + inv.amount, 0)
                              .toFixed(2)}
                            )
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkDownload()}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PDFs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleBulkPrint()}
                            className="flex items-center gap-2"
                          >
                            <Printer className="h-4 w-4" />
                            Print All
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination for Admin */}
                  {!loading && adminPagination.total_count > 0 && (
                    <TablePagination
                      pagination={adminPagination}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Super Admin All Invoices Tab */}
          {isSuperAdmin && (
            <TabsContent value="invoices" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold font-serif text-foreground">
                    System Invoice Overview
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 font-medium">
                    Complete system-wide invoice management
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => fetchInvoicesData()}
                    className="font-medium px-6"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => handleBulkPrint()}
                    disabled={selectedInvoices.length === 0}
                    className="font-medium px-6"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Bulk Print ({selectedInvoices.length})
                  </Button>
                </div>
              </div>

              {/* Invoice Management Interface for Super Admin */}
              <Card>
                <CardContent>
                  {/* Search and Filter Controls */}
                  <div className="space-y-4 mb-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search invoices by shop name, invoice ID, or address..."
                          value={invoiceSearchQuery}
                          onChange={(e) =>
                            setInvoiceSearchQuery(e.target.value)
                          }
                          className="pl-10"
                        />
                      </div>
                      <Select
                        value={invoiceStatusFilter}
                        onValueChange={setInvoiceStatusFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceDateFilter}
                        onValueChange={setInvoiceDateFilter}
                      >
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
                      <Select
                        value={invoiceDriverFilter}
                        onValueChange={setInvoiceDriverFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          {getUniqueDrivers().map((driver) => (
                            <SelectItem key={driver} value={driver}>
                              {driver}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceRouteFilter}
                        onValueChange={setInvoiceRouteFilter}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Route" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Routes</SelectItem>
                          {availableRoutes.length > 0 ? (
                            availableRoutes.map((route) => (
                              <SelectItem
                                key={`${route.route_number}-${route.created_date}-super`}
                                value={route.route_display}
                              >
                                {route.route_display}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-routes" disabled>
                              {invoiceDriverFilter === "all"
                                ? "Select a driver first"
                                : "No routes found"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <Select
                        value={invoiceBranchFilter}
                        onValueChange={(value) => {
                          setInvoiceBranchFilter(value);
                          // Clear selection when branch changes
                          setSelectedInvoices([]);
                          // Fetch invoices for the selected branch (only if a branch is selected for super admin)
                          if (!isSuperAdmin || value) {
                            fetchInvoicesData(1, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches
                            .filter((b) => b.is_active)
                            .map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Filter Summary */}
                      {(invoiceSearchQuery ||
                        invoiceStatusFilter !== "all" ||
                        invoiceDateFilter !== "all" ||
                        invoiceDriverFilter !== "all" ||
                        invoiceRouteFilter !== "all" ||
                        invoiceBranchFilter) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Filter className="h-4 w-4" />
                          <span>
                            {(() => {
                              const start =
                                (superAdminPagination.current_page - 1) *
                                  superAdminPagination.per_page +
                                1;
                              const end = Math.min(
                                superAdminPagination.current_page *
                                  superAdminPagination.per_page,
                                superAdminPagination.total_count,
                              );
                              return `${start}-${end}`;
                            })()}{" "}
                            of {superAdminPagination.total_count}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setInvoiceSearchQuery("");
                              setInvoiceStatusFilter("all");
                              setInvoiceDateFilter("all");
                              setInvoiceDriverFilter("all");
                              setInvoiceRouteFilter("all");
                              setInvoiceBranchFilter("");
                              setSelectedInvoices([]);
                              fetchInvoicesData(1);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      )}

                      {/* Selection Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoices([])}
                          disabled={selectedInvoices.length === 0}
                        >
                          Clear Selection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSelectedInvoices(
                              (allInvoices || []).map((inv) => inv.id),
                            )
                          }
                          disabled={
                            selectedInvoices.length ===
                            (allInvoices || []).length
                          }
                        >
                          Select All
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Table */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b bg-muted/50">
                            <tr>
                              <th className="p-3 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedInvoices.length ===
                                      filteredAllInvoices.length &&
                                    filteredAllInvoices.length > 0
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedInvoices(
                                        filteredAllInvoices.map(
                                          (inv) => inv.id,
                                        ),
                                      );
                                    } else {
                                      setSelectedInvoices([]);
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                              </th>
                              <th className="p-3 text-left font-medium">
                                Invoice Number
                              </th>
                              <th className="p-3 text-left font-medium">
                                Customer
                              </th>
                              <th className="p-3 text-left font-medium">
                                Amount
                              </th>
                              <th className="p-3 text-left font-medium">
                                Status
                              </th>
                              <th className="p-3 text-left font-medium">
                                Date
                              </th>
                              <th className="p-3 text-left font-medium">
                                Branch
                              </th>
                              <th className="p-3 text-left font-medium">
                                Driver
                              </th>
                              <th className="p-3 text-left font-medium">
                                Route
                              </th>
                              <th className="p-3 text-left font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAllInvoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className="border-b hover:bg-muted/50"
                              >
                                <td className="p-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedInvoices.includes(
                                      invoice.id,
                                    )}
                                    disabled={!invoice.is_acknowledged}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInvoices((prev) => [
                                          ...prev,
                                          invoice.id,
                                        ]);
                                      } else {
                                        setSelectedInvoices((prev) =>
                                          prev.filter(
                                            (id) => id !== invoice.id,
                                          ),
                                        );
                                      }
                                    }}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">
                                      {invoice.invoice_number ||
                                        invoice.invoice_id ||
                                        "N/A"}
                                    </p>
                                    {invoice.delivery_date && (
                                      <p className="text-xs text-muted-foreground">
                                        Due: {formatDate(invoice.delivery_date)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">
                                      {invoice.customer_name ||
                                        invoice.shop_name ||
                                        "N/A"}
                                    </p>
                                    {invoice.shop_address && (
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {invoice.shop_address}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <p className="font-medium">
                                    ₹{invoice.amount.toFixed(2)}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <Badge
                                    variant={
                                      invoice.is_acknowledged ||
                                      invoice.status === "Delivered" ||
                                      invoice.status === "delivered"
                                        ? "success"
                                        : "warning"
                                    }
                                  >
                                    {invoice.is_acknowledged ||
                                    invoice.status === "Delivered" ||
                                    invoice.status === "delivered"
                                      ? "Delivered"
                                      : "Pending"}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.invoice_date
                                      ? formatDate(invoice.invoice_date)
                                      : "N/A"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.branch_name ||
                                      invoice.branch ||
                                      "N/A"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.driver || "Unassigned"}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="text-sm">
                                    {invoice.route_display ||
                                      invoice.route_name ||
                                      (invoice.route_number
                                        ? `Route ${invoice.route_number}`
                                        : "N/A")}
                                  </p>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handlePreviewPDF(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Download PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDownloadPDF(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Download PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handlePrintSingle(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="Print PDF"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <Printer className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        viewInvoiceDetails(invoice.id)
                                      }
                                      className="h-8 w-8 p-0"
                                      title="View Details"
                                      disabled={!invoice.is_acknowledged}
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {filteredAllInvoices.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          {isSuperAdmin && !invoiceBranchFilter ? (
                            <div className="space-y-2">
                              <Settings className="h-12 w-12 mx-auto opacity-50" />
                              <p className="text-lg font-medium">
                                Please select a branch to view invoices
                              </p>
                              <p className="text-sm">
                                Choose a branch from the filter dropdown above
                                to see invoices from that branch.
                              </p>
                            </div>
                          ) : invoiceSearchQuery ||
                            invoiceStatusFilter !== "all" ||
                            invoiceDateFilter !== "all" ||
                            invoiceDriverFilter !== "all" ||
                            (isSuperAdmin && invoiceBranchFilter) ? (
                            "No invoices match your current filters"
                          ) : (
                            "No invoices found"
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bulk Actions */}
                  {selectedInvoices.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">
                            {selectedInvoices.length}
                          </span>{" "}
                          invoice{selectedInvoices.length > 1 ? "s" : ""}{" "}
                          selected
                          <span className="text-muted-foreground ml-2">
                            (Total: ₹
                            {filteredAllInvoices
                              .filter((inv) =>
                                selectedInvoices.includes(inv.id),
                              )
                              .reduce((sum, inv) => sum + inv.amount, 0)
                              .toFixed(2)}
                            )
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkDownload()}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download PDFs
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleBulkPrint()}
                            className="flex items-center gap-2"
                          >
                            <Printer className="h-4 w-4" />
                            Print All
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination for Super Admin */}
                  {!loading && superAdminPagination.total_count > 0 && (
                    <TablePagination
                      pagination={superAdminPagination}
                      onPageChange={handlePageChange}
                      showInfo={true}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Super Admin Tabs */}
          {isSuperAdmin && (
            <>
              {/* Branches Tab */}
              <TabsContent value="branches" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Branch Management</h2>
                    <p className="text-muted-foreground">
                      Branches & configuration
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowBranchForm(!showBranchForm)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {showBranchForm ? "Hide Form" : "Create Branch"}
                    </Button>
                    <Button variant="outline" onClick={fetchBranches}>
                      <Settings className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Create Branch Form - Only show when button clicked */}
                {showBranchForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Create New Branch
                      </CardTitle>
                      <CardDescription>
                        Add a new branch location to the system
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="branch-name">
                            Branch Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="branch-name"
                            placeholder="Branch name"
                            value={newBranch.name}
                            onChange={(e) =>
                              setNewBranch((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="branch-email">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="branch-email"
                            type="email"
                            placeholder="Email"
                            value={newBranch.email}
                            onChange={(e) =>
                              setNewBranch((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branch-city">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="branch-city"
                          placeholder="City"
                          value={newBranch.city}
                          onChange={(e) =>
                            setNewBranch((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="branch-phone">Phone</Label>
                        <Input
                          id="branch-phone"
                          placeholder="Phone"
                          value={newBranch.phone}
                          onChange={(e) =>
                            setNewBranch((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateBranch}
                          disabled={
                            !newBranch.name.trim() ||
                            !newBranch.city.trim() ||
                            !newBranch.email.trim()
                          }
                          className="flex-1"
                          size="lg"
                        >
                          Create Branch
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowBranchForm(false)}
                          size="lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Branch Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      All Branches ({branches.length})
                    </h3>
                    {selectedBranchDetails && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedBranchDetails(null)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Close Details
                      </Button>
                    )}
                  </div>

                  {selectedBranchDetails ? (
                    // Branch Details View
                    <div className="space-y-4">
                      {(() => {
                        const branch = branches.find(
                          (b) => b.id === selectedBranchDetails,
                        );
                        const details = getBranchDetails(branch.name);

                        if (!branch) return null;

                        return (
                          <>
                            <Card>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Settings className="h-5 w-5" />
                                  {branch.name} - Branch Details
                                  <Badge
                                    variant={
                                      branch.is_active ? "default" : "secondary"
                                    }
                                  >
                                    {branch.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </CardTitle>
                                <CardDescription>
                                  Complete information about this branch
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">
                                      Contact Information
                                    </h4>
                                    <div className="space-y-2 mt-2 text-sm">
                                      <p>
                                        <strong>Address:</strong> {branch.city}
                                      </p>
                                      <p>
                                        <strong>Phone:</strong> {branch.phone}
                                      </p>
                                      <p>
                                        <strong>Email:</strong> {branch.email}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-muted-foreground">
                                      Statistics
                                    </h4>
                                    <div className="space-y-2 mt-2 text-sm">
                                      <p>
                                        <strong>Total Users:</strong>{" "}
                                        {details.totalUsers}
                                      </p>
                                      <p>
                                        <strong>Admins:</strong>{" "}
                                        {details.admins.length}
                                      </p>
                                      <p>
                                        <strong>Drivers:</strong>{" "}
                                        {details.drivers.length}
                                      </p>
                                      <p>
                                        <strong>Created:</strong>{" "}
                                        {formatDate(branch.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Admins in this branch */}
                            {details.admins.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Branch Admins ({details.admins.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid gap-3">
                                    {details.admins.map((admin) => (
                                      <div
                                        key={admin.id}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {admin.name}
                                          </p>
                                          {admin.email && (
                                            <p className="text-sm text-muted-foreground">
                                              {admin.email}
                                            </p>
                                          )}
                                        </div>
                                        <Badge variant="outline">Admin</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {/* Drivers in this branch */}
                            {details.drivers.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Branch Drivers ({details.drivers.length})
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="grid gap-3">
                                    {details.drivers.map((driver) => (
                                      <div
                                        key={driver.username}
                                        className="flex items-center justify-between p-3 border rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">
                                            {driver.driver_name}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            @{driver.username}
                                          </p>
                                        </div>
                                        <Badge variant="outline">Driver</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {details.totalUsers === 0 && (
                              <Card>
                                <CardContent className="pt-6">
                                  <div className="text-center text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No users assigned to this branch yet</p>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    // Branch Cards Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {branches.length === 0 ? (
                        <div className="col-span-full">
                          <Card>
                            <CardContent className="pt-6">
                              <div className="text-center text-muted-foreground">
                                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                  No branches found
                                </p>
                                <p className="text-sm">
                                  Create your first branch to get started
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ) : (
                        branches.map((branch) => {
                          const details = getBranchDetails(branch.name);
                          return (
                            <Card
                              key={branch.id}
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() =>
                                setSelectedBranchDetails(branch.id)
                              }
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                      <Settings className="h-4 w-4" />
                                      {branch.name}
                                    </CardTitle>
                                    <Badge
                                      variant={
                                        branch.is_active
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="mt-1"
                                    >
                                      {branch.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedBranchDetails(branch.id);
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="text-sm text-muted-foreground">
                                    <p className="truncate">{branch.city}</p>
                                    <p>{branch.phone}</p>
                                    <p className="text-xs">{branch.email}</p>
                                  </div>

                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4" />
                                      <span>{details.totalUsers} users</span>
                                    </div>
                                    <div className="flex gap-3 text-xs text-muted-foreground">
                                      <span>
                                        {details.admins.length} admins
                                      </span>
                                      <span>
                                        {details.drivers.length} drivers
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-muted-foreground pt-2 border-t">
                                    Created: {formatDate(branch.created_at)}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Admins Tab */}
              <TabsContent value="admins" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Admin Management</h2>
                    <p className="text-muted-foreground">
                      Manage administrators
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAdminForm(!showAdminForm)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {showAdminForm ? "Hide Form" : "Create Admin"}
                    </Button>
                    <Button variant="outline" onClick={fetchAdmins}>
                      <Settings className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Create Admin Form - Only show when button clicked */}
                {showAdminForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New Admin
                      </CardTitle>
                      <CardDescription>Add new admin account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-name">
                            Admin Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="admin-name"
                            placeholder="Admin name"
                            value={newAdmin.name}
                            onChange={(e) =>
                              setNewAdmin((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-email">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="Email"
                            value={newAdmin.email}
                            onChange={(e) =>
                              setNewAdmin((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="admin-password">
                            Password <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="admin-password"
                            type="password"
                            placeholder="Password"
                            value={newAdmin.password}
                            onChange={(e) =>
                              setNewAdmin((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="admin-branch">
                            Branch <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={newAdmin.branch_id}
                            onValueChange={(value) =>
                              setNewAdmin((prev) => ({
                                ...prev,
                                branch_id: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a branch" />
                            </SelectTrigger>
                            <SelectContent>
                              {branches
                                .filter((b) => b.is_active)
                                .map((branch) => (
                                  <SelectItem key={branch.id} value={branch.id}>
                                    <span className="font-medium">
                                      {branch.name}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                      ({branch.city})
                                    </span>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateAdmin}
                          disabled={
                            !newAdmin.name.trim() ||
                            !newAdmin.email.trim() ||
                            !newAdmin.password.trim() ||
                            !newAdmin.branch_id.trim()
                          }
                          className="flex-1"
                          size="lg"
                        >
                          Create Admin
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowAdminForm(false)}
                          size="lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Edit Admin Modal */}
                <Dialog
                  open={showEditAdminModal}
                  onOpenChange={setShowEditAdminModal}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Edit Admin
                      </DialogTitle>
                      <DialogDescription>
                        Update admin information
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-admin-name">
                            Admin Name{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="edit-admin-name"
                            placeholder="Enter admin full name"
                            value={editAdminData.name}
                            onChange={(e) =>
                              setEditAdminData((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-admin-email">
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="edit-admin-email"
                            type="email"
                            placeholder="Enter admin email"
                            value={editAdminData.email}
                            onChange={(e) =>
                              setEditAdminData((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="edit-admin-branch">
                          Branch <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={editAdminData.branch_id}
                          onValueChange={(value) =>
                            setEditAdminData((prev) => ({
                              ...prev,
                              branch_id: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches
                              .filter((b) => b.is_active)
                              .map((branch) => (
                                <SelectItem key={branch.id} value={branch.id}>
                                  <span className="font-medium">
                                    {branch.name}
                                  </span>
                                  <span className="text-muted-foreground ml-2">
                                    ({branch.city})
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={handleUpdateAdmin}
                          disabled={
                            !editAdminData.name.trim() ||
                            !editAdminData.email.trim() ||
                            !editAdminData.branch_id.trim()
                          }
                          className="flex-1"
                          size="lg"
                        >
                          Update Admin
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEditAdminModal(false);
                            setEditAdminData({
                              id: "",
                              name: "",
                              email: "",
                              branch_id: "",
                            });
                          }}
                          size="lg"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* View Admin Details Modal */}
                <Dialog
                  open={showViewAdminModal}
                  onOpenChange={setShowViewAdminModal}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Admin Details
                      </DialogTitle>
                      <DialogDescription>Admin information</DialogDescription>
                    </DialogHeader>

                    {selectedAdmin && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Admin Name
                            </Label>
                            <div className="p-2 bg-muted rounded text-sm">
                              {selectedAdmin.name}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Email
                            </Label>
                            <div className="p-2 bg-muted rounded text-sm">
                              {selectedAdmin.email || "N/A"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Status
                            </Label>
                            <div className="p-2 bg-muted rounded text-sm">
                              <Badge
                                variant={
                                  selectedAdmin.is_active
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {selectedAdmin.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Branch
                            </Label>
                            <div className="p-2 bg-muted rounded text-sm">
                              {selectedAdmin.branch || "N/A"}
                            </div>
                          </div>
                        </div>

                        {selectedAdmin.last_login && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-600">
                              Last Login
                            </Label>
                            <div className="p-2 bg-muted rounded text-sm">
                              {formatDate(selectedAdmin.last_login)}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setShowViewAdminModal(false)}
                            className="flex-1"
                            size="lg"
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Existing Admins ({admins.length})
                  </h3>
                  {admins.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                          <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No admins created yet</p>
                          <p className="text-sm">
                            Click "Create Admin" to add your first admin
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {admins.map((admin) => (
                        <Card key={admin.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {admin.name}
                                  <Badge
                                    variant={
                                      admin.is_active ? "default" : "secondary"
                                    }
                                  >
                                    {admin.is_active ? "Active" : "Inactive"}
                                  </Badge>
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">
                                  {admin.email || "No email"}
                                </p>
                                {admin.last_login && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Last login: {formatDate(admin.last_login)}
                                  </p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={(e) => {
                                      e.preventDefault();
                                      handleViewAdmin(admin);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    onClick={() => handleEditAdmin(admin)}
                                  >
                                    <Settings className="h-4 w-4 mr-2" />
                                    Edit Admin
                                  </DropdownMenuItem>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Admin
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Admin
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete{" "}
                                          {admin.name}? This will permanently
                                          remove the admin account and cannot be
                                          undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteAdmin(admin.id)
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  Branch
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {admin.branch}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground pt-2 border-t">
                                Created: {formatDate(admin.created_at)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </>
          )}

          {/* Regular Admin Tabs */}
          {isAdmin && (
            <>
              {/* Upload & Assign Tab - Primary Task */}
              <TabsContent value="upload" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    Upload CSV & Assign Drivers
                  </h2>
                  <p className="text-muted-foreground">
                    Upload invoice data and assign drivers
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5" />
                          CSV File Upload
                        </CardTitle>
                        <CardDescription>Upload invoice file</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCSVTemplate}
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Template
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        csvData.isDragOver
                          ? "border-primary bg-primary/10"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload
                        className={`h-12 w-12 mx-auto mb-4 ${
                          csvData.isDragOver
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {csvData.file
                            ? csvData.file.name
                            : csvData.isDragOver
                              ? "Drop the CSV file here"
                              : "Drop your CSV file here, or click to browse"}
                        </p>
                        <Input
                          id="csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("csv-upload")?.click()
                          }
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>

                    {csvData.file && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-800 flex-1">
                            ✓ File uploaded: {csvData.file.name} (
                            {(csvData.file.size / 1024).toFixed(1)} KB)
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCsvData((prev) => ({ ...prev, file: null }));
                              // Reset file input
                              const fileInput = document.getElementById(
                                "csv-upload",
                              ) as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 ml-2"
                            title="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Route Name Input */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="route-name"
                        className="text-sm font-medium text-gray-700"
                      >
                        Route Name
                      </Label>
                      <Input
                        id="route-name"
                        type="text"
                        placeholder="Route name"
                        value={csvData.routeName || ""}
                        onChange={(e) =>
                          setCsvData((prev) => ({
                            ...prev,
                            routeName: e.target.value,
                          }))
                        }
                        className="w-full"
                        maxLength={100}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assign Drivers</CardTitle>
                    <CardDescription>
                      Assign drivers to invoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Driver Assignment Dropdown */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Select Drivers</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllDrivers}
                            disabled={
                              drivers.length === 0 ||
                              csvData.assignedDrivers.length === drivers.length
                            }
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllDrivers}
                            disabled={csvData.assignedDrivers.length === 0}
                          >
                            Clear All
                          </Button>
                          <Dialog
                            open={tempDriverModalOpen}
                            onOpenChange={(open) => {
                              setTempDriverModalOpen(open);
                              if (open) {
                                // Clear previous credentials when opening modal
                                setTempDriverCredentials(null);
                                setNewTempDriver({ selectedBranches: [] });
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button variant="secondary" size="sm">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Create Temp Driver
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Create Temporary Driver
                                </DialogTitle>
                                <DialogDescription>
                                  Assign branch access for temporary driver
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="space-y-3">
                                  <Label>
                                    Branch Access{" "}
                                    <span className="text-destructive">*</span>
                                  </Label>
                                  <Popover
                                    open={tempDriverBranchDropdownOpen}
                                    onOpenChange={
                                      setTempDriverBranchDropdownOpen
                                    }
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={
                                          tempDriverBranchDropdownOpen
                                        }
                                        className={`w-full justify-between ${
                                          newTempDriver.selectedBranches
                                            .length === 0
                                            ? "border-destructive"
                                            : ""
                                        }`}
                                      >
                                        {newTempDriver.selectedBranches.length >
                                        0
                                          ? `${
                                              newTempDriver.selectedBranches
                                                .length
                                            } branch${
                                              newTempDriver.selectedBranches
                                                .length > 1
                                                ? "es"
                                                : ""
                                            } selected`
                                          : "Select branches..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                      <Command>
                                        <CommandInput placeholder="Search branches..." />
                                        <CommandEmpty>
                                          No branches found.
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {availableBranches.map((branch) => (
                                            <CommandItem
                                              key={branch.id}
                                              onSelect={() => {
                                                setNewTempDriver((prev) => ({
                                                  ...prev,
                                                  selectedBranches:
                                                    prev.selectedBranches.includes(
                                                      branch.id,
                                                    )
                                                      ? prev.selectedBranches.filter(
                                                          (b) =>
                                                            b !== branch.id,
                                                        )
                                                      : [
                                                          ...new Set([
                                                            ...prev.selectedBranches,
                                                            branch.id,
                                                          ]),
                                                        ],
                                                }));
                                              }}
                                            >
                                              <Check
                                                className={`mr-2 h-4 w-4 ${
                                                  newTempDriver.selectedBranches.includes(
                                                    branch.id,
                                                  )
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                                }`}
                                              />
                                              {branch.name}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>

                                  {newTempDriver.selectedBranches.length >
                                    0 && (
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                      {[
                                        ...new Set(
                                          newTempDriver.selectedBranches,
                                        ),
                                      ].map((branchId) => {
                                        const branch = availableBranches.find(
                                          (b) => b.id === branchId,
                                        );
                                        return branch ? (
                                          <div
                                            key={branchId}
                                            className="flex items-center gap-1 bg-background px-2 py-1 rounded-md text-sm border"
                                          >
                                            {branch.name}
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                              onClick={() =>
                                                setNewTempDriver((prev) => ({
                                                  ...prev,
                                                  selectedBranches:
                                                    prev.selectedBranches.filter(
                                                      (b) => b !== branchId,
                                                    ),
                                                }))
                                              }
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  )}
                                </div>

                                <Button
                                  onClick={handleCreateTempDriver}
                                  disabled={
                                    newTempDriver.selectedBranches.length ===
                                      0 || isCreatingTempDriver
                                  }
                                  className="w-full"
                                >
                                  {isCreatingTempDriver
                                    ? "Creating..."
                                    : "Create Temporary Driver"}
                                </Button>

                                {tempDriverCredentials && (
                                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-2">
                                      Temporary Driver Created!
                                    </h4>
                                    <div className="space-y-1 text-sm">
                                      <p>
                                        <strong>Username:</strong>{" "}
                                        {tempDriverCredentials.username}
                                      </p>
                                      <p>
                                        <strong>Password:</strong>{" "}
                                        {tempDriverCredentials.password}
                                      </p>
                                    </div>
                                    <p className="text-xs text-green-600 mt-2">
                                      Save these credentials - they will be
                                      shown in the driver list.
                                    </p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>

                      <Popover
                        open={driverAssignmentOpen}
                        onOpenChange={setDriverAssignmentOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={driverAssignmentOpen}
                            className="w-full justify-between"
                          >
                            {csvData.assignedDrivers.length > 0
                              ? `${csvData.assignedDrivers.length} driver${
                                  csvData.assignedDrivers.length > 1 ? "s" : ""
                                } selected`
                              : "Select drivers for invoice assignment..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search drivers..." />
                            <CommandEmpty>No drivers found.</CommandEmpty>
                            <CommandGroup>
                              {drivers.map((driver) => (
                                <CommandItem
                                  key={driver.id}
                                  onSelect={() => {
                                    toggleDriverAssignment(driver.id);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      csvData.assignedDrivers.includes(
                                        driver.id,
                                      )
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-2">
                                      <span>{driver.driver_name}</span>
                                      {driver.isTemporary && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Temp
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                      {driver.branches.map((branch) => (
                                        <Badge
                                          key={branch}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {branch}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Selected Drivers Display */}
                      {csvData.assignedDrivers.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">
                            Selected Drivers:
                          </Label>
                          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                            {csvData.assignedDrivers.map((driverId) => {
                              const driver = drivers.find(
                                (d) => d.id === driverId,
                              );
                              return driver ? (
                                <div
                                  key={driverId}
                                  className="flex items-center gap-2 bg-background px-3 py-2 rounded-md text-sm border"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {driver.driver_name}
                                    </span>
                                    {driver.isTemporary && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Temp
                                      </Badge>
                                    )}
                                    <div className="flex gap-1">
                                      {driver.branches.map((branch) => (
                                        <Badge
                                          key={branch}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {branch}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      removeAssignedDriver(driverId)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4">
                      <Button
                        onClick={handleAssignInvoices}
                        disabled={
                          !csvData.file || csvData.assignedDrivers.length === 0
                        }
                        className="w-full"
                        size="lg"
                      >
                        Assign Invoices to Selected Drivers
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Manage Drivers Tab */}
              <TabsContent value="drivers" className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Manage Drivers</h2>
                    <p className="text-muted-foreground">
                      Drivers & assignments
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog
                      open={createDriverModalOpen}
                      onOpenChange={setCreateDriverModalOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Driver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Driver</DialogTitle>
                          <DialogDescription>
                            Create permanent driver account
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="driver-name">
                                Driver Name{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="driver-name"
                                placeholder="Driver name"
                                value={newDriver.driver_name}
                                onChange={(e) =>
                                  setNewDriver((prev) => ({
                                    ...prev,
                                    driver_name: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email">
                                Email{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="Email"
                                value={newDriver.email}
                                onChange={(e) =>
                                  setNewDriver((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="password">
                              Password{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Password"
                              value={newDriver.password}
                              onChange={(e) =>
                                setNewDriver((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>
                              Branch Access{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Popover
                              open={branchDropdownOpen}
                              onOpenChange={setBranchDropdownOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={branchDropdownOpen}
                                  className={`w-full justify-between ${
                                    newDriver.selectedBranches.length === 0
                                      ? "border-destructive"
                                      : ""
                                  }`}
                                >
                                  {newDriver.selectedBranches.length > 0
                                    ? `${
                                        newDriver.selectedBranches.length
                                      } branch${
                                        newDriver.selectedBranches.length > 1
                                          ? "es"
                                          : ""
                                      } selected`
                                    : "Select branches..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search branches..." />
                                  <CommandEmpty>
                                    No branches found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableBranches.map((branch) => (
                                      <CommandItem
                                        key={branch.id}
                                        onSelect={() => {
                                          toggleBranchSelection(branch.id);
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            newDriver.selectedBranches.includes(
                                              branch.id,
                                            )
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {branch.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {newDriver.selectedBranches.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                {[...new Set(newDriver.selectedBranches)].map(
                                  (branchId) => {
                                    const branch = availableBranches.find(
                                      (b) => b.id === branchId,
                                    );
                                    return branch ? (
                                      <div
                                        key={branchId}
                                        className="flex items-center gap-1 bg-background px-2 py-1 rounded-md text-sm border"
                                      >
                                        {branch.name}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                          onClick={() => removeBranch(branchId)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : null;
                                  },
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={handleCreateDriver}
                            disabled={
                              !newDriver.driver_name.trim() ||
                              !newDriver.email.trim() ||
                              !newDriver.password.trim() ||
                              newDriver.selectedBranches.length === 0
                            }
                            className="w-full"
                          >
                            Create Driver
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Edit Driver Modal */}
                    <Dialog
                      open={showEditDriverModal}
                      onOpenChange={setShowEditDriverModal}
                    >
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Edit Driver
                          </DialogTitle>
                          <DialogDescription>
                            Update driver information
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-driver-name">
                                Driver Name{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="edit-driver-name"
                                placeholder="Driver name"
                                value={editDriverData.driver_name}
                                onChange={(e) =>
                                  setEditDriverData((prev) => ({
                                    ...prev,
                                    driver_name: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-driver-email">
                                Email{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="edit-driver-email"
                                type="email"
                                placeholder="Email"
                                value={editDriverData.email}
                                onChange={(e) =>
                                  setEditDriverData((prev) => ({
                                    ...prev,
                                    email: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <Label>
                              Branch Access{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <Popover
                              open={editDriverBranchDropdownOpen}
                              onOpenChange={setEditDriverBranchDropdownOpen}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={editDriverBranchDropdownOpen}
                                  className={`w-full justify-between ${
                                    editDriverData.selectedBranches.length === 0
                                      ? "border-destructive"
                                      : ""
                                  }`}
                                >
                                  {editDriverData.selectedBranches.length > 0
                                    ? `${
                                        editDriverData.selectedBranches.length
                                      } branch${
                                        editDriverData.selectedBranches.length >
                                        1
                                          ? "es"
                                          : ""
                                      } selected`
                                    : "Select branches..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-full p-0">
                                <Command>
                                  <CommandInput placeholder="Search branches..." />
                                  <CommandEmpty>
                                    No branches found.
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {availableBranches.map((branch) => (
                                      <CommandItem
                                        key={branch.id}
                                        onSelect={() => {
                                          setEditDriverData((prev) => ({
                                            ...prev,
                                            selectedBranches:
                                              prev.selectedBranches.includes(
                                                branch.id,
                                              )
                                                ? prev.selectedBranches.filter(
                                                    (b) => b !== branch.id,
                                                  )
                                                : [
                                                    ...new Set([
                                                      ...prev.selectedBranches,
                                                      branch.id,
                                                    ]),
                                                  ],
                                          }));
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            editDriverData.selectedBranches.includes(
                                              branch.id,
                                            )
                                              ? "opacity-100"
                                              : "opacity-0"
                                          }`}
                                        />
                                        {branch.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            {editDriverData.selectedBranches.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                                {[
                                  ...new Set(editDriverData.selectedBranches),
                                ].map((branchId) => {
                                  const branch = availableBranches.find(
                                    (b) => b.id === branchId,
                                  );
                                  return branch ? (
                                    <div
                                      key={branchId}
                                      className="flex items-center gap-1 bg-background px-2 py-1 rounded-md text-sm border"
                                    >
                                      {branch.name}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() =>
                                          setEditDriverData((prev) => ({
                                            ...prev,
                                            selectedBranches:
                                              prev.selectedBranches.filter(
                                                (b) => b !== branchId,
                                              ),
                                          }))
                                        }
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateDriver}
                              disabled={
                                !editDriverData?.driver_name?.trim() ||
                                !editDriverData?.email?.trim() ||
                                !editDriverData?.selectedBranches?.length
                              }
                              className="flex-1"
                              size="lg"
                            >
                              Update Driver
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowEditDriverModal(false);
                                setEditDriverData({
                                  id: "",
                                  driver_name: "",
                                  email: "",
                                  selectedBranches: [],
                                });
                              }}
                              size="lg"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* View Driver Details Modal */}
                    <Dialog
                      open={showViewDriverModal}
                      onOpenChange={setShowViewDriverModal}
                    >
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Driver Details
                          </DialogTitle>
                          <DialogDescription>
                            Driver information & assignments
                          </DialogDescription>
                        </DialogHeader>

                        {selectedDriver && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Driver Name
                                </Label>
                                <div className="p-2 bg-muted rounded text-sm">
                                  {selectedDriver.driver_name}
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Email
                                </Label>
                                <div className="p-2 bg-muted rounded text-sm">
                                  {selectedDriver.username}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Type
                                </Label>
                                <div className="p-2 bg-muted rounded text-sm">
                                  <Badge
                                    variant={
                                      selectedDriver.isTemporary
                                        ? "secondary"
                                        : "default"
                                    }
                                  >
                                    {selectedDriver.isTemporary
                                      ? "Temporary"
                                      : "Permanent"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">
                                  Created
                                </Label>
                                <div className="p-2 bg-muted rounded text-sm">
                                  {selectedDriver.created_at
                                    ? formatDate(selectedDriver.created_at)
                                    : "N/A"}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">
                                Last Login
                              </Label>
                              <div className="p-2 bg-muted rounded text-sm">
                                {selectedDriver.last_login
                                  ? formatDate(selectedDriver.last_login)
                                  : "Never"}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-600">
                                Branch Access
                              </Label>
                              <div className="flex flex-wrap gap-2 p-2 bg-muted rounded">
                                {selectedDriver.branches.length > 0 ? (
                                  selectedDriver.branches.map(
                                    (branch: string) => (
                                      <Badge key={branch} variant="outline">
                                        {branch}
                                      </Badge>
                                    ),
                                  )
                                ) : (
                                  <span className="text-sm text-muted-foreground">
                                    No branches assigned
                                  </span>
                                )}
                              </div>
                            </div>

                            {selectedDriver.isTemporary &&
                              selectedDriver.temp_password && (
                                <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <Label className="text-sm font-medium text-yellow-800">
                                    Temporary Credentials
                                  </Label>
                                  <div className="space-y-1 text-sm text-yellow-900">
                                    <p>
                                      <strong>Username:</strong>{" "}
                                      {selectedDriver.username}
                                    </p>
                                    <p>
                                      <strong>Password:</strong>{" "}
                                      <code className="bg-white px-1 py-0.5 rounded text-xs">
                                        {selectedDriver.temp_password}
                                      </code>
                                    </p>
                                  </div>
                                </div>
                              )}

                            <div className="flex gap-2 pt-4">
                              <Button
                                variant="outline"
                                onClick={() => setShowViewDriverModal(false)}
                                className="flex-1"
                                size="lg"
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button variant="outline" onClick={fetchDrivers}>
                      Refresh
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      {drivers.filter((d) => !d.isTemporary).length} permanent •{" "}
                      {drivers.filter((d) => d.isTemporary).length} temporary
                      drivers
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Drivers List</CardTitle>
                        <CardDescription>
                          All registered drivers
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Credentials</TableHead>
                              <TableHead>Branches</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Last Login</TableHead>
                              <TableHead className="w-[50px]">
                                Actions
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {drivers.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={7}
                                  className="text-center py-8 text-muted-foreground"
                                >
                                  No drivers found
                                </TableCell>
                              </TableRow>
                            ) : (
                              getPaginatedDrivers().map((driver) => (
                                <TableRow key={driver.id}>
                                  <TableCell className="font-medium">
                                    {driver.driver_name}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="text-sm">
                                        {driver.username}
                                      </div>
                                      {driver.isTemporary &&
                                        driver.temp_password && (
                                          <div className="text-xs text-muted-foreground">
                                            Password:{" "}
                                            <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                              {driver.temp_password}
                                            </code>
                                          </div>
                                        )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                      {driver.branches.map((branch) => (
                                        <Badge
                                          key={branch}
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {branch}
                                        </Badge>
                                      ))}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        driver.isTemporary
                                          ? "secondary"
                                          : "default"
                                      }
                                    >
                                      {driver.isTemporary
                                        ? "Temporary"
                                        : "Permanent"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {driver.created_at
                                      ? formatDate(driver.created_at)
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {driver.last_login
                                      ? formatDate(driver.last_login)
                                      : "Never"}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onSelect={(e) => {
                                            e.preventDefault();
                                            handleViewDriver(driver);
                                          }}
                                        >
                                          <Eye className="h-4 w-4 mr-2" />
                                          View Details
                                        </DropdownMenuItem>
                                        {!driver.isTemporary && (
                                          <DropdownMenuItem
                                            onSelect={(e) => {
                                              e.preventDefault();
                                              handleEditDriver(driver);
                                            }}
                                          >
                                            <Settings className="h-4 w-4 mr-2" />
                                            Edit Driver
                                          </DropdownMenuItem>
                                        )}
                                        {!driver.isTemporary && (
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem
                                                onSelect={(e) =>
                                                  e.preventDefault()
                                                }
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Delete Permanent Driver
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to
                                                  delete {driver.driver_name}?
                                                  This will permanently remove
                                                  the driver account and cannot
                                                  be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleDeleteDriver(
                                                      driver.id,
                                                    )
                                                  }
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        )}
                                        {driver.isTemporary && (
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <DropdownMenuItem
                                                onSelect={(e) =>
                                                  e.preventDefault()
                                                }
                                              >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>
                                                  Delete Temporary Driver
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Are you sure you want to
                                                  delete {driver.driver_name}?
                                                  This action cannot be undone.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>
                                                  Cancel
                                                </AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={() =>
                                                    handleDeleteDriver(
                                                      driver.id,
                                                    )
                                                  }
                                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                  Delete
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>

                        {/* Pagination for Drivers */}
                        {driversPagination.total_pages > 1 && (
                          <TablePagination
                            pagination={driversPagination}
                            onPageChange={handleDriverPageChange}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
