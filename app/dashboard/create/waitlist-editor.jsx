"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Save, Send } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";

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
import PublishWaitlistModal from "./components/PublishWaitlistModal";

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
    canRedo,
    template,
  } = useTemplate();

  const { hasValidAccess, isAuthenticated } = useSubscription();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const router = useRouter();

  // Handle publish button click with subscription check
  const handlePublishClick = () => {
    if (!isAuthenticated) {
      // Not logged in, redirect to pricing
      router.push("/pricing");
      return;
    }

    if (!hasValidAccess) {
      // No subscription, redirect to pricing
      router.push("/pricing");
      return;
    }

    // User has subscription, show publish modal
    setIsPublishModalOpen(true);
  };

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Save - Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault(); // Prevent browser save dialog
        if (!isSaving && hasUnsavedChanges) {
          saveTemplate();
        }
      }

      // Undo - Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (canUndo) {
          undo();
        }
      }

      // Redo - Ctrl+Y / Cmd+Y or Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        if (canRedo) {
          redo();
        }
      }

      // Fullscreen Preview - Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        setIsFullPreview(true);
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    saveTemplate,
    isSaving,
    hasUnsavedChanges,
    undo,
    redo,
    canUndo,
    canRedo,
    setIsFullPreview,
  ]);

  return (
    <div className="container px-4 sm:px-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        {/* Editor Panel */}
        <div className="order-2 xl:order-1">
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="setup" className="flex-1">
                Setup
              </TabsTrigger>
              <TabsTrigger value="design" className="flex-1">
                Design
              </TabsTrigger>
              <TabsTrigger value="themes" className="flex-1">
                Themes & Saved
              </TabsTrigger>
            </TabsList>

            <Card className="p-4 sm:p-6">
              <ScrollArea className="h-[calc(100vh-280px)] pr-2 sm:pr-4">
                {" "}
                {/* Adjusted height */}
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
        <div className="flex flex-col order-1 xl:order-2">
          <PreviewControls />

          <Card className="rounded-lg flex-grow overflow-hidden flex flex-col items-center justify-center mb-4">
            <LivePreview />
          </Card>

          {/* Action buttons below preview */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-muted rounded-lg">
            <Button
              variant="outline"
              className="px-4 sm:px-6 w-full sm:w-auto"
              onClick={() => setIsFullPreview(true)}
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
            <Button
              variant="default"
              className="px-4 sm:px-6 w-full sm:w-auto"
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
            <Button
              variant="primary"
              className="px-4 sm:px-6 w-full sm:w-auto"
              onClick={handlePublishClick}
            >
              <Send className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Full-screen preview dialog */}
      <FullPreviewDialog />

      {/* Publish waitlist modal - only for paying users */}
      <PublishWaitlistModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        templateData={template}
      />
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
