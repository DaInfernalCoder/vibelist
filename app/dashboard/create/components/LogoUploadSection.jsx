"use client";

import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Trash2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { useTemplate } from "../context/TemplateContext";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function LogoUploadSection() {
  const { template, updateTemplate } = useTemplate();
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Toggle logo visibility
  const handleShowLogoToggle = (checked) => {
    updateTemplate("showLogo", checked);
  };

  // Handle logo size change
  const handleLogoSizeChange = (value) => {
    updateTemplate("logoSize", value);
  };

  // Handle remove whitespace toggle
  const handleRemoveWhitespaceToggle = (checked) => {
    updateTemplate("removeLogoWhitespace", checked);
  };

  // Click the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Function to remove whitespace from image
  const removeImageWhitespace = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Set canvas size to original image size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Find bounds of non-transparent/non-white pixels
        let minX = canvas.width,
          minY = canvas.height,
          maxX = 0,
          maxY = 0;
        let hasContent = false;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            // Check if pixel is not transparent and not white (with some tolerance)
            const isNotTransparent = a > 10;
            const isNotWhite = r < 250 || g < 250 || b < 250;

            if (isNotTransparent && isNotWhite) {
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }

        if (!hasContent) {
          // If no content found, return original
          resolve(file);
          return;
        }

        // Add small padding
        const padding = 5;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width - 1, maxX + padding);
        maxY = Math.min(canvas.height - 1, maxY + padding);

        // Calculate cropped dimensions
        const croppedWidth = maxX - minX + 1;
        const croppedHeight = maxY - minY + 1;

        // Create new canvas for cropped image
        const croppedCanvas = document.createElement("canvas");
        const croppedCtx = croppedCanvas.getContext("2d");
        croppedCanvas.width = croppedWidth;
        croppedCanvas.height = croppedHeight;

        // Draw cropped image
        croppedCtx.drawImage(
          canvas,
          minX,
          minY,
          croppedWidth,
          croppedHeight,
          0,
          0,
          croppedWidth,
          croppedHeight
        );

        // Convert to blob
        croppedCanvas.toBlob(
          (blob) => {
            if (blob) {
              // Create a new file with the same name and type
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              reject(new Error("Failed to create cropped image"));
            }
          },
          file.type,
          0.95
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      // Load the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/svg+xml",
    ];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload a JPG, PNG, GIF, or SVG image."
      );
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 2MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError("");

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to upload a logo.",
          variant: "destructive",
        });
        return;
      }

      let processedFile = file;

      // Process image to remove whitespace if enabled (skip SVG files)
      if (template.removeLogoWhitespace && file.type !== "image/svg+xml") {
        try {
          processedFile = await removeImageWhitespace(file);
          toast({
            title: "Image Processed",
            description: "Whitespace has been removed from your logo.",
          });
        } catch (error) {
          console.warn(
            "Failed to remove whitespace, using original image:",
            error
          );
          // Continue with original file if processing fails
        }
      }

      // Create a unique file path
      const fileExt = processedFile.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/logos/${fileName}`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from("waitlist-assets")
        .upload(filePath, processedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get the public URL for the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from("waitlist-assets")
        .getPublicUrl(filePath);

      // Update template with the logo URL
      updateTemplate("logoUrl", publicUrlData.publicUrl);
      updateTemplate("showLogo", true);

      toast({
        title: "Logo Uploaded",
        description: "Your logo has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      setUploadError("Failed to upload logo. Please try again.");
      toast({
        title: "Upload Failed",
        description:
          error.message || "There was a problem uploading your logo.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove uploaded logo
  const removeLogo = () => {
    updateTemplate("logoUrl", "");
    toast({
      title: "Logo Removed",
      description: "Your logo has been removed.",
    });
  };

  return (
    <div className="space-y-6 border-t pt-4">
      <h3 className="font-medium">Logo Settings</h3>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-logo">Show Logo</Label>
          <p className="text-sm text-muted-foreground">
            Display your brand logo on the waitlist page
          </p>
        </div>
        <Switch
          id="show-logo"
          checked={template.showLogo || false}
          onCheckedChange={handleShowLogoToggle}
        />
      </div>

      {template.showLogo && (
        <>
          <div className="space-y-2">
            <Label htmlFor="logo-size">Logo Size</Label>
            <Select
              value={template.logoSize || "1X"}
              onValueChange={handleLogoSizeChange}
            >
              <SelectTrigger id="logo-size">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1X">Normal (1X)</SelectItem>
                <SelectItem value="1.5X">Medium (1.5X)</SelectItem>
                <SelectItem value="2X">Large (2X)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="remove-whitespace">Remove Whitespace</Label>
              <p className="text-sm text-muted-foreground">
                Automatically crop excess whitespace around your logo
              </p>
            </div>
            <Switch
              id="remove-whitespace"
              checked={template.removeLogoWhitespace || false}
              onCheckedChange={handleRemoveWhitespaceToggle}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Logo</Label>

            {/* Hidden file input */}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Preview and upload/remove buttons */}
            <div className="border rounded-md p-4">
              {template.logoUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 flex items-center justify-center">
                    <Image
                      src={template.logoUrl}
                      alt="Uploaded logo"
                      width={128}
                      height={128}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Replace
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeLogo}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                    <ImageIcon
                      className="w-12 h-12 text-muted-foreground opacity-30"
                      alt="Logo placeholder"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={triggerFileInput}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="loading loading-spinner loading-xs mr-2"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Logo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {uploadError && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="ml-2">
                  {uploadError}
                </AlertDescription>
              </Alert>
            )}

            <p className="text-sm text-muted-foreground mt-2">
              Upload a JPG, PNG, GIF, or SVG (max 2MB). Recommended size:
              200x200 pixels.
              {template.removeLogoWhitespace && (
                <>
                  <br />
                  <span className="text-blue-600">
                    Whitespace removal is enabled - excess padding will be
                    automatically cropped.
                  </span>
                </>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
