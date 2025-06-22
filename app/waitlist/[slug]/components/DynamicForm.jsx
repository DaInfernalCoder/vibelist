"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

/**
 * Dynamic form component for waitlist signups that renders fields based on configuration
 */
export default function DynamicForm({
  waitlistId,
  themeColor,
  buttonText = "Join Waitlist",
  buttonTextColor = "#ffffff",
  inputBackgroundColor,
  inputBorderColor,
  inputBorderRadius,
  buttonBorderRadius,
  textColor = "#000000",
  onSubmitSuccess,
  customFields = {},
  trackingData = {}
}) {
  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    // We'll dynamically add custom fields here
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Load tracking parameters into form data
  useEffect(() => {
    // No need to update unless we have tracking data
    if (Object.keys(trackingData).length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      ...trackingData
    }));
  }, [trackingData]);
  
  // Generate field configuration
  const fieldConfig = [
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "your@email.com",
      validate: (value) => {
        if (!value) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email";
        return null;
      }
    },
    {
      id: "name",
      label: "Name",
      type: "text",
      required: false,
      placeholder: "Your name",
      validate: (value) => {
        return null; // Name is optional
      }
    },
    // Add dynamic custom fields based on configuration
    ...(customFields.show_company ? [
      {
        id: "company",
        label: customFields.company_label || "Company",
        type: "text",
        required: customFields.company_required === true,
        placeholder: customFields.company_placeholder || "Your company name",
        validate: (value) => {
          if (customFields.company_required === true && !value) 
            return `${customFields.company_label || "Company"} is required`;
          return null;
        }
      }
    ] : []),
    ...(customFields.show_job_title ? [
      {
        id: "job_title",
        label: customFields.job_title_label || "Job Title",
        type: "text",
        required: customFields.job_title_required === true,
        placeholder: customFields.job_title_placeholder || "Your job title",
        validate: (value) => {
          if (customFields.job_title_required === true && !value) 
            return `${customFields.job_title_label || "Job Title"} is required`;
          return null;
        }
      }
    ] : []),
    // Custom checkboxes if configured
    ...(customFields.consent_checkbox ? [
      {
        id: "consent",
        label: customFields.consent_text || "I agree to receive emails about this product",
        type: "checkbox",
        required: customFields.consent_required === true,
        validate: (value) => {
          if (customFields.consent_required === true && !value) 
            return "You must agree to continue";
          return null;
        }
      }
    ] : [])
  ];
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Use the checked property for checkboxes, value for everything else
    const fieldValue = type === "checkbox" ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Validate the field
    validateField(name, fieldValue);
  };
  
  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    
    // Mark as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate
    validateField(name, fieldValue);
  };
  
  // Field validation
  const validateField = (name, value) => {
    const field = fieldConfig.find(f => f.id === name);
    if (!field) return;
    
    const error = field.validate ? field.validate(value) : null;
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };
  
  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    fieldConfig.forEach(field => {
      if (field.validate) {
        const error = field.validate(formData[field.id]);
        if (error) {
          newErrors[field.id] = error;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    // Mark all fields as touched
    const newTouched = fieldConfig.reduce((acc, field) => {
      acc[field.id] = true;
      return acc;
    }, {});
    setTouched(newTouched);
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data for submission
      const submitData = {
        waitlistId,
        email: formData.email,
        name: formData.name || undefined,
        // Add any custom fields
        customFields: Object.keys(formData)
          .filter(key => !["email", "name"].includes(key) && formData[key])
          .reduce((obj, key) => {
            obj[key] = formData[key];
            return obj;
          }, {}),
        // Add tracking data
        source: trackingData.utm_source || trackingData.ref || "direct"
      };
      
      // Send to the API
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Extract the most detailed error message available
        const errorMessage = data.error || data.details || data.message || "Failed to join waitlist";
        throw new Error(errorMessage);
      }
      
      // Success!
      setIsSuccess(true);
      
      toast({
        title: "Success!",
        description: "You've been added to the waitlist",
      });
      
      // Reset form
      setFormData({
        email: "",
        name: "",
      });
      
      // Call the success callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error("Error joining waitlist:", err);
      console.error("Error details:", {
        message: err.message,
        waitlistId: waitlistId,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Error",
        description: err.message || "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Define custom styles for form elements
  const labelStyle = {
    color: textColor,
  };
  
  const inputStyle = {
    backgroundColor: inputBackgroundColor || "var(--waitlist-input-background-color, #f8fafc)",
    borderColor: inputBorderColor || "var(--waitlist-input-border-color, #e2e8f0)",
    borderRadius: inputBorderRadius || "var(--waitlist-input-border-radius, 0.375rem)",
    color: textColor || "var(--waitlist-text-color, #000000)",
  };

  const buttonStyle = {
    backgroundColor: themeColor || "var(--waitlist-theme-color, #3B82F6)",
    color: buttonTextColor || "var(--waitlist-button-text-color, #ffffff)",
    borderRadius: buttonBorderRadius || "var(--waitlist-button-border-radius, 0.375rem)",
  };

  const errorStyle = {
    color: "rgb(239, 68, 68)", // text-destructive
  };
  
  // Render form fields dynamically
  const renderFormFields = () => {
    return fieldConfig.map(field => {
      const fieldId = `field-${field.id}`;
      const hasError = touched[field.id] && errors[field.id];
      
      if (field.type === "checkbox") {
        return (
          <div className="space-y-2" key={fieldId}>
            <div className="flex items-center space-x-2">
              <input
                id={fieldId}
                name={field.id}
                type="checkbox"
                checked={!!formData[field.id]}
                onChange={handleChange}
                onBlur={handleBlur}
                className="h-4 w-4 rounded border-gray-300 waitlist-accent-color focus:ring-2 focus:ring-offset-2"
                style={{ 
                  accentColor: themeColor || "var(--waitlist-theme-color, #3B82F6)", 
                }}
                aria-invalid={hasError ? "true" : "false"}
                aria-describedby={hasError ? `${fieldId}-error` : undefined}
              />
              <Label 
                htmlFor={fieldId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                style={labelStyle}
              >
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {hasError && (
              <p className="text-sm" id={`${fieldId}-error`} style={errorStyle}>
                {errors[field.id]}
              </p>
            )}
          </div>
        );
      }
      
      return (
        <div className="space-y-2" key={fieldId}>
          <Label 
            htmlFor={fieldId}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            style={labelStyle}
          >
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fieldId}
            name={field.id}
            type={field.type}
            value={formData[field.id] || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={field.placeholder}
            className={`waitlist-input ${hasError ? "border-destructive" : ""}`}
            style={hasError ? { ...inputStyle, borderColor: "rgb(239, 68, 68)" } : inputStyle}
            aria-invalid={hasError ? "true" : "false"}
            aria-describedby={hasError ? `${fieldId}-error` : undefined}
            disabled={isSubmitting}
            required={field.required}
          />
          {hasError && (
            <p className="text-sm" id={`${fieldId}-error`} style={errorStyle}>
              {errors[field.id]}
            </p>
          )}
        </div>
      );
    });
  };
  
  // Render success state if the form was submitted successfully
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 text-center p-4">
        <CheckCircle 
          className="h-16 w-16 text-green-500" 
          style={{ color: themeColor }}
        />
        <h3 className="text-xl font-bold mt-4" style={{ color: textColor }}>
          You&apos;re on the list!
        </h3>
        <p className="text-base mb-4" style={{ color: `color-mix(in srgb, ${textColor} 80%, transparent)` }}>
          {customFields.success_message || "Thank you for signing up! We'll keep you updated."}
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      {renderFormFields()}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-4 waitlist-button transition-colors hover:opacity-90"
        style={buttonStyle}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Submitting...</span>
          </>
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
} 