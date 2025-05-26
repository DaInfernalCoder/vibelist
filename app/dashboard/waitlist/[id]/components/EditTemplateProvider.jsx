"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import TemplateContext from "@/app/dashboard/create/context/TemplateContext";
import { defaultTemplate } from "@/app/dashboard/create/utils/templateUtils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

// Define a debounce timer variable outside the component
let autosaveTimer;

export default function EditTemplateProvider({
  children,
  waitlistData,
  waitlistId,
}) {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // Template state - initialized with existing data
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

  // Saved templates state
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isLoadingSavedTemplates, setIsLoadingSavedTemplates] = useState(false);

  // Initialize template with existing waitlist data
  useEffect(() => {
    if (waitlistData) {
      let initialTemplate = { ...defaultTemplate };

      // Load customization settings if they exist
      if (waitlistData.customization_settings) {
        const customSettings = waitlistData.customization_settings;

        // Map database fields to template fields
        initialTemplate = {
          ...initialTemplate,
          heroText:
            customSettings.hero_text ||
            waitlistData.name ||
            initialTemplate.heroText,
          subText:
            customSettings.sub_text ||
            waitlistData.description ||
            initialTemplate.subText,
          buttonText: customSettings.button_text || initialTemplate.buttonText,
          buttonColor:
            customSettings.theme_color || initialTemplate.buttonColor,
          logoUrl: customSettings.logo_url || initialTemplate.logoUrl,
          showLogo: !!customSettings.logo_url,
          successMessage:
            customSettings.success_message || initialTemplate.successMessage,
          buttonTextColor:
            customSettings.button_text_color || initialTemplate.buttonTextColor,
          headingTextColor:
            customSettings.heading_text_color ||
            initialTemplate.headingTextColor,
          signupTextColor:
            customSettings.signup_text_color || initialTemplate.signupTextColor,
          backgroundColor:
            customSettings.background_color || initialTemplate.backgroundColor,
          inputColor:
            customSettings.input_background_color || initialTemplate.inputColor,
          inputBorderColor:
            customSettings.input_border_color ||
            initialTemplate.inputBorderColor,
          showSocialProof:
            customSettings.show_social_proof ?? initialTemplate.showSocialProof,
          showReferral:
            customSettings.show_referral ?? initialTemplate.showReferral,
          placeholderInputText:
            customSettings.placeholder_input_text ||
            initialTemplate.placeholderInputText,
          whiteLabel: customSettings.white_label ?? initialTemplate.whiteLabel,
          // Add any custom fields
          ...(customSettings.custom_fields || {}),
        };
      } else {
        // If no customization settings, use basic waitlist data
        initialTemplate = {
          ...initialTemplate,
          heroText: waitlistData.name || initialTemplate.heroText,
          subText: waitlistData.description || initialTemplate.subText,
        };
      }

      setTemplate(initialTemplate);
      setSavedTemplate(initialTemplate);
      setHistory([initialTemplate]);
      setHistoryIndex(0);

      console.log(
        "Loaded existing waitlist data into editor:",
        initialTemplate
      );
    }
  }, [waitlistData]);

  // Auto-save template to localStorage with debounce
  useEffect(() => {
    clearTimeout(autosaveTimer);

    if (template && historyIndex > -1 && waitlistId) {
      autosaveTimer = setTimeout(() => {
        try {
          localStorage.setItem(
            `autosaved_template_draft_${waitlistId}`,
            JSON.stringify(template)
          );
          console.log(
            "Template autosaved to localStorage for waitlist:",
            waitlistId
          );
        } catch (error) {
          console.error("Error autosaving template to localStorage:", error);
        }
      }, 1500);
    }

    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [template, historyIndex, waitlistId]);

  // Update template property and track history
  const updateTemplate = (key, value) => {
    setTemplate((prev) => {
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

  // Save template - this updates the existing waitlist instead of creating new
  const saveTemplate = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Update customization settings for the existing waitlist
      const customizationData = {
        waitlist_id: waitlistId,
        hero_text: template.heroText,
        sub_text: template.subText,
        button_text: template.buttonText,
        theme_color: template.buttonColor,
        logo_url: template.logoUrl,
        success_message: template.successMessage,
        button_text_color: template.buttonTextColor,
        heading_text_color: template.headingTextColor,
        signup_text_color: template.signupTextColor,
        background_color: template.backgroundColor,
        input_background_color: template.inputColor,
        input_border_color: template.inputBorderColor,
        show_social_proof: template.showSocialProof,
        show_referral: template.showReferral,
        placeholder_input_text: template.placeholderInputText,
        white_label: template.whiteLabel,
        custom_fields: template.customFields || {},
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("customization_settings")
        .upsert(customizationData)
        .select()
        .single();

      if (error) throw error;

      setSavedTemplate({ ...template });

      // Clear autosaved data since we've saved manually
      localStorage.removeItem(`autosaved_template_draft_${waitlistId}`);

      toast({
        title: "Changes Saved",
        description: "Your waitlist customization has been saved successfully.",
        variant: "success",
      });

      console.log("Waitlist customization saved successfully");
    } catch (error) {
      console.error("Error saving waitlist customization:", error);
      toast({
        title: "Save Failed",
        description:
          error.message || "Failed to save your changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges =
    JSON.stringify(template) !== JSON.stringify(savedTemplate);

  // Reset to saved state
  const resetToSaved = () => {
    if (savedTemplate) {
      setTemplate(savedTemplate);
      setHistory([...history.slice(0, historyIndex + 1), savedTemplate]);
      setHistoryIndex(history.length);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all customizations to default? This cannot be undone."
    );
    if (confirmed) {
      const resetTemplate = { ...defaultTemplate };
      setTemplate(resetTemplate);
      setHistory([...history.slice(0, historyIndex + 1), resetTemplate]);
      setHistoryIndex(history.length);
    }
  };

  // Can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Load saved templates (for compatibility)
  const loadSavedTemplates = async () => {
    setIsLoadingSavedTemplates(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (!authError && user) {
        const { data, error } = await supabase
          .from("waitlist_templates")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          throw error;
        }

        setSavedTemplates(data || []);
      }
    } catch (error) {
      console.error("Error loading saved templates:", error);
      toast({
        title: "Load Error",
        description: "Could not load saved templates",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSavedTemplates(false);
    }
  };

  // Load a specific template
  const loadTemplate = async (id) => {
    try {
      const { data, error } = await supabase
        .from("waitlist_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const loadedTemplate = JSON.parse(data.template_data);
      setTemplate(loadedTemplate);
      setHistory([...history.slice(0, historyIndex + 1), loadedTemplate]);
      setHistoryIndex(history.length);

      toast({
        title: "Template Loaded",
        description: `Template "${data.name}" has been loaded`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error loading template:", error);
      toast({
        title: "Load Error",
        description: "Could not load the selected template",
        variant: "destructive",
      });
    }
  };

  const value = {
    template,
    updateTemplate,
    saveTemplate,
    isSaving,
    hasUnsavedChanges,
    undo,
    redo,
    canUndo,
    canRedo,
    resetToSaved,
    resetToDefaults,
    isFullPreview,
    setIsFullPreview,
    previewSize,
    setPreviewSize,
    savedTemplates,
    isLoadingSavedTemplates,
    loadSavedTemplates,
    loadTemplate,
    templateId,
    waitlistId, // Add waitlistId to context
    isEditMode: true, // Flag to indicate we're in edit mode
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}
