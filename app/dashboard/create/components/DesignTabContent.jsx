"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTemplate } from "../context/TemplateContext";

export default function DesignTabContent() {
  const { template, updateTemplate, saveTemplate, isSaving, hasUnsavedChanges } = useTemplate();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="bgColor">BG Color</Label>
        <div className="flex gap-2">
          <Input
            id="bgColor"
            value={template.bgColor}
            onChange={(e) => updateTemplate("bgColor", e.target.value)}
          />
          <input
            type="color"
            value={template.bgColor}
            onChange={(e) => updateTemplate("bgColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="headingTextColor">Heading Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="headingTextColor"
            value={template.headingTextColor}
            onChange={(e) => updateTemplate("headingTextColor", e.target.value)}
          />
          <input
            type="color"
            value={template.headingTextColor}
            onChange={(e) => updateTemplate("headingTextColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputColor">Input Color</Label>
        <div className="flex gap-2">
          <Input
            id="inputColor"
            value={template.inputColor}
            onChange={(e) => updateTemplate("inputColor", e.target.value)}
          />
          <input
            type="color"
            value={template.inputColor}
            onChange={(e) => updateTemplate("inputColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputBorderWidth">Input Border Width</Label>
        <select
          id="inputBorderWidth"
          className="w-full p-2 border rounded-md"
          value={template.inputBorderWidth}
          onChange={(e) => updateTemplate("inputBorderWidth", e.target.value)}
        >
          <option value="0px">0px</option>
          <option value="1px">1px</option>
          <option value="2px">2px</option>
          <option value="4px">4px</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputBorderColor">Input Border Color</Label>
        <div className="flex gap-2">
          <Input
            id="inputBorderColor"
            value={template.inputBorderColor}
            onChange={(e) => updateTemplate("inputBorderColor", e.target.value)}
          />
          <input
            type="color"
            value={template.inputBorderColor}
            onChange={(e) => updateTemplate("inputBorderColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputBorderRadius">Input Border Radius</Label>
        <select
          id="inputBorderRadius"
          className="w-full p-2 border rounded-md"
          value={template.inputBorderRadius}
          onChange={(e) => updateTemplate("inputBorderRadius", e.target.value)}
        >
          <option value="None">None</option>
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonColor">Button Color</Label>
        <div className="flex gap-2">
          <Input
            id="buttonColor"
            value={template.buttonColor}
            onChange={(e) => updateTemplate("buttonColor", e.target.value)}
          />
          <input
            type="color"
            value={template.buttonColor}
            onChange={(e) => updateTemplate("buttonColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonTextColor">Button Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="buttonTextColor"
            value={template.buttonTextColor}
            onChange={(e) => updateTemplate("buttonTextColor", e.target.value)}
          />
          <input
            type="color"
            value={template.buttonTextColor}
            onChange={(e) => updateTemplate("buttonTextColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonTextWeight">Button Text Weight</Label>
        <select
          id="buttonTextWeight"
          className="w-full p-2 border rounded-md"
          value={template.buttonTextWeight}
          onChange={(e) => updateTemplate("buttonTextWeight", e.target.value)}
        >
          <option value="Normal">Normal</option>
          <option value="Medium">Medium</option>
          <option value="Bold">Bold</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonBorderWidth">Button Border Width</Label>
        <select
          id="buttonBorderWidth"
          className="w-full p-2 border rounded-md"
          value={template.buttonBorderWidth}
          onChange={(e) => updateTemplate("buttonBorderWidth", e.target.value)}
        >
          <option value="0px">0px</option>
          <option value="1px">1px</option>
          <option value="2px">2px</option>
          <option value="4px">4px</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signupTextColor">Signup Text Color</Label>
        <div className="flex gap-2">
          <Input
            id="signupTextColor"
            value={template.signupTextColor}
            onChange={(e) => updateTemplate("signupTextColor", e.target.value)}
          />
          <input
            type="color"
            value={template.signupTextColor}
            onChange={(e) => updateTemplate("signupTextColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pingDotColor">Ping Dot Color</Label>
        <div className="flex gap-2">
          <Input
            id="pingDotColor"
            value={template.pingDotColor}
            onChange={(e) => updateTemplate("pingDotColor", e.target.value)}
          />
          <input
            type="color"
            value={template.pingDotColor}
            onChange={(e) => updateTemplate("pingDotColor", e.target.value)}
            className="w-10 h-10 p-1 border rounded"
          />
        </div>
      </div>
    </div>
  );
} 