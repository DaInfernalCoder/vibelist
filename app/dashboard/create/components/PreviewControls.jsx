"use client";

import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";
import Link from "next/link";

export default function PreviewControls() {
  const { 
    previewSize, 
    setPreviewSize, 
    setIsFullPreview,
    saveTemplate,
    isSaving,
    hasUnsavedChanges,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToDefaults
  } = useTemplate();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted rounded-lg mb-4">
      {/* Device selector */}
      <div className="flex space-x-2 mb-4 sm:mb-0">
        <Button
          size="sm"
          variant={previewSize === "mobile" ? "default" : "outline"}
          onClick={() => setPreviewSize("mobile")}
        >
          Mobile
        </Button>
        <Button
          size="sm"
          variant={previewSize === "tablet" ? "default" : "outline"}
          onClick={() => setPreviewSize("tablet")}
        >
          Tablet
        </Button>
        <Button
          size="sm"
          variant={previewSize === "desktop" ? "default" : "outline"}
          onClick={() => setPreviewSize("desktop")}
        >
          Desktop
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2">
        <Button
          size="sm"
          variant="outline"
          onClick={undo}
          disabled={!canUndo}
        >
          Undo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={redo}
          disabled={!canRedo}
        >
          Redo
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetToDefaults}
        >
          Reset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullPreview(true)}
        >
          Fullscreen
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={saveTemplate}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <span className="loading loading-spinner loading-xs mr-2"></span>
              Saving...
            </>
          ) : (
            "Save"
          )}
        </Button>
      </div>
    </div>
  );
} 