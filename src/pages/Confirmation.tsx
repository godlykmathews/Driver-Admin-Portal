import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, Home } from "lucide-react";

const Confirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const pdfUrl = location.state?.pdfUrl;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Signature Submitted!</h1>
              <p className="text-muted-foreground">
                PDF generated successfully.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pdfUrl && (
              <Button
                variant="outline"
                className="w-full h-14 text-base"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <FileText className="mr-2 h-5 w-5" />
                View PDF
              </Button>
            )}

            <Button
              className="w-full h-14 text-base"
              onClick={() => navigate("/invoices")}
            >
              <Home className="mr-2 h-5 w-5" />
              Back to Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
