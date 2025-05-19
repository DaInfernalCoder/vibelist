"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";
import LivePreview from "./LivePreview";

export default function FullPreviewDialog() {
  const { isFullPreview, setIsFullPreview, previewSize } = useTemplate();

  return (
    <Dialog open={isFullPreview} onOpenChange={setIsFullPreview}>
      <DialogContent className="max-w-6xl w-full">
        <DialogHeader>
          <DialogTitle>Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center justify-center mt-4">
          <div 
            className={`overflow-hidden bg-white border border-gray-300 shadow-lg ${
              previewSize === "mobile" 
                ? "w-[375px]" 
                : previewSize === "tablet" 
                ? "w-[768px]" 
                : "w-full"
            }`}
          >
            <LivePreview />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => setIsFullPreview(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 