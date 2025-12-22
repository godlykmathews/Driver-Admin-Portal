import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, PenTool, Upload, Camera } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

const CustomerVisitSignature = () => {
  const { customerName, routeNumber, routeDate } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [useFileUpload, setUseFileUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 300;

    // Set drawing properties
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSignatureData(result);
    };
    reader.readAsDataURL(file);
  };

  const submitSignature = async () => {
    if (!customerName || !routeNumber || !routeDate) {
      toast.error('Invalid visit parameters');
      return;
    }

    let signatureToSubmit = signatureData;

    // If using canvas and no signature drawn, convert canvas to data URL
    if (!useFileUpload && !signatureData) {
      const canvas = canvasRef.current;
      if (canvas) {
        signatureToSubmit = canvas.toDataURL('image/png');
      }
    }

    if (!signatureToSubmit) {
      toast.error('Please provide a signature');
      return;
    }

    try {
      setLoading(true);

      // Create FormData for the signature
      const formData = new FormData();
      formData.append('signature', signatureToSubmit);
      if (notes.trim()) {
        formData.append('notes', notes.trim());
      }

      const result = await apiService.acknowledgeCustomerVisit(
        customerName,
        parseInt(routeNumber),
        routeDate,
        formData
      );

      toast.success(`Successfully acknowledged ${result.acknowledged_invoices.length} invoices for ${customerName}`);
      navigate(`/customer-visits/${customerName}/${routeNumber}/${routeDate}`);
    } catch (error) {
      console.error('Error submitting signature:', error);
      toast.error('Failed to submit signature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/customer-visits/${customerName}/${routeNumber}/${routeDate}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Capture Signature</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Customer Visit Signature
              </CardTitle>
              <p className="text-muted-foreground">
                Capture signature for all invoices in this customer visit: <strong>{customerName}</strong>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Signature Method Toggle */}
              <div className="flex gap-4">
                <Button
                  variant={!useFileUpload ? "default" : "outline"}
                  onClick={() => setUseFileUpload(false)}
                  className="flex-1"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Draw Signature
                </Button>
                <Button
                  variant={useFileUpload ? "default" : "outline"}
                  onClick={() => setUseFileUpload(true)}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>

              {/* Drawing Canvas */}
              {!useFileUpload && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full border border-gray-200 rounded cursor-crosshair"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearSignature}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* File Upload */}
              {useFileUpload && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {signatureData ? (
                      <div className="space-y-4">
                        <img
                          src={signatureData}
                          alt="Signature preview"
                          className="max-w-full max-h-32 mx-auto border border-gray-200 rounded"
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSignatureData(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-lg font-medium">Upload signature image</p>
                          <p className="text-sm text-muted-foreground">
                            PNG, JPG, or GIF files accepted
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="Add any notes about this delivery..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-12 text-base"
                onClick={submitSignature}
                disabled={loading || (!signatureData && !useFileUpload)}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <PenTool className="mr-2 h-5 w-5" />
                    Submit Signature for All Invoices
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CustomerVisitSignature;