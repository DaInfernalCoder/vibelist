"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/libs/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PreviewContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        if (!templateId) {
          throw new Error("No template ID provided");
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("waitlist_templates")
          .select("*")
          .eq("id", templateId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Template not found");

        setTemplate(JSON.parse(data.template_data));
      } catch (err) {
        console.error("Error fetching template:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold text-error mb-4">Error</h1>
        <p className="mb-8">{error}</p>
        <Link href="/dashboard/create">
          <Button>Return to Editor</Button>
        </Link>
      </div>
    );
  }

  if (!template) return null;

  const getBorderRadiusClass = (radius) => {
    switch (radius) {
      case "None":
        return "rounded-none";
      case "Small":
        return "rounded-sm";
      case "Medium":
        return "rounded-md";
      case "Large":
        return "rounded-lg";
      default:
        return "rounded-md";
    }
  };

  const getFontWeightClass = (weight) => {
    switch (weight) {
      case "Normal":
        return "font-normal";
      case "Medium":
        return "font-medium";
      case "Bold":
        return "font-bold";
      default:
        return "font-normal";
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center py-12"
      style={{ backgroundColor: template.bgColor }}
    >
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          {template.showLogo && (
            <div
              className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-8"
              style={{
                transform: `scale(${
                  template.logoSize === "1X"
                    ? 1
                    : template.logoSize === "1.5X"
                      ? 1.5
                      : 2
                })`,
              }}
            >
              <span className="text-gray-600 text-sm font-medium">LOGO</span>
            </div>
          )}

          {/* Title */}
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: template.headingTextColor }}
          >
            {template.heroText}
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl max-w-lg mb-8"
            style={{ color: template.signupTextColor }}
          >
            {template.subText}
          </p>

          {/* Form */}
          <div className="w-full max-w-md flex flex-col sm:flex-row gap-2 mb-6">
            <input
              type="email"
              placeholder={template.placeholderInputText}
              className={`w-full px-4 py-3 ${getBorderRadiusClass(
                template.inputBorderRadius
              )}`}
              style={{
                backgroundColor: template.inputColor,
                borderWidth: template.inputBorderWidth,
                borderColor: template.inputBorderColor,
                color: template.signupTextColor,
              }}
            />
            <button
              className={`px-4 py-3 ${getBorderRadiusClass(
                template.inputBorderRadius
              )} ${getFontWeightClass(
                template.buttonTextWeight
              )} whitespace-nowrap`}
              style={{
                backgroundColor: template.buttonColor,
                color: template.buttonTextColor,
                borderWidth: template.buttonBorderWidth,
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
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-200 border border-white"
                  ></div>
                ))}
              </div>
              <div className="flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: template.pingDotColor }}
                ></span>
                <span style={{ color: template.signupTextColor }}>
                  Be the first to join
                </span>
              </div>
            </div>
          )}

          {template.enableReferrals && (
            <div
              className="mt-6 text-sm"
              style={{ color: template.signupTextColor }}
            >
              Share your unique link after signing up to earn rewards!
            </div>
          )}
        </div>

        {/* Admin edit link */}
        <div className="mt-12 text-center">
          <Link href={`/dashboard/create?id=${templateId}`}>
            <Button variant="outline" size="sm">
              Edit Template
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
