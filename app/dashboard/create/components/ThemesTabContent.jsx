"use client";

import { useTemplate } from "../context/TemplateContext";
import { themeOptions } from "../utils/templateUtils";

export default function ThemesTabContent() {
  const { updateTemplate } = useTemplate();

  const applyTheme = (config) => {
    // Apply all properties from the theme config
    Object.keys(config).forEach(key => {
      updateTemplate(key, config[key]);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Choose a Theme</h3>
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
  );
} 