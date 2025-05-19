"use client";

import { useEffect, useState } from "react";
import { useTemplate } from "../context/TemplateContext";
import { themeOptions } from "../utils/templateUtils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function ThemesTabContent() {
  const { 
    updateTemplate, 
    loadSavedTemplates, 
    loadTemplate, 
    savedTemplates, 
    isLoadingSavedTemplates
  } = useTemplate();

  const [hasFetchedTemplates, setHasFetchedTemplates] = useState(false);

  // Load saved templates when component mounts
  useEffect(() => {
    if (!hasFetchedTemplates) {
      loadSavedTemplates();
      setHasFetchedTemplates(true);
    }
  }, [loadSavedTemplates, hasFetchedTemplates]);

  const applyTheme = (config) => {
    // Apply all properties from the theme config
    Object.keys(config).forEach(key => {
      updateTemplate(key, config[key]);
    });
  };

  return (
    <div className="space-y-8">
      {/* Saved Templates Section */}
      <div className="space-y-4 border-b pb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Your Saved Templates</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadSavedTemplates()}
            disabled={isLoadingSavedTemplates}
          >
            {isLoadingSavedTemplates ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500">Load your previously saved templates</p>
        
        {isLoadingSavedTemplates ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : savedTemplates.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {savedTemplates.map((savedTemplate) => (
              <div 
                key={savedTemplate.id}
                className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-all flex justify-between items-center"
                onClick={() => loadTemplate(savedTemplate.id)}
              >
                <div>
                  <h4 className="font-medium">{savedTemplate.name}</h4>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(savedTemplate.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button size="sm" variant="ghost">Load</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No saved templates found. When you save a template, it will appear here.
          </div>
        )}
      </div>

      {/* Pre-defined Themes Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Pre-defined Themes</h3>
        <p className="text-sm text-gray-500">Apply a pre-designed theme to quickly style your waitlist</p>
        
        <div className="grid grid-cols-1 gap-4">
          {themeOptions.map((theme, index) => (
            <div 
              key={index}
              className="border rounded-lg p-4 cursor-pointer hover:border-primary transition-all"
              onClick={() => applyTheme(theme.config)}
            >
              <h4 className="font-medium">{theme.name}</h4>
              <p className="text-sm text-gray-500">{theme.preview}</p>
              
              <div className="mt-2 flex gap-2">
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: theme.config.bgColor }}
                />
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: theme.config.headingTextColor }}
                />
                <div 
                  className="w-6 h-6 rounded-full" 
                  style={{ backgroundColor: theme.config.buttonColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 