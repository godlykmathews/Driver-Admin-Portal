import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, MapPin, Building, Calendar, PenTool, CheckCircle } from "lucide-react";
import { apiService, CustomerVisitDetail as CustomerVisitDetailType, Invoice } from "@/lib/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const CustomerVisitDetail = () => {
  const { customerName, routeNumber, routeDate } = useParams();
  const navigate = useNavigate();
  const [visitDetail, setVisitDetail] = useState<CustomerVisitDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchVisitDetail();
  }, [customerName, routeNumber, routeDate, navigate]);

  const fetchVisitDetail = async () => {
    try {
      if (!customerName || !routeNumber || !routeDate) {
        toast.error('Invalid visit parameters');
        navigate('/invoices');
        return;
      }

      const data = await apiService.getCustomerVisitDetail(customerName, parseInt(routeNumber), routeDate);
      if (data) {
        setVisitDetail(data);
      } else {
        toast.error('Customer visit not found');
        navigate('/invoices');
      }
    } catch (error) {
      console.error('Error fetching visit detail', error);
      toast.error('Failed to load visit details');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureCapture = () => {
    navigate(`/customer-visits/${customerName}/${routeNumber}/${routeDate}/signature`);
  };

  if (loading || !visitDetail) {
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
          <h1 className="text-xl font-bold">Customer Visit Details</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{visitDetail.customer_name}</CardTitle>
                <p className="text-muted-foreground mt-1">{visitDetail.route_display}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {visitDetail.acknowledged_count} of {visitDetail.total_count} invoices acknowledged
                </p>
              </div>
              <Badge variant={visitDetail.acknowledged_count === visitDetail.total_count ? "success" : "warning"} className="text-sm px-3 py-1">
                {visitDetail.acknowledged_count === visitDetail.total_count ? "Completed" : "Pending"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-primary">₹{visitDetail.total_amount.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Visit Date</p>
                  <p className="text-base">{formatDate(visitDetail.route_date)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoices ({visitDetail.total_count})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {visitDetail.invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {invoice.is_acknowledged ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                        )}
                        <span className="font-medium">{invoice.invoice_number}</span>
                      </div>
                      <Badge variant={invoice.is_acknowledged ? "success" : "secondary"} className="text-xs">
                        {invoice.is_acknowledged ? "Acknowledged" : "Pending"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ₹{invoice.amount.toFixed(2)} • {formatDate(invoice.invoice_date)}
                    </p>
                  </div>
                  {invoice.is_acknowledged && invoice.pdf_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(invoice.pdf_url, '_blank')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {/* Show Capture Signature button only if not all invoices are acknowledged */}
          {visitDetail.acknowledged_count < visitDetail.total_count && (
            <Button
              className="w-full h-14 text-base"
              onClick={handleSignatureCapture}
            >
              <PenTool className="mr-2 h-5 w-5" />
              Capture Signature for All Invoices
            </Button>
          )}

          {/* Show success message if all are acknowledged */}
          {visitDetail.acknowledged_count === visitDetail.total_count && (
            <div className="w-full p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-800 font-medium">All invoices in this visit have been acknowledged!</p>
              <p className="text-green-600 text-sm mt-1">Individual PDFs are available for each invoice.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerVisitDetail;