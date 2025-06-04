"use client";

import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";
import {
  Smartphone,
  Tablet,
  Monitor,
  RotateCcw,
  RotateCw,
  RefreshCw,
} from "lucide-react";

export default function PreviewControls() {
  const {
    previewSize,
    setPreviewSize,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefaults,
  } = useTemplate();

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-muted rounded-lg mb-4 space-y-3 sm:space-y-4">
      {/* Device selector */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
        <Button
          size="sm"
          variant={previewSize === "mobile" ? "default" : "outline"}
          onClick={() => setPreviewSize("mobile")}
          title="Mobile view"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <Smartphone className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Mobile</span>
          <span className="xs:hidden">📱</span>
        </Button>
        <Button
          size="sm"
          variant={previewSize === "tablet" ? "default" : "outline"}
          onClick={() => setPreviewSize("tablet")}
          title="Tablet view"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <Tablet className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Tablet</span>
          <span className="xs:hidden">📱</span>
        </Button>
        <Button
          size="sm"
          variant={previewSize === "desktop" ? "default" : "outline"}
          onClick={() => setPreviewSize("desktop")}
          title="Desktop view"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <Monitor className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Desktop</span>
          <span className="xs:hidden">🖥️</span>
        </Button>
      </div>

      {/* History controls */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full">
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!canUndo}
          title="Undo last change"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Undo</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!canRedo}
          title="Redo last change"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <RotateCw className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Redo</span>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetToDefaults}
          title="Reset to default template"
          className="px-3 sm:px-5 flex-1 sm:flex-none min-w-0"
        >
          <RefreshCw className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>
    </div>
  );
}
