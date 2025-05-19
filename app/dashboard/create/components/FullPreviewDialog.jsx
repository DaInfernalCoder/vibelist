"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";
import LivePreview from "./LivePreview";
import { Smartphone, Tablet, Monitor, X, ExternalLink } from "lucide-react";

export default function FullPreviewDialog() {
  const { isFullPreview, setIsFullPreview, previewSize, setPreviewSize } = useTemplate();

  // Function to open preview in a new tab
  const openInNewTab = () => {
    // For now, we'll just close the dialog
    // In a real implementation, this would open a dedicated preview URL
    setIsFullPreview(false);
    // Display a notification that this would open in a new tab
    alert('This would open the preview in a new tab. This functionality will be implemented in a future version.');
  };

  return (
    <Dialog open={isFullPreview} onOpenChange={setIsFullPreview}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Waitlist Preview</DialogTitle>
            <DialogDescription>
              Preview how your waitlist will appear to visitors
            </DialogDescription>
          </div>
          
          {/* Device selector buttons */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={previewSize === "mobile" ? "default" : "outline"}
              onClick={() => setPreviewSize("mobile")}
              title="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewSize === "tablet" ? "default" : "outline"}
              onClick={() => setPreviewSize("tablet")}
              title="Tablet view"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={previewSize === "desktop" ? "default" : "outline"}
              onClick={() => setPreviewSize("desktop")}
              title="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-gray-100 rounded-md">
          <div 
            className={`overflow-hidden bg-white border border-gray-300 shadow-lg transition-all duration-300 h-[600px] ${
              previewSize === "mobile" 
                ? "w-[375px]" 
                : previewSize === "tablet" 
                ? "w-[768px]" 
                : "w-full max-w-[1200px]"
            }`}
          >
            <LivePreview />
          </div>
        </div>
        
        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            onClick={openInNewTab}
            title="Open preview in new tab"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsFullPreview(false)}
            title="Close preview"
          >
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 