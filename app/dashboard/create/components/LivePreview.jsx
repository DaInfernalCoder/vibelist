"use client";

import { useTemplate } from "../context/TemplateContext";
import { getBorderRadiusClass, getFontWeightClass } from "../utils/templateUtils";

export default function LivePreview() {
  const { template, previewSize } = useTemplate();

  // Adjust font sizes based on preview size
  const titleSize = previewSize === "mobile" 
    ? "text-3xl" 
    : previewSize === "tablet" 
    ? "text-4xl" 
    : "text-5xl";
  
  const subtitleSize = previewSize === "mobile" 
    ? "text-base" 
    : previewSize === "tablet" 
    ? "text-lg" 
    : "text-xl";

  // Adjust layout for mobile
  const formLayout = previewSize === "mobile" 
    ? "flex-col" 
    : "sm:flex-row";

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center overflow-auto"
      style={{ backgroundColor: template.bgColor }}
    >
      <div className={`flex flex-col items-center text-center p-4 ${previewSize === "mobile" ? "w-full" : "max-w-3xl mx-auto"}`}>
        {/* Logo */}
        {template.showLogo && (
          <div 
            className="mb-8"
            style={{ 
              transform: `scale(${template.logoSize === '1X' ? 1 : template.logoSize === '1.5X' ? 1.5 : 2})` 
            }}
          >
            {template.logoUrl ? (
              <img 
                src={template.logoUrl} 
                alt="Logo" 
                className="max-w-[100px] max-h-[100px] object-contain"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm font-medium">LOGO</span>
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <h1 
          className={`${titleSize} font-bold mb-4`}
          style={{ color: template.headingTextColor }}
        >
          {template.heroText}
        </h1>

        {/* Subtitle */}
        <p 
          className={`${subtitleSize} max-w-lg mb-8`}
          style={{ color: template.signupTextColor }}
        >
          {template.subText}
        </p>

        {/* Form */}
        <div className={`w-full max-w-md flex ${formLayout} gap-2 mb-6`}>
          <input
            type="email"
            placeholder={template.placeholderInputText}
            className={`w-full px-4 py-3 ${previewSize === "mobile" ? "mb-2" : ""} ${getBorderRadiusClass(template.inputBorderRadius)}`}
            style={{
              backgroundColor: template.inputColor,
              borderWidth: template.inputBorderWidth,
              borderColor: template.inputBorderColor,
              color: template.signupTextColor
            }}
          />
          <button
            className={`px-4 py-3 ${previewSize === "mobile" ? "w-full" : ""} ${getBorderRadiusClass(template.inputBorderRadius)} ${getFontWeightClass(template.buttonTextWeight)} whitespace-nowrap`}
            style={{
              backgroundColor: template.buttonColor,
              color: template.buttonTextColor,
              borderWidth: template.buttonBorderWidth
            }}
          >
            {template.buttonText}
          </button>
        </div>

        {/* Social Proof */}
        {template.showSocialProof && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border border-white"></div>
              ))}
            </div>
            <div className="flex items-center">
              <span 
                className="inline-block w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: template.pingDotColor }}
              ></span>
              <span style={{ color: template.signupTextColor }}>Be the first to join</span>
            </div>
          </div>
        )}
        
        {/* Success Message Preview (only shown when in fullscreen preview) */}
        {false && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{template.successMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
} 