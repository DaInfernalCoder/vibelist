"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import { defaultTemplate } from "../utils/templateUtils";

export default function useTemplateManager({ onToast }) {
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

  // Load saved template from localStorage on initial load
  useEffect(() => {
    const savedData = localStorage.getItem("waitlistTemplate");
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setTemplate(parsed);
        setSavedTemplate(parsed);
        // Initialize history with saved template
        setHistory([parsed]);
        setHistoryIndex(0);
      } catch (error) {
        console.error("Error loading saved template:", error);
      }
    }
  }, []);

  // Update template state with history tracking
  const updateTemplate = (key, value) => {
    setTemplate((prev) => {
      const newTemplate = { ...prev, [key]: value };

      // Add to history if it's a new state (not during undo/redo)
      const timeoutId = setTimeout(() => {
        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, historyIndex + 1);
        // Add new template to history
        setHistory([...newHistory, newTemplate]);
        setHistoryIndex(newHistory.length);
      }, 500);

      return newTemplate;
    });
  };

  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
    }
  };

  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTemplate(history[newIndex]);
    }
  };

  // Save template to localStorage and Supabase
  const saveTemplate = async () => {
    try {
      setIsSaving(true);

      // Validate template has a name
      if (!template.projectTitle) {
        onToast({
          title: "Validation Error",
          description: "Please provide a title for your template before saving",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Save to localStorage
      localStorage.setItem("waitlistTemplate", JSON.stringify(template));
      setSavedTemplate(template);

      // Save to Supabase if authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const templateData = {
          user_id: user.id,
          template_data: JSON.stringify(template),
          name: template.projectTitle || "Unnamed Template",
          updated_at: new Date().toISOString(),
        };

        // Update or insert template
        if (templateId) {
          const { error } = await supabase
            .from("waitlist_templates")
            .update(templateData)
            .eq("id", templateId);

          if (error)
            throw new Error(
              error.message || "Failed to update template in database"
            );
        } else {
          templateData.created_at = new Date().toISOString();
          const { data, error } = await supabase
            .from("waitlist_templates")
            .insert(templateData)
            .select();

          if (error)
            throw new Error(
              error.message || "Failed to create template in database"
            );
          if (data && data.length > 0) {
            setTemplateId(data[0].id);
          }
        }
      }

      onToast({
        title: "Changes saved",
        description: "Your template has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      onToast({
        title: "Save failed",
        description: error.message || "An unknown error occurred while saving",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open full preview in new window
  const openFullPreview = () => {
    // Save current state to localStorage for preview
    localStorage.setItem("previewTemplate", JSON.stringify(template));

    // Open preview in new window/tab
    window.open("/preview", "_blank");
  };

  return {
    template,
    updateTemplate,
    history,
    historyIndex,
    savedTemplate,
    isFullPreview,
    setIsFullPreview,
    previewSize,
    setPreviewSize,
    isSaving,
    handleUndo,
    handleRedo,
    saveTemplate,
    openFullPreview,
  };
}
