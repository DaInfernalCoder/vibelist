"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";

// Import context provider
import TemplateProvider from "./context/TemplateProvider";
import { useTemplate } from "./context/TemplateContext";

// Import tab contents
import SetupTabContent from "./components/SetupTabContent";
import DesignTabContent from "./components/DesignTabContent";
import ThemesTabContent from "./components/ThemesTabContent";

// Import preview components
import LivePreview from "./components/LivePreview";
// import PreviewControls from "./components/PreviewControls";
import FullPreviewDialog from "./components/FullPreviewDialog";

// Inner component to access TemplateContext
function EditorLayout() {
  const { saveTemplate, isSaving, hasUnsavedChanges } = useTemplate();

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
              <TabsTrigger value="themes">Themes</TabsTrigger>
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
          <Card className="p-6 flex-grow overflow-hidden flex flex-col items-center justify-center">
            <LivePreview />
          </Card>
          {/* Save Button positioned under the LivePreview Card */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={saveTemplate}
              disabled={isSaving || !hasUnsavedChanges}
              size="lg" 
            >
              {isSaving ? (
                <>
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Full-screen preview dialog */}
      <FullPreviewDialog />
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