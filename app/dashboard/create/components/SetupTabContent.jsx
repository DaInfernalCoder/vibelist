"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useTemplate } from "../context/TemplateContext";

export default function SetupTabContent() {
  const { template, updateTemplate } = useTemplate();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="projectTitle">Project Title</Label>
        <Input
          id="projectTitle"
          value={template.projectTitle}
          onChange={(e) => updateTemplate("projectTitle", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="heroText">Hero Text</Label>
        <Input
          id="heroText"
          value={template.heroText}
          onChange={(e) => updateTemplate("heroText", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subText">Sub Text</Label>
        <Textarea
          id="subText"
          value={template.subText}
          onChange={(e) => updateTemplate("subText", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="placeholderInputText">Placeholder Input Text</Label>
        <Input
          id="placeholderInputText"
          value={template.placeholderInputText}
          onChange={(e) => updateTemplate("placeholderInputText", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buttonText">Button Text</Label>
        <Input
          id="buttonText"
          value={template.buttonText}
          onChange={(e) => updateTemplate("buttonText", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="successMessage">Success Message</Label>
        <Input
          id="successMessage"
          value={template.successMessage}
          onChange={(e) => updateTemplate("successMessage", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="showLogo">Show Logo</Label>
        <Switch
          id="showLogo"
          checked={template.showLogo}
          onCheckedChange={(checked) => updateTemplate("showLogo", checked)}
        />
      </div>

      {template.showLogo && (
        <div className="space-y-2">
          <Label htmlFor="logoSize">Logo Size</Label>
          <select
            id="logoSize"
            className="w-full p-2 border rounded-md"
            value={template.logoSize}
            onChange={(e) => updateTemplate("logoSize", e.target.value)}
          >
            <option value="1X">1X</option>
            <option value="1.5X">1.5X</option>
            <option value="2X">2X</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="showSocialProof">Show Social Proof</Label>
        <Switch
          id="showSocialProof"
          checked={template.showSocialProof}
          onCheckedChange={(checked) => updateTemplate("showSocialProof", checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="enableReferrals">Enable Referrals</Label>
        <Switch
          id="enableReferrals"
          checked={template.enableReferrals}
          onCheckedChange={(checked) => updateTemplate("enableReferrals", checked)}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="whiteLabel">White Label</Label>
        <Switch
          id="whiteLabel"
          checked={template.whiteLabel}
          onCheckedChange={(checked) => updateTemplate("whiteLabel", checked)}
        />
      </div>
    </div>
  );
} 