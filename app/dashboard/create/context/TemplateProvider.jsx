"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import TemplateContext from "./TemplateContext";
import { defaultTemplate } from "../utils/templateUtils";
import { useToast } from "@/hooks/use-toast";

export default function TemplateProvider({ children }) {
  const { toast } = useToast();
  const supabase = createClient();
  
  // Template state
  const [template, setTemplate] = useState(defaultTemplate);
  
  // History for undo/redo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedTemplate, setSavedTemplate] = useState(null);
  
  // Preview state
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [previewSize, setPreviewSize] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [templateId, setTemplateId] = useState(null);

  // Load saved template on initial load
  useEffect(() => {
    const loadSavedTemplate = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
          .from('waitlist_templates')
          .select('*')
          .eq('user_id', session.user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading template:', error);
          return;
        }

        if (data && data.length > 0) {
          const loadedTemplate = JSON.parse(data[0].template_data);
          setTemplate(loadedTemplate);
          setSavedTemplate(loadedTemplate);
          setTemplateId(data[0].id);
          // Initialize history with loaded template
          setHistory([loadedTemplate]);
          setHistoryIndex(0);
        }
      } catch (err) {
        console.error('Error loading template:', err);
      }
    };

    loadSavedTemplate();
  }, [supabase]);

  // Update template property and track history
  const updateTemplate = (key, value) => {
    setTemplate(prev => {
      const updated = { ...prev, [key]: value };
      
      // Only add to history if it's different from the last item
      if (JSON.stringify(updated) !== JSON.stringify(template)) {
        // If we're in the middle of the history, truncate it
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, updated]);
        setHistoryIndex(newHistory.length);
      }
      
      return updated;
    });
  };

  // Undo/Redo functionality
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  // Save template to database
  const saveTemplate = async () => {
    try {
      setIsSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save a template",
          variant: "destructive",
        });
        return;
      }

      const templateData = {
        template_data: JSON.stringify(template),
        user_id: session.user.id,
        name: template.projectTitle || 'Unnamed Template'
      };

      let result;
      
      if (templateId) {
        // Update existing template
        result = await supabase
          .from('waitlist_templates')
          .update(templateData)
          .eq('id', templateId);
      } else {
        // Create new template
        result = await supabase
          .from('waitlist_templates')
          .insert([templateData])
          .select();

        if (result.data && result.data.length > 0) {
          setTemplateId(result.data[0].id);
        }
      }

      if (result.error) {
        throw new result.error;
      }

      setSavedTemplate(template);
      toast({
        title: "Success",
        description: "Template saved successfully!",
      });
    } catch (err) {
      console.error('Error saving template:', err);
      toast({
        title: "Error",
        description: "Failed to save template: " + err.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to last saved template
  const resetToSaved = () => {
    if (savedTemplate) {
      setTemplate(savedTemplate);
      // Add to history
      setHistory([...history, savedTemplate]);
      setHistoryIndex(history.length);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setTemplate(defaultTemplate);
    // Add to history
    setHistory([...history, defaultTemplate]);
    setHistoryIndex(history.length);
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = savedTemplate && JSON.stringify(template) !== JSON.stringify(savedTemplate);

  // Context value
  const value = {
    template,
    updateTemplate,
    undo,
    redo,
    saveTemplate,
    resetToSaved,
    resetToDefaults,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    hasUnsavedChanges,
    isSaving,
    isFullPreview,
    setIsFullPreview,
    previewSize,
    setPreviewSize,
    templateId
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
} 