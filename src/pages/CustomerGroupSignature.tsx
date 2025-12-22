import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SignaturePad from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save, RotateCcw, CheckCircle, Wifi, WifiOff } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const CustomerGroupSignature = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const signaturePadRef = useRef<SignaturePad>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isOfflineSave, setIsOfflineSave] = useState(false);

  // Use offline sync hook
  const { isOnline, saveSignature } = useOfflineSync();

  useEffect(() => {
    if (groupId) {
      // Fetch customer name for display
      fetchCustomerName();
    }
  }, [groupId]);

  const fetchCustomerName = async () => {
    if (!groupId) return;
    try {
      const detail = await apiService.getCustomerGroupDetail(groupId);
      setCustomerName(detail.customer_name);
    } catch (error) {
      console.error('Failed to fetch customer name', error);
    }
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const handleSubmit = async () => {
    if (!groupId) return;

    if (signaturePadRef.current?.isEmpty()) {
      toast.error("Please provide a signature");
      return;
    }

    try {
      setSubmitting(true);

      // Convert signature to blob
      const signatureDataURL = signaturePadRef.current?.toDataURL("image/png");
      if (!signatureDataURL) {
        toast.error("Failed to capture signature");
        return;
      }

      // Convert data URL to blob
      const response = await fetch(signatureDataURL);
      const blob = await response.blob();

      if (!isOnline) {
        // Save signature locally when offline
        console.log('📦 Saving signature locally (offline mode)');
        await saveSignature(groupId, blob, notes);
        setIsOfflineSave(true);
        toast.success("Signature saved locally! Will sync when online.");
        setShowSuccessDialog(true);
        return;
      }

      // Online: submit to backend
      console.log('🌐 Submitting signature to backend (online mode)');
      const formData = new FormData();
      formData.append("signature", blob, "signature.png");
      if (notes) {
        formData.append("notes", notes);
      }

      await apiService.acknowledgeGroup(groupId, formData);

      setIsOfflineSave(false);
      toast.success("All invoices acknowledged successfully!");
      setShowSuccessDialog(true);
    } catch (error: any) {
      console.error("Failed to acknowledge group", error);
      toast.error(error.message || "Failed to acknowledge invoices");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    navigate("/invoices");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/customer-group/${groupId}`)}
            className="mb-2"
            disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Capture Signature</h1>
              {customerName && (
                <p className="text-sm text-muted-foreground mt-1">
                  Customer: {customerName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 self-start sm:self-auto">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder=""
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-white">
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: "w-full h-64 touch-none",
                }}
                backgroundColor="rgb(255, 255, 255)"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={clearSignature}
                className="flex-1"
                disabled={submitting}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Signature
              </Button>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Acknowledge Invoices
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-green-900">
              {isOfflineSave ? "Signature Saved!" : "Success!"}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {isOfflineSave 
                ? "Your signature has been saved locally and will be synced automatically when you reconnect to the internet."
                : "All invoices have been acknowledged successfully."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <Button onClick={handleSuccessDialogClose} className="w-full">
              {isOfflineSave ? "Continue Working Offline" : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerGroupSignature;
