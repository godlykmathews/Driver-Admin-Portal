// API service: communicates with backend endpoints

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "driver" | "admin" | "super_admin";
  branches: string[];
  is_active: boolean;
}

export interface Invoice {
  id: string;
  invoice_id?: string;
  invoice_number?: string;
  shop_name?: string;
  customer_name?: string;
  shop_address?: string;
  amount: number;
  status: "Pending" | "Delivered" | "pending" | "delivered";
  branch_name?: string;
  branch?: string;
  driver?: string;
  delivery_date?: string;
  invoice_date?: string;
  created_date?: string;
  pdf_url?: string;
  is_acknowledged?: boolean;
  // NEW ROUTE FIELDS
  route_number?: number;
  route_name?: string;
  route_display?: string;
}

export interface RouteInfo {
  route_number: number;
  route_name?: string;
  route_display: string;
  invoice_count: number;
  driver_name: string;
  created_date: string;
}

export interface RoutesResponse {
  routes: RouteInfo[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface InvoiceResponse {
  invoices: Invoice[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
  total?: number;
  page?: number;
  per_page?: number;
  total_pages?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CustomerVisit {
  customer_name: string;
  route_number?: number;
  route_name?: string;
  route_display?: string;
  route_date: string;
  invoice_count: number;
  total_amount: number;
  acknowledged_count: number;
  is_fully_acknowledged: boolean;
  invoice_ids: number[];
}

export interface CustomerVisitsResponse {
  visits: CustomerVisit[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
}

export interface CustomerVisitDetail {
  customer_name: string;
  route_display: string;
  route_date: string;
  total_amount: number;
  acknowledged_count: number;
  total_count: number;
  invoices: Invoice[];
}

// New Grouped Invoice Interfaces
export interface CustomerGroupInfo {
  customer_visit_group: string;
  customer_name: string;
  shop_address?: string;
  route_number?: number;
  route_name?: string;
  route_display?: string;
  invoice_count: number;
  total_amount: number;
  status: string;
  first_invoice_id: number;
  invoice_numbers: string[];
  sequence_order: number;
  branch?: string;
}

export interface GroupedInvoicesResponse {
  groups: CustomerGroupInfo[];
  total_groups: number;
  pending_groups: number;
  delivered_groups: number;
}

export interface CustomerGroupDetail {
  customer_visit_group: string;
  customer_name: string;
  shop_address?: string;
  route_number?: number;
  route_name?: string;
  route_display?: string;
  invoices: Invoice[];
  total_amount: number;
  invoice_count: number;
  all_acknowledged: boolean;
  branch?: string;
}

export interface DriverLocation {
  driver_id: string;
  driver_name: string;
  latitude: number;
  longitude: number;
  last_updated: string;
  minutes_ago: number;
  status: "active" | "idle" | "offline";
  branch_name?: string;
  current_route?: string;
  deliveries_completed?: number;
  deliveries_pending?: number;
}

export interface DriversLiveResponse {
  drivers: DriverLocation[];
  timestamp: string;
  total_drivers: number;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("auth_token");
    }
    return this.token;
  }

  logout() {
    this.token = null;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("driver_name");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_branches");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("is_active");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {};

    // Only set Content-Type to application/json if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Add any additional headers from options
    Object.assign(headers, options.headers || {});

    const token = this.getToken();
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || "Request failed");
    }

    if (response.status === 204) return null;
    return response.json();
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(err.message || "Login failed");
    }

    const data = await res.json();
    if (data.token) this.setToken(data.token);
    return { token: data.token, user: data.user };
  }

  // Admin endpoints
  async getDrivers(): Promise<any[]> {
    const result = await this.request("/api/v1/drivers");
    // Handle response format: {"drivers": [...]}
    if (result && typeof result === "object" && Array.isArray(result.drivers)) {
      return result.drivers;
    }
    return Array.isArray(result) ? result : [];
  }

  async getBranches(): Promise<any[]> {
    const result = await this.request("/api/v1/branches");
    // Handle response format: {"branches": [...]}
    if (
      result &&
      typeof result === "object" &&
      Array.isArray(result.branches)
    ) {
      return result.branches;
    }
    return Array.isArray(result) ? result : [];
  }

  async getAdmins(): Promise<any[]> {
    const result = await this.request("/api/v1/admins");
    // Handle response format: {"admins": [...]}
    if (result && typeof result === "object" && Array.isArray(result.admins)) {
      return result.admins;
    }
    return Array.isArray(result) ? result : [];
  }

  async createAdmin(adminData: {
    name: string;
    password: string;
    email: string;
    branch_id: string;
  }): Promise<any> {
    return this.request("/api/v1/admins", {
      method: "POST",
      body: JSON.stringify(adminData),
    });
  }

  async createDriver(driverData: {
    driver_name: string;
    email: string;
    password: string;
    branch_ids: string[]; // branch IDs
    isTemporary?: boolean;
  }): Promise<any> {
    return this.request("/api/v1/drivers", {
      method: "POST",
      body: JSON.stringify(driverData),
    });
  }

  async createTemporaryDriver(branchIds: string[]): Promise<any> {
    return this.request("/api/v1/drivers/temporary", {
      method: "POST",
      body: JSON.stringify({ branch_ids: branchIds }),
    });
  }

  async createBranch(branchData: {
    name: string;
    city: string;
    phone: string;
    email: string;
  }): Promise<any> {
    return this.request("/api/v1/branches", {
      method: "POST",
      body: JSON.stringify(branchData),
    });
  }

  // Admin invoices
  async getInvoicesAdmin(filters?: {
    status_filter?: string;
    from_date?: string;
    to_date?: string;
    driver_id?: string;
    search?: string;
    branch_id?: string;
    route_number?: number;
    route_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<InvoiceResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/invoices?${queryString}`
      : "/api/v1/invoices";

    const result = await this.request(endpoint);
    // Handle response format: {"invoices": [...], "pagination": {...}}
    if (
      result &&
      typeof result === "object" &&
      Array.isArray(result.invoices)
    ) {
      return result as InvoiceResponse;
    }
    // Fallback for old format
    return { invoices: Array.isArray(result) ? result : [] };
  }

  // Driver invoices (for driver role)
  async getDriverInvoices(filters?: {
    status_filter?: string;
    from_date?: string;
    to_date?: string;
    search?: string;
    route_number?: number;
    route_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<InvoiceResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/invoices?${queryString}`
      : "/api/v1/invoices";

    const result = await this.request(endpoint);
    // Handle response format: {"invoices": [...], "total": ..., "page": ...}
    if (
      result &&
      typeof result === "object" &&
      Array.isArray(result.invoices)
    ) {
      return result as InvoiceResponse;
    }
    // Fallback for old format
    return { invoices: Array.isArray(result) ? result : [] };
  }

  async submitSignature(invoiceId: string, formData: FormData) {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/invoices/${invoiceId}/acknowledge`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser handle it for FormData
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to submit signature");
    }

    return response.json();
  }

  // Fetch single invoice by ID
  async getInvoiceById(invoiceId: string): Promise<Invoice> {
    const result = await this.request(`/api/v1/invoices/${invoiceId}`);
    // API might return { invoice: {...} } or the invoice object directly
    if (result && typeof result === "object") {
      if (
        (result as any).invoice &&
        typeof (result as any).invoice === "object"
      ) {
        return (result as any).invoice as Invoice;
      }
      // Sometimes backend returns the invoice object directly
      return result as Invoice;
    }
    throw new Error("Invoice not found");
  }

  async uploadCSV(
    driverId: string,
    file: File,
    routeName?: string,
    routeDate?: string,
    selectedRoute?: string,
  ): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);

    let url = `/api/v1/invoices/upload-csv?driver_id=${driverId}`;
    if (routeName && routeName.trim()) {
      url += `&route_name=${encodeURIComponent(routeName.trim())}`;
    }
    if (routeDate && routeDate.trim()) {
      url += `&route_date=${encodeURIComponent(routeDate.trim())}`;
    }
    if (selectedRoute && selectedRoute.trim()) {
      url += `&selected_route=${encodeURIComponent(selectedRoute.trim())}`;
    }

    return this.request(url, {
      method: "POST",
      body: formData,
    });
  }

  async previewInvoicePDF(invoiceId: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/admin/invoices/${invoiceId}/preview-pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to preview invoice PDF");
    }

    // Return the PDF URL or blob URL for preview
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async downloadInvoicePDF(invoiceId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/invoices/${invoiceId}/download-pdf`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to download invoice PDF");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }

  async bulkDownloadPDFs(invoiceIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/bulk-download-pdfs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoice_ids: invoiceIds }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Bulk download failed" }));
      throw new Error(error.message || "Bulk download failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Create download link for the zip file
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoices-bulk-${new Date().toISOString().split("T")[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }

  async downloadRouteWisePDF(filters: {
    route_name?: string;
    driver_id?: number;
    date?: string;
    branch_id?: number;
  }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/route-wise-pdf`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.getToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Route PDF generation failed" }));
      throw new Error(error.message || "Route PDF generation failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Create download link for the PDF file
    const link = document.createElement("a");
    link.href = url;
    const routeName = filters.route_name || "route";
    const date = filters.date || new Date().toISOString().split("T")[0];
    link.download = `route-summary-${routeName}-${date}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  }

  async getAvailableRoutes(
    date: string,
    driverId?: string,
  ): Promise<RouteInfo[]> {
    let url = `/api/v1/available-routes?route_date=${date}`;
    if (driverId) {
      url += `&driver_id=${driverId}`;
    }
    const result = await this.request(url);
    // Handle response format: {"routes": [...]}
    if (result && typeof result === "object" && Array.isArray(result.routes)) {
      return result.routes as RouteInfo[];
    }
    return [];
  }

  async getRoutes(filters?: {
    driver_id?: string;
    route_date?: string;
    page?: number;
    per_page?: number;
  }): Promise<RoutesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/routes?${queryString}`
      : "/api/v1/routes";

    const result = await this.request(endpoint);
    // Handle response format: {"routes": [...], "pagination": {...}}
    if (result && typeof result === "object" && Array.isArray(result.routes)) {
      return result as RoutesResponse;
    }
    return {
      routes: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 20,
      },
    };
  }

  // Customer Visit endpoints
  async getCustomerVisits(filters?: {
    route_date?: string;
    route_number?: number;
    page?: number;
    per_page?: number;
  }): Promise<CustomerVisitsResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/customer-visits?${queryString}`
      : "/api/v1/customer-visits";

    const result = await this.request(endpoint);
    // Handle response format: {"visits": [...], "pagination": {...}}
    if (result && typeof result === "object" && Array.isArray(result.visits)) {
      return result as CustomerVisitsResponse;
    }
    return {
      visits: [],
      pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 20,
      },
    };
  }

  async getCustomerVisitDetail(
    customerName: string,
    routeNumber: number,
    routeDate: string,
  ): Promise<CustomerVisitDetail> {
    const encodedCustomerName = encodeURIComponent(customerName);
    const result = await this.request(
      `/api/v1/customer-visits/${encodedCustomerName}/${routeNumber}/${routeDate}`,
    );
    return result as CustomerVisitDetail;
  }

  async acknowledgeCustomerVisit(
    customerName: string,
    routeNumber: number,
    routeDate: string,
    formData: FormData,
  ): Promise<any> {
    const encodedCustomerName = encodeURIComponent(customerName);
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/customer-visits/${encodedCustomerName}/${routeNumber}/${routeDate}/acknowledge`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser handle it for FormData
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to acknowledge customer visit",
      );
    }

    return response.json();
  }

  // New Grouped Invoice Methods
  async getGroupedInvoices(filters?: {
    route_number?: number;
    status?: string;
    search?: string;
    created_date?: string;
  }): Promise<GroupedInvoicesResponse> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/invoices-grouped?${queryString}`
      : "/api/v1/invoices-grouped";

    const result = await this.request(endpoint);
    if (result && typeof result === "object" && Array.isArray(result.groups)) {
      return result as GroupedInvoicesResponse;
    }
    return {
      groups: [],
      total_groups: 0,
      pending_groups: 0,
      delivered_groups: 0,
    };
  }

  async getCustomerGroupDetail(groupId: string): Promise<CustomerGroupDetail> {
    const encodedGroupId = encodeURIComponent(groupId);
    const result = await this.request(
      `/api/v1/customer-group/${encodedGroupId}`,
    );
    return result as CustomerGroupDetail;
  }

  async acknowledgeGroup(groupId: string, formData: FormData): Promise<any> {
    const encodedGroupId = encodeURIComponent(groupId);
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(
      `${API_BASE_URL}/api/v1/acknowledge-group/${encodedGroupId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser handle it for FormData
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to acknowledge group");
    }

    return response.json();
  }

  async uploadSignature(
    customerVisitGroup: string,
    formData: FormData,
  ): Promise<any> {
    return this.acknowledgeGroup(customerVisitGroup, formData);
  }

  async updateAdmin(
    adminId: string,
    adminData: { name?: string; email?: string; branch_id?: string },
  ): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/admins/${adminId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update admin");
    }

    return response.json();
  }

  async updateDriver(
    driverId: string,
    driverData: { driver_name?: string; email?: string; branch_ids?: string[] },
  ): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/drivers/${driverId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(driverData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to update driver");
    }

    return response.json();
  }

  async deleteDriver(driverId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/drivers/${driverId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete driver");
    }

    return response.json();
  }

  async deleteAdmin(adminId: string): Promise<any> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/admins/${adminId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete admin");
    }

    return response.json();
  }

  // Driver Routes Methods
  async getDriverRoutes(
    createdDate?: string,
  ): Promise<{ routes: Array<{ route_number: number; route_name: string }> }> {
    const params = new URLSearchParams();
    if (createdDate) {
      params.append("created_date", createdDate);
    }
    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/v1/driver-routes?${queryString}`
      : "/api/v1/driver-routes";

    const result = await this.request(endpoint);
    if (result && typeof result === "object" && Array.isArray(result.routes)) {
      return result as {
        routes: Array<{ route_number: number; route_name: string }>;
      };
    }
    return { routes: [] };
  }

  // Live Driver Locations
  async getDriversLiveLocations(): Promise<DriversLiveResponse> {
    const result = await this.request("/api/v1/admin/drivers/live");
    if (result && typeof result === "object" && Array.isArray(result.drivers)) {
      // Normalize backend schema → frontend schema
      // Backend: { drivers: [{driver_id, driver_name, latitude, longitude, accuracy, updated_at, minutes_ago}], total: int }
      // Frontend expects: { drivers: [{...status, last_updated, branch_name}], total_drivers, timestamp }
      const normalized: DriverLocation[] = result.drivers.map(
        (d: {
          driver_id: string;
          driver_name: string;
          latitude: number;
          longitude: number;
          accuracy?: number;
          updated_at: string;
          minutes_ago: number;
          branch_name?: string;
          current_route?: string;
          deliveries_completed?: number;
          deliveries_pending?: number;
        }) => ({
          driver_id: d.driver_id,
          driver_name: d.driver_name,
          latitude: d.latitude,
          longitude: d.longitude,
          last_updated: d.updated_at,
          minutes_ago: d.minutes_ago,
          // Compute status from minutes_ago: <2m active, 2-10m idle, >10m offline
          status:
            d.minutes_ago < 2
              ? "active"
              : d.minutes_ago <= 10
                ? "idle"
                : "offline",
          branch_name: d.branch_name,
          current_route: d.current_route,
          deliveries_completed: d.deliveries_completed,
          deliveries_pending: d.deliveries_pending,
        }),
      );
      return {
        drivers: normalized,
        timestamp: new Date().toISOString(),
        total_drivers: result.total ?? normalized.length,
      };
    }
    return {
      drivers: [],
      timestamp: new Date().toISOString(),
      total_drivers: 0,
    };
  }
}

export const apiService = new ApiService();
