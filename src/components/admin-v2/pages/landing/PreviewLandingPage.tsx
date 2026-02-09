import { useState } from "react";
import { AdminPageContainer } from "../../components/AdminPageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, Monitor, Smartphone, Tablet, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PreviewLandingPage() {
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [refreshKey, setRefreshKey] = useState(0);

  const viewportWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const previewUrl = "/app/admin/landing-preview";

  return (
    <AdminPageContainer title="Preview da Landing Page" description="Landing Page › Preview">
      <div className="space-y-4">
        {/* Controls */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Preview Mode</Badge>
                <span className="text-sm text-muted-foreground">
                  Visualizando versão draft (não publicada)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewport === "desktop" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("desktop")}
                    className="rounded-none"
                  >
                    <Monitor className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewport === "tablet" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("tablet")}
                    className="rounded-none"
                  >
                    <Tablet className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewport === "mobile" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewport("mobile")}
                    className="rounded-none"
                  >
                    <Smartphone className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Recarregar
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir em Nova Aba
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview iframe */}
        <div className="flex justify-center">
          <div
            className="border rounded-lg overflow-hidden bg-white shadow-lg transition-all duration-300"
            style={{
              width: viewportWidths[viewport],
              maxWidth: "100%",
              height: "75vh",
            }}
          >
            <iframe
              key={refreshKey}
              src={previewUrl}
              className="w-full h-full border-0"
              title="Landing Page Preview"
            />
          </div>
        </div>
      </div>
    </AdminPageContainer>
  );
}
