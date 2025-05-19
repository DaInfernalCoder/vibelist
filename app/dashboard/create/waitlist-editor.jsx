"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Maximize2, Save } from "lucide-react";

// Import context provider
import TemplateProvider from "./context/TemplateProvider";
import { useTemplate } from "./context/TemplateContext";

// Import tab contents
import SetupTabContent from "./components/SetupTabContent";
import DesignTabContent from "./components/DesignTabContent";
import ThemesTabContent from "./components/ThemesTabContent";

// Import preview components
import LivePreview from "./components/LivePreview";
import PreviewControls from "./components/PreviewControls";
import FullPreviewDialog from "./components/FullPreviewDialog";

// Inner component to access TemplateContext
function EditorLayout() {
  const { 
    saveTemplate, 
    isSaving, 
    hasUnsavedChanges,
    undo,
    redo,
    setIsFullPreview,
    canUndo,
    canRedo
  } = useTemplate();

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save - Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser save dialog
        if (!isSaving && hasUnsavedChanges) {
          saveTemplate();
        }
      }
      
      // Undo - Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      
      // Redo - Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }
      
      // Fullscreen Preview - Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setIsFullPreview(true);
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveTemplate, isSaving, hasUnsavedChanges, undo, redo, canUndo, canRedo, setIsFullPreview]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Waitlist Page Editor</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Panel */}
        <div>
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="themes">Themes & Saved</TabsTrigger>
            </TabsList>
            
            <Card className="p-6">
              <ScrollArea className="h-[calc(100vh-280px)] pr-4"> {/* Adjusted height */}
                <TabsContent value="setup">
                  <SetupTabContent />
                </TabsContent>
                
                <TabsContent value="design">
                  <DesignTabContent />
                </TabsContent>
                
                <TabsContent value="themes">
                  <ThemesTabContent />
                </TabsContent>
              </ScrollArea>
            </Card>
          </Tabs>
        </div>
        
        {/* Preview Panel */}
        <div className="flex flex-col">
          <PreviewControls />
          
          <Card className="rounded-lg flex-grow overflow-hidden flex flex-col items-center justify-center mb-4">
            <LivePreview />
          </Card>
          
          {/* Action buttons below preview */}
          <div className="flex justify-center gap-4 p-6 bg-muted rounded-lg">
            <Button 
              variant="outline" 
              className="px-6"
              onClick={() => setIsFullPreview(true)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
            <Button 
              variant="default" 
              className="px-6"
              onClick={saveTemplate}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Full-screen preview dialog */}
      <FullPreviewDialog />
      
      {/* Keyboard shortcuts hint */}
      <div className="mt-8 text-sm text-muted-foreground">
        <p>Keyboard shortcuts: <kbd className="px-2 py-1 rounded bg-muted">Ctrl+S</kbd> Save, <kbd className="px-2 py-1 rounded bg-muted">Ctrl+Z</kbd> Undo, <kbd className="px-2 py-1 rounded bg-muted">Ctrl+Y</kbd> Redo, <kbd className="px-2 py-1 rounded bg-muted">Ctrl+P</kbd> Preview</p>
      </div>
    </div>
  );
}

export default function WaitlistEditor() {
  return (
    <TemplateProvider>
      <EditorLayout />
      <Toaster />
    </TemplateProvider>
  );
} 