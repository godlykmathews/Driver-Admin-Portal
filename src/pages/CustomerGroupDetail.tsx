import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ArrowLeft, Loader2, FileText, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { apiService, CustomerGroupDetail as CustomerGroupDetailType, Invoice } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const CustomerGroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [groupDetail, setGroupDetail] = useState<CustomerGroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  // Use offline sync hook
  const { isOnline, getCachedGroups } = useOfflineSync();

  useEffect(() => {
    if (groupId) {
      fetchGroupDetail();
    }
  }, [groupId]);

  const fetchGroupDetail = async () => {
    if (!groupId) return;
    
    try {
      setLoading(true);
      console.log('🔍 fetchGroupDetail called for groupId:', groupId);
      console.log('📡 isOnline:', isOnline);

      if (!isOnline) {
        // Load from cache when offline
        console.log('📦 Loading group detail from cache...');
        const cached = await getCachedGroups();
        console.log('📦 Cached groups data:', cached);

        if (cached && cached.groups) {
          // For offline, we need to construct a CustomerGroupDetail from the cached group data
          // Since the cached data has the basic info, we'll create a minimal detail object
          const group = cached.groups.find((g: any) => g.customer_visit_group === groupId);
          console.log('🔍 Found cached group:', group);

          if (group) {
            // Create a CustomerGroupDetail-like object from cached data
            const detail: CustomerGroupDetailType = {
              customer_visit_group: group.customer_visit_group,
              customer_name: group.customer_name,
              shop_address: group.shop_address,
              route_number: group.route_number,
              route_name: group.route_name,
              route_display: group.route_display,
              invoices: [], // We don't have individual invoices in cache
              total_amount: group.total_amount,
              invoice_count: group.invoice_count,
              all_acknowledged: group.status === 'delivered',
              branch: group.branch
            };
            setGroupDetail(detail);
            console.log('✅ Group detail loaded from cache successfully');
            return;
          } else {
            console.log('❌ Group not found in cache');
            toast.error('Group not found in cache - please load data while online');
            navigate('/invoices');
            return;
          }
        } else {
          console.log('❌ No cached data available');
          toast.error('No cached data available - please load data while online');
          navigate('/invoices');
          return;
        }
      }

      // Online: fetch from API
      console.log('🌐 Fetching group detail from API...');
      const detail = await apiService.getCustomerGroupDetail(groupId);
      setGroupDetail(detail);
      console.log('✅ Group detail loaded from API successfully');
    } catch (error) {
      console.error('❌ Failed to fetch group detail:', error);
      toast.error('Failed to load customer invoices');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureSignature = () => {
    if (!groupId) return;
    navigate(`/customer-group/${groupId}/signature`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!groupDetail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="py-12">
            <p className="text-lg text-muted-foreground">Customer group not found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate('/invoices')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/invoices')}
            className="mb-2 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{groupDetail.customer_name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                {groupDetail.route_display && (
                  <Badge variant="outline" className="text-xs">{groupDetail.route_display}</Badge>
                )}
                {groupDetail.branch && (
                  <span className="text-sm text-muted-foreground">{groupDetail.branch}</span>
                )}
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-3 w-3 text-green-500" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            {!groupDetail.all_acknowledged && (
              <Button 
                size="default"
                onClick={handleCaptureSignature}
                className="gap-2 self-start sm:self-auto"
              >
                <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Capture Signature</span>
                <span className="sm:hidden">Sign</span>
              </Button>
            )}
            {groupDetail.all_acknowledged && (
              <div className="flex items-center gap-2 text-green-600 self-start sm:self-auto">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="font-semibold text-sm sm:text-base">All Invoices Delivered</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-lg sm:text-xl">
              <span>Invoices ({groupDetail.invoice_count})</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                Total: ₹{groupDetail.total_amount.toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Mobile Card View */}
            <div className="block sm:hidden space-y-3 p-4">
              {groupDetail.invoices.map((invoice) => (
                <div key={invoice.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{invoice.invoice_number}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(invoice.invoice_date)}</p>
                    </div>
                    <Badge variant={invoice.is_acknowledged ? "success" : "warning"} className="text-xs">
                      {invoice.is_acknowledged ? "Delivered" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="font-bold text-lg">₹{invoice.amount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
              <div className="border-t-2 border-border pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-base">Total Amount</span>
                  <span className="font-bold text-xl text-primary">₹{groupDetail.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupDetail.invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.invoice_date)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₹{invoice.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={invoice.is_acknowledged ? "success" : "warning"}>
                          {invoice.is_acknowledged ? "Delivered" : "Pending"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-semibold">
                      Total Amount
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      ₹{groupDetail.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>

        {!groupDetail.all_acknowledged && (
          <div className="mt-6 text-center">
            <Button 
              size="lg"
              onClick={handleCaptureSignature}
              className="gap-2 w-full sm:w-auto"
            >
              <FileText className="h-5 w-5" />
              Capture Signature for All Invoices
            </Button>
            <p className="text-sm text-muted-foreground mt-2 px-4">
              One signature will acknowledge all {groupDetail.invoice_count} invoices
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerGroupDetail;
