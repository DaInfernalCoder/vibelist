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

export default function BackgroundImageUploadSection() {
  const { template, updateTemplate } = useTemplate();
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Toggle background image visibility
  const handleShowBackgroundImageToggle = (checked) => {
    updateTemplate("showBackgroundImage", checked);
  };

  // Handle background image opacity change
  const handleBackgroundOpacityChange = (value) => {
    updateTemplate("backgroundImageOpacity", value);
  };

  // Handle background image position change
  const handleBackgroundPositionChange = (value) => {
    updateTemplate("backgroundImagePosition", value);
  };

  // Click the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Function to resize image for optimization
  const resizeImage = (
    file,
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8
  ) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw the resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error("Failed to resize image"));
            }
          },
          file.type,
          quality
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
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setUploadError(
        "Invalid file type. Please upload a JPG, PNG, or WebP image."
      );
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Maximum size is 5MB.");
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
          description: "You must be logged in to upload a background image.",
          variant: "destructive",
        });
        return;
      }

      let processedFile = file;

      // Resize image for optimization
      try {
        processedFile = await resizeImage(file);
        toast({
          title: "Image Optimized",
          description: "Your background image has been optimized for web use.",
        });
      } catch (error) {
        console.warn("Failed to resize image, using original:", error);
        // Continue with original file if processing fails
      }

      // Create a unique file path
      const fileExt = processedFile.name.split(".").pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/backgrounds/${fileName}`;

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

      // Update template with the background image URL
      updateTemplate("backgroundImageUrl", publicUrlData.publicUrl);
      updateTemplate("showBackgroundImage", true);

      toast({
        title: "Background Image Uploaded",
        description: "Your background image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading background image:", error);
      setUploadError("Failed to upload background image. Please try again.");
      toast({
        title: "Upload Failed",
        description:
          error.message ||
          "There was a problem uploading your background image.",
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

  // Remove uploaded background image
  const removeBackgroundImage = () => {
    updateTemplate("backgroundImageUrl", "");
    updateTemplate("showBackgroundImage", false);
    toast({
      title: "Background Image Removed",
      description: "Your background image has been removed.",
    });
  };

  return (
    <div className="space-y-6 border-t pt-4">
      <h3 className="font-medium">Background Image Settings</h3>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-background-image">Show Background Image</Label>
          <p className="text-sm text-muted-foreground">
            Display a background image on the waitlist page
          </p>
        </div>
        <Switch
          id="show-background-image"
          checked={template.showBackgroundImage || false}
          onCheckedChange={handleShowBackgroundImageToggle}
        />
      </div>

      {template.showBackgroundImage && (
        <>
          <div className="space-y-2">
            <Label htmlFor="background-opacity">Background Opacity</Label>
            <Select
              value={template.backgroundImageOpacity || "0.3"}
              onValueChange={handleBackgroundOpacityChange}
            >
              <SelectTrigger id="background-opacity">
                <SelectValue placeholder="Select opacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">10% (Very Light)</SelectItem>
                <SelectItem value="0.2">20% (Light)</SelectItem>
                <SelectItem value="0.3">30% (Medium Light)</SelectItem>
                <SelectItem value="0.5">50% (Medium)</SelectItem>
                <SelectItem value="0.7">70% (Medium Dark)</SelectItem>
                <SelectItem value="0.9">90% (Dark)</SelectItem>
                <SelectItem value="1.0">100% (Full)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="background-position">Background Position</Label>
            <Select
              value={template.backgroundImagePosition || "center"}
              onValueChange={handleBackgroundPositionChange}
            >
              <SelectTrigger id="background-position">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="top left">Top Left</SelectItem>
                <SelectItem value="top right">Top Right</SelectItem>
                <SelectItem value="bottom left">Bottom Left</SelectItem>
                <SelectItem value="bottom right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Upload Background Image</Label>

            {/* Hidden file input */}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Preview and upload/remove buttons */}
            <div className="border rounded-md p-4">
              {template.backgroundImageUrl ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-64 h-32 flex items-center justify-center border rounded-md overflow-hidden bg-muted">
                    <Image
                      src={template.backgroundImageUrl}
                      alt="Uploaded background image"
                      width={256}
                      height={128}
                      className="w-full h-full object-cover"
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
                      onClick={removeBackgroundImage}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-64 h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-muted">
                    <ImageIcon
                      className="w-12 h-12 text-muted-foreground opacity-30"
                      alt="Background image placeholder"
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
                        Upload Background Image
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
              Upload a JPG, PNG, or WebP image (max 5MB). Recommended size:
              1920x1080 pixels for best quality.
              <br />
              <span className="text-blue-600">
                Images will be automatically optimized for web performance.
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
