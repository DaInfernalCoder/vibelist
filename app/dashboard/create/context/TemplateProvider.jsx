"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/libs/supabase/client";
import TemplateContext from "./TemplateContext";
import { defaultTemplate } from "../utils/templateUtils";
import { useToast } from "@/hooks/use-toast";

// Define a debounce timer variable outside the component
let autosaveTimer;

export default function TemplateProvider({ children }) {
  const { toast } = useToast();
  const supabase = createClient();

  // Template state
  const [template, setTemplate] = useState(defaultTemplate);

  // History for undo/redo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedTemplate, setSavedTemplate] = useState(null); // Tracks the last manually saved state

  // Preview state
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [previewSize, setPreviewSize] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);
  const [templateId, setTemplateId] = useState(null);

  // Saved templates state
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [isLoadingSavedTemplates, setIsLoadingSavedTemplates] = useState(false);

  // Load saved template on initial load
  useEffect(() => {
    const loadInitialTemplate = async () => {
      let loadedFromAutosave = false;
      try {
        // 1. Try to load from autosaved draft in localStorage first
        const autosavedData = localStorage.getItem("autosaved_template_draft");
        if (autosavedData) {
          try {
            const parsedAutosaved = JSON.parse(autosavedData);
            setTemplate(parsedAutosaved);
            setHistory([parsedAutosaved]);
            setHistoryIndex(0);
            // We don't set savedTemplate here, as this is a draft
            console.log("Loaded template from autosaved draft.");
            loadedFromAutosave = true;
            // If autosave is loaded, we might not need to hit Supabase for the *initial* editor state,
            // but we still need templateId if it was previously saved to Supabase.
          } catch (parseError) {
            console.error("Error parsing autosaved template:", parseError);
            // If autosave data is corrupt, ignore it
            localStorage.removeItem("autosaved_template_draft");
          }
        }

        // 2. Try to load the last manually saved version from Supabase (and get templateId)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (!authError && user) {
          try {
            const { data: supabaseData, error } = await supabase
              .from("waitlist_templates")
              .select("*")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(1);

            if (error) {
              console.error("Error loading template from Supabase:", error);
              toast({
                title: "Warning",
                description:
                  "Could not load saved templates. Using local data only.",
                variant: "destructive",
              });
            } else if (supabaseData && supabaseData.length > 0) {
              try {
                const loadedSupabaseTemplate = JSON.parse(
                  supabaseData[0].template_data
                );
                setTemplateId(supabaseData[0].id);
                setSavedTemplate(loadedSupabaseTemplate); // This is the true "last manually saved" state

                if (!loadedFromAutosave) {
                  // If nothing was loaded from autosave, use the Supabase version
                  setTemplate(loadedSupabaseTemplate);
                  setHistory([loadedSupabaseTemplate]);
                  setHistoryIndex(0);
                  console.log("Loaded template from Supabase.");
                } else {
                  // If autosave was loaded, it's already set. `savedTemplate` is correctly set to Supabase version.
                  console.log(
                    "Autosave loaded, Supabase version set as 'savedTemplate'."
                  );
                }
              } catch (parseError) {
                console.error(
                  "Error parsing template from Supabase:",
                  parseError
                );
                toast({
                  title: "Warning",
                  description:
                    "Saved template could not be loaded correctly. Using backup data.",
                  variant: "destructive",
                });
              }
            }
          } catch (supabaseError) {
            console.error("Error communicating with Supabase:", supabaseError);
            toast({
              title: "Connection Error",
              description:
                "Could not connect to the database. Using local data only.",
              variant: "destructive",
            });
          }
        }

        // If nothing loaded from autosave or Supabase, template remains defaultTemplate
        if (!loadedFromAutosave && (!user || !templateId)) {
          setHistory([defaultTemplate]);
          setHistoryIndex(0);
          console.log("Initialized with default template.");
        }
      } catch (err) {
        console.error("Error during initial template load:", err);
        // Fallback to default template if any error occurs
        setTemplate(defaultTemplate);
        setHistory([defaultTemplate]);
        setHistoryIndex(0);
        toast({
          title: "Error",
          description:
            "There was a problem loading your template. Starting with a fresh template.",
          variant: "destructive",
        });
      }
    };

    loadInitialTemplate();
  }, [supabase]);

  // Auto-save template to localStorage with debounce
  useEffect(() => {
    // Clear the previous timer if template changes
    clearTimeout(autosaveTimer);

    // Don't autosave if the template is still the default one and hasn't been modified from it,
    // or if it's the same as the last *manually* saved state to avoid unnecessary autosaves.
    // However, for simplicity and ensuring any intermediate work is caught, we'll autosave.
    // A more sophisticated check could compare with defaultTemplate or savedTemplate.
    if (template && historyIndex > -1) {
      // Ensure there's a valid template to save
      autosaveTimer = setTimeout(() => {
        try {
          localStorage.setItem(
            "autosaved_template_draft",
            JSON.stringify(template)
          );
          console.log("Template autosaved to localStorage draft.");
        } catch (error) {
          console.error("Error autosaving template to localStorage:", error);
        }
      }, 1500); // Autosave after 1.5 seconds of inactivity
    }

    // Cleanup timer on component unmount
    return () => {
      clearTimeout(autosaveTimer);
    };
  }, [template, historyIndex]);

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

  // Save template to database
  const saveTemplate = async () => {
    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save a template",
          variant: "destructive",
        });
        setIsSaving(false); // Ensure saving state is reset
        return;
      }

      // Validate template has a name
      if (!template.projectTitle) {
        toast({
          title: "Validation Error",
          description: "Please provide a title for your template before saving",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const templateDataToSave = {
        template_data: JSON.stringify(template),
        user_id: user.id,
        name: template.projectTitle || "Unnamed Template",
      };

      let result;

      if (templateId) {
        // Update existing template
        result = await supabase
          .from("waitlist_templates")
          .update(templateDataToSave)
          .eq("id", templateId);
      } else {
        // Create new template
        result = await supabase
          .from("waitlist_templates")
          .insert([templateDataToSave])
          .select();

        if (result.data && result.data.length > 0) {
          setTemplateId(result.data[0].id);
        }
      }

      if (result.error) {
        throw new Error(result.error.message || "Failed to save to database");
      }

      setSavedTemplate(template); // Update the manually saved state
      localStorage.setItem("waitlistTemplate", JSON.stringify(template)); // Manually saved version also to local
      localStorage.removeItem("autosaved_template_draft"); // Remove autosaved draft
      console.log("Autosaved draft removed after manual save.");
      toast({
        title: "Success",
        description: "Template saved successfully!",
      });
    } catch (err) {
      console.error("Error saving template:", err);
      toast({
        title: "Save Failed",
        description: err.message || "An unknown error occurred while saving",
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
      const newHistory = history.slice(0, historyIndex + 1); // Keep past history up to current point
      setHistory([...newHistory, savedTemplate]);
      setHistoryIndex(newHistory.length);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setTemplate(defaultTemplate);
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1); // Keep past history
    setHistory([...newHistory, defaultTemplate]);
    setHistoryIndex(newHistory.length);
    localStorage.removeItem("autosaved_template_draft"); // Clear autosaved draft
    console.log("Autosaved draft removed on reset to defaults.");
  };

  // Check if there are unsaved changes against the last *manually* saved state
  const hasUnsavedChanges = savedTemplate
    ? JSON.stringify(template) !== JSON.stringify(savedTemplate)
    : JSON.stringify(template) !== JSON.stringify(defaultTemplate);

  // Load saved templates from Supabase
  const loadSavedTemplates = async () => {
    setIsLoadingSavedTemplates(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view saved templates",
          variant: "destructive",
        });
        return [];
      }

      const { data, error } = await supabase
        .from("waitlist_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        throw new Error(error.message || "Failed to load saved templates");
      }

      setSavedTemplates(data || []);
      return data || [];
    } catch (err) {
      console.error("Error loading saved templates:", err);
      toast({
        title: "Error",
        description: "Failed to load saved templates: " + err.message,
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoadingSavedTemplates(false);
    }
  };

  // Load a specific template
  const loadTemplate = async (id) => {
    try {
      setIsSaving(true);

      const { data, error } = await supabase
        .from("waitlist_templates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        throw new Error(error.message || "Failed to load template");
      }

      if (!data) {
        throw new Error("Template not found");
      }

      const loadedTemplate = JSON.parse(data.template_data);

      // Update state
      setTemplate(loadedTemplate);
      setSavedTemplate(loadedTemplate);
      setTemplateId(data.id);

      // Reset history with this template
      setHistory([loadedTemplate]);
      setHistoryIndex(0);

      toast({
        title: "Success",
        description: `Template "${data.name}" loaded successfully!`,
      });

      // Clear autosave since we've loaded a fresh template
      localStorage.removeItem("autosaved_template_draft");

      return true;
    } catch (err) {
      console.error("Error loading template:", err);
      toast({
        title: "Error",
        description: "Failed to load template: " + err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

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
    templateId,
    // Add new values for saved templates
    savedTemplates,
    loadSavedTemplates,
    loadTemplate,
    isLoadingSavedTemplates,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}
