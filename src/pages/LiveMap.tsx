import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiService, DriverLocation } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Clock,
  RefreshCw,
  Search,
  Users,
  Activity,
  AlertCircle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix for default marker icons in Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker icons for different driver statuses
const createCustomIcon = (status: "active" | "idle" | "offline") => {
  const colors = {
    active: "#22c55e",
    idle: "#f59e0b",
    offline: "#ef4444",
  };

  const color = colors[status];

  return L.divIcon({
    className: "custom-driver-marker",
    html: `
      <div style="position: relative;">
        <svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0C7.163 0 0 7.163 0 16c0 8.837 16 26 16 26s16-17.163 16-26C32 7.163 24.837 0 16 0z" 
                fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
        ${status === "active" ? '<div style="position: absolute; top: -5px; right: -5px; width: 12px; height: 12px; background: #22c55e; border: 2px solid white; border-radius: 50%; animation: pulse 2s infinite;"></div>' : ""}
      </div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

const LiveMap = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize the map
    const map = L.map(mapContainerRef.current).setView([10.8, 76.6], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add custom styles for pulse animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.2); }
      }
      .custom-driver-marker {
        background: transparent;
        border: none;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      }
      .leaflet-popup-content {
        margin: 12px;
        font-family: inherit;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, []);

  // Fetch driver locations
  const fetchDriverLocations = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await apiService.getDriversLiveLocations();
      setDrivers(response.drivers);
      setLastUpdate(new Date().toISOString());

      // Extract unique branches
      const uniqueBranches = Array.from(
        new Set(response.drivers.map((d) => d.branch_name).filter(Boolean)),
      ) as string[];
      setBranches(uniqueBranches);

      if (!isAutoRefresh) {
        toast({
          title: "Map Updated",
          description: `Loaded ${response.drivers.length} driver${response.drivers.length !== 1 ? "s" : ""}`,
        });
      }
    } catch (error) {
      console.error("Error fetching driver locations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch driver locations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDriverLocations();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDriverLocations(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter drivers
  useEffect(() => {
    let filtered = drivers;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (driver) =>
          driver.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          driver.driver_id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((driver) => driver.status === statusFilter);
    }

    // Filter by branch
    if (selectedBranch !== "all") {
      filtered = filtered.filter(
        (driver) => driver.branch_name === selectedBranch,
      );
    }

    setFilteredDrivers(filtered);
  }, [drivers, searchTerm, statusFilter, selectedBranch]);

  // Update markers on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add markers for filtered drivers
    const bounds: L.LatLngBounds[] = [];

    filteredDrivers.forEach((driver) => {
      const marker = L.marker([driver.latitude, driver.longitude], {
        icon: createCustomIcon(driver.status),
      });

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${driver.driver_name}</h3>
          <div style="font-size: 12px; color: #666; space-y: 4px;">
            <div style="margin-bottom: 4px;">
              <strong>Status:</strong> 
              <span style="color: ${driver.status === "active" ? "#22c55e" : driver.status === "idle" ? "#f59e0b" : "#ef4444"}; text-transform: capitalize;">
                ${driver.status}
              </span>
            </div>
            <div style="margin-bottom: 4px;"><strong>Last Update:</strong> ${driver.minutes_ago}m ago</div>
            ${driver.branch_name ? `<div style="margin-bottom: 4px;"><strong>Branch:</strong> ${driver.branch_name}</div>` : ""}
            ${driver.current_route ? `<div style="margin-bottom: 4px;"><strong>Route:</strong> ${driver.current_route}</div>` : ""}
            ${
              driver.deliveries_completed !== undefined
                ? `
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                <div><strong>Deliveries:</strong> ${driver.deliveries_completed} / ${(driver.deliveries_completed || 0) + (driver.deliveries_pending || 0)}</div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(mapRef.current!);
      markersRef.current[driver.driver_id] = marker;

      bounds.push(
        L.latLngBounds(
          [driver.latitude, driver.longitude],
          [driver.latitude, driver.longitude],
        ),
      );
    });

    // Fit map to show all markers
    if (bounds.length > 0 && mapRef.current) {
      const group = new L.FeatureGroup(Object.values(markersRef.current));
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [filteredDrivers]);

  // Calculate statistics
  const stats = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === "active").length,
    idle: drivers.filter((d) => d.status === "idle").length,
    offline: drivers.filter((d) => d.status === "offline").length,
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return "Never";
    const now = new Date();
    const updated = new Date(lastUpdate);
    const diffSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-64">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="border-l h-6" />
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h1 className="text-xl font-bold">Live Driver Tracking</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Last update: {formatLastUpdate()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDriverLocations()}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <Activity className="h-4 w-4 mr-2" />
                Auto-refresh {autoRefresh ? "ON" : "OFF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.active}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-amber-600" />
                Idle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {stats.idle}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                Offline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.offline}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters and Driver List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filters Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Search Driver
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Status
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch Filter */}
                {branches.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Branch
                    </Label>
                    <Select
                      value={selectedBranch}
                      onValueChange={setSelectedBranch}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Reset Filters */}
                {(searchTerm ||
                  statusFilter !== "all" ||
                  selectedBranch !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setSelectedBranch("all");
                    }}
                  >
                    Reset Filters
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Legend Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                  <span className="text-sm">Active ({"<"}5 min)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Circle className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span className="text-sm">Idle (5-15 min)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                  <span className="text-sm">Offline ({">"}15 min)</span>
                </div>
              </CardContent>
            </Card>

            {/* Driver List */}
            <Card className="max-h-96 overflow-hidden flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Drivers ({filteredDrivers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                {filteredDrivers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No drivers found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredDrivers.map((driver) => (
                      <div
                        key={driver.driver_id}
                        className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          const marker = markersRef.current[driver.driver_id];
                          if (marker && mapRef.current) {
                            mapRef.current.setView(
                              [driver.latitude, driver.longitude],
                              15,
                            );
                            marker.openPopup();
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {driver.driver_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {driver.minutes_ago}m ago
                            </div>
                          </div>
                          <Badge
                            variant={
                              driver.status === "active"
                                ? "default"
                                : driver.status === "idle"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {driver.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Live Map View</CardTitle>
                  <Badge variant="outline">
                    {filteredDrivers.length} driver
                    {filteredDrivers.length !== 1 ? "s" : ""} shown
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={mapContainerRef}
                  className="w-full h-[600px] relative"
                  style={{ background: "#f0f0f0" }}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import Label component
import { Label } from "@/components/ui/label";

export default LiveMap;
