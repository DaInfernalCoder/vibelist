"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export function WaitlistPreview({ name, customizationData, className = "" }) {
  const [previewData, setPreviewData] = useState({
    theme_color: "#4f46e5",
    background_color: "#ffffff",
    text_color: "#111827",
    hero_text: "Join Our Waitlist",
    description_text: "Sign up now to get early access to our product.",
    button_text: "Join Waitlist",
    logo_url: "",
    // Default values for other customization fields
  });
  
  // Update preview data when customizationData changes
  useEffect(() => {
    if (customizationData) {
      setPreviewData(prev => ({
        ...prev,
        ...customizationData
      }));
    }
  }, [customizationData]);
  
  return (
    <div className={`bg-white p-4 rounded-md relative h-[300px] overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gray-50 opacity-50 flex items-center justify-center">
        <div className="text-sm text-gray-400 font-medium">Preview</div>
      </div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header with logo */}
        <div className="flex items-center mb-4">
          {previewData.logo_url && (
            <div className="mr-2 h-8 w-8 overflow-hidden rounded">
              <Image
                src={previewData.logo_url}
                alt={name || "Logo"}
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}
          <h3 className="text-sm font-semibold" style={{ color: previewData.text_color }}>
            {name || "Your Waitlist"}
          </h3>
        </div>
        
        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: previewData.text_color }}
          >
            {previewData.hero_text}
          </h1>
          
          <p 
            className="text-sm mb-4 max-w-md"
            style={{ color: previewData.text_color }}
          >
            {previewData.description_text}
          </p>
          
          {/* Mock form */}
          <div className="w-full max-w-xs flex items-center gap-2">
            <input
              type="text"
              className="px-3 py-2 border rounded-md text-sm flex-1"
              placeholder="Your email"
              disabled
            />
            <button 
              className="px-3 py-2 rounded-md text-white text-sm"
              style={{ backgroundColor: previewData.theme_color }}
              disabled
            >
              {previewData.button_text}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 