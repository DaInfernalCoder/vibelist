"use client";

import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  RotateCcw, 
  RotateCw, 
  RefreshCw 
} from "lucide-react";

export default function PreviewControls() {
  const { 
    previewSize, 
    setPreviewSize,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefaults
  } = useTemplate();

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-lg mb-4 space-y-4">
      {/* Device selector */}
      <div className="flex space-x-3 w-full justify-center">
        <Button
          size="sm"
          variant={previewSize === "mobile" ? "default" : "outline"}
          onClick={() => setPreviewSize("mobile")}
          title="Mobile view"
          className="px-5"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Mobile
        </Button>
        <Button
          size="sm"
          variant={previewSize === "tablet" ? "default" : "outline"}
          onClick={() => setPreviewSize("tablet")}
          title="Tablet view"
          className="px-5"
        >
          <Tablet className="h-4 w-4 mr-2" />
          Tablet
        </Button>
        <Button
          size="sm"
          variant={previewSize === "desktop" ? "default" : "outline"}
          onClick={() => setPreviewSize("desktop")}
          title="Desktop view"
          className="px-5"
        >
          <Monitor className="h-4 w-4 mr-2" />
          Desktop
        </Button>
      </div>

      {/* History controls */}
      <div className="flex space-x-3 w-full justify-center">
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!canUndo}
          title="Undo last change"
          className="px-5"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!canRedo}
          title="Redo last change"
          className="px-5"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Redo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetToDefaults}
          title="Reset to default template"
          className="px-5"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
} 