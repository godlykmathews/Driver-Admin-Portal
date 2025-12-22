import { useRef, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RefreshCw, Check, Loader2, Camera, Upload, X } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";

const SignatureCapture = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [signedBy, setSignedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  // Photo capture states - simplified
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    const token = apiService.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing styles
    ctx.strokeStyle = "#0066CC";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [navigate]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas and reset white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Simplified photo handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      toast.success('Photo selected successfully!');
    } else if (file) {
      toast.error('Please select a valid image file.');
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      toast.success('Photo captured successfully!');
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview('');
  };

  const handleSubmit = async () => {
    if (!hasDrawn) {
      toast.error("Please provide a signature first");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setLoading(true);

    try {
      // Convert canvas to blob
      const signatureBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png");
      });

      // Create FormData to match API specification
      const formData = new FormData();
      
      // signature_file is required (string($binary))
      formData.append('signature_file', signatureBlob, 'signature.png');
      
      // notes is optional (string | null) - using signedBy field
      if (signedBy.trim()) {
        formData.append('notes', signedBy.trim());
      } else {
        formData.append('notes', ''); // Send empty value as specified
      }
      
      // photo_file is optional (string | null($binary))
      if (photo) {
        formData.append('photo_file', photo);
      }

      const response = await apiService.submitSignature(id!, formData);
      toast.success(response.message || "Signature and photo submitted successfully!");
      navigate(`/confirmation/${id}`, { state: { pdfUrl: response.pdf_url } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit signature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/invoice/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Capture Signature</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Shop Staff Signature</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>name - signature pad</Label>
              <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-card">
                {/* Name input at the top of signature pad */}
                <div className="p-3 border-b border-border bg-muted/30">
                  <Input
                    id="signedBy"
                    type="text"
                    placeholder="Enter name here"
                    value={signedBy}
                    onChange={(e) => setSignedBy(e.target.value)}
                    disabled={loading}
                    className="h-10 text-sm"
                  />
                </div>
                {/* Signature canvas below */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-64 touch-none cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={clearCanvas}
              disabled={loading || !hasDrawn}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Signature
            </Button>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Photo (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!photo && (
              <div className="flex flex-col gap-3">
                {/* Camera capture - uses device's native camera */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraCapture}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="camera-capture"
                  />
                  <Button
                    type="button"
                    variant="default"
                    disabled={loading}
                    className="flex items-center gap-2 w-full h-12"
                    asChild
                  >
                    <label htmlFor="camera-capture" className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                      Take Photo with Camera
                    </label>
                  </Button>
                </div>

                {/* File upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2 w-full h-12"
                    asChild
                  >
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload from Gallery
                    </label>
                  </Button>
                </div>
              </div>
            )}

            {photoPreview && (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Delivery photo"
                    className="w-full max-h-80 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removePhoto}
                    disabled={loading}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Photo ready for upload
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full h-14 text-base"
          onClick={handleSubmit}
          disabled={loading || !hasDrawn}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              {photo ? 'Submit Signature & Photo' : 'Submit Signature'}
            </>
          )}
        </Button>
      </main>
    </div>
  );
};

export default SignatureCapture;
