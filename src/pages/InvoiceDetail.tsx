import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MapPin, Building, Calendar, PenTool, Wifi, WifiOff } from "lucide-react";
import { apiService, Invoice, CustomerGroupInfo } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import SignatureCanvas from 'react-signature-canvas';

const InvoiceDetail = () => {
  const { id, groupId } = useParams<{ id?: string; groupId?: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [group, setGroup] = useState<CustomerGroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const { isOnline, saveSignature, getCachedGroups } = useOfflineSync();

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    if (groupId) {
      loadGroupDetail();
    } else if (id) {
      fetchInvoiceDetail();
    }
  }, [id, groupId, navigate]);

  const loadGroupDetail = async () => {
    console.log('🔍 loadGroupDetail called with groupId:', groupId);
    console.log('📡 isOnline:', isOnline);

    try {
      if (!groupId) {
        console.log('❌ No groupId provided');
        return;
      }

      // Load from cache
      console.log('📦 Loading from cache...');
      const cached = await getCachedGroups();
      console.log('📦 Cached data:', cached);

      if (cached && cached.groups) {
        const found = cached.groups.find((g: CustomerGroupInfo) => g.customer_visit_group === groupId);
        console.log('🔍 Found group in cache:', found);

        if (found) {
          setGroup(found);
          console.log('✅ Group loaded from cache successfully');
        } else {
          console.log('❌ Group not found in cache, available groups:', cached.groups.map(g => g.customer_visit_group));
          toast.error('Group not found in cache');
          navigate('/invoices');
        }
      } else {
        console.log('❌ No cached data available');
        toast.error('No cached data available - please load data while online');
        navigate('/invoices');
      }
    } catch (error) {
      console.error('❌ Error loading group detail:', error);
      toast.error('Failed to load group details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoiceDetail = async () => {
    try {
      if (!id) {
        toast.error('Invalid invoice id');
        navigate('/invoices');
        return;
      }

      const data = await apiService.getInvoiceById(id);
      if (data) {
        setInvoice(data);
      } else {
        toast.error('Invoice not found');
        navigate('/invoices');
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching invoice detail', error);
      toast.error('Failed to load invoice details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSignature = async () => {
    if (!sigCanvas.current) return;

    const canvas = sigCanvas.current.getCanvas();
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const targetId = groupId || id;
      if (!targetId) return;

      try {
        if (isOnline) {
          const formData = new FormData();
          formData.append('signature', blob);
          if (groupId) {
            await apiService.uploadSignature(groupId, formData);
          } else if (id) {
            await apiService.submitSignature(id, formData);
          }
          toast.success('Signature submitted successfully');
        } else {
          await saveSignature(targetId, blob);
          toast.success('Signature saved locally - will sync when online');
        }
        navigate('/invoices');
      } catch (error) {
        console.error('Error saving signature', error);
        toast.error('Failed to save signature');
      }
    });
  };

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  if (loading || (!invoice && !group)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{group ? 'Customer Details' : 'Invoice Details'}</h1>
          <div className="flex items-center gap-1 ml-auto">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        {group && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{group.customer_name}</CardTitle>
                  <p className="text-muted-foreground mt-1">Group: {group.customer_visit_group}</p>
                </div>
                <Badge variant={group.status === "delivered" ? "success" : "warning"} className="text-sm px-3 py-1">
                  {group.status === "delivered" ? "Delivered" : "Pending"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-xl font-bold text-primary">₹{group.total_amount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Branch</p>
                    <p className="text-base font-semibold">{group.branch || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Invoices</p>
                    <p className="text-base">{group.invoice_count} {group.invoice_count === 1 ? 'invoice' : 'invoices'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Route</p>
                    <p className="text-base">{group.route_display || `Route ${group.route_number}`}</p>
                  </div>
                </div>
              </div>

              {group.invoice_numbers && group.invoice_numbers.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Invoice Numbers</p>
                  <div className="flex flex-wrap gap-2">
                    {group.invoice_numbers.map((num, index) => (
                      <Badge key={index} variant="outline">{num}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {invoice && (
          <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{invoice.customer_name || invoice.shop_name || 'N/A'}</CardTitle>
                <p className="text-muted-foreground mt-1">Invoice #{invoice.invoice_number || invoice.invoice_id || 'N/A'}</p>
              </div>
              <Badge variant={invoice.is_acknowledged || invoice.status === "Delivered" || invoice.status === "delivered" ? "success" : "warning"} className="text-sm px-3 py-1">
                {invoice.is_acknowledged || invoice.status === "Delivered" || invoice.status === "delivered" ? "Delivered" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {invoice.shop_address && (
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{invoice.shop_address}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-xl font-bold text-primary">₹{invoice.amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Branch</p>
                  <p className="text-base font-semibold">{invoice.branch || invoice.branch_name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Driver</p>
                  <p className="text-base">{invoice.driver || 'N/A'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Invoice Date</p>
                  <p className="text-base">{invoice.invoice_date ? formatDate(invoice.invoice_date) : 'N/A'}</p>
                </div>
              </div>

              {invoice.created_date && (
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Created Date</p>
                    <p className="text-base">{formatDate(invoice.created_date)}</p>
                  </div>
                </div>
              )}

              {invoice.delivery_date && (
                <div className="flex gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Delivery Date</p>
                    <p className="text-base">{formatDate(invoice.delivery_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        <div className="space-y-3">
          {/* Show Capture Signature button only if not acknowledged */}
          {!invoice?.is_acknowledged && !group && (
            <Button
              className="w-full h-14 text-base"
              onClick={() => navigate(`/signature/${invoice?.id}`)}
            >
              <PenTool className="mr-2 h-5 w-5" />
              Capture Signature
            </Button>
          )}

          {/* Show View PDF button only if acknowledged and PDF URL exists */}
          {invoice?.is_acknowledged && invoice.pdf_url && (
            <Button
              variant="outline"
              className="w-full h-14 text-base"
              onClick={() => window.open(invoice.pdf_url, '_blank')}
            >
              <FileText className="mr-2 h-5 w-5" />
              View PDF Acknowledgement
            </Button>
          )}

          {/* Signature for groups */}
          {group && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signature</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'w-full h-48 border border-muted-foreground/25 rounded',
                      style: { cursor: 'crosshair' }
                    }}
                    backgroundColor="white"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={clearSignature}>
                    Clear
                  </Button>
                  <Button onClick={handleSignature}>
                    <PenTool className="mr-2 h-4 w-4" />
                    {isOnline ? 'Submit Signature' : 'Save Locally'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default InvoiceDetail;
