"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";
import { getWaitlistDashboardUrl } from "@/lib/url-utils";

/**
 * Modal component for publishing a waitlist
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} props.templateData - Template data containing customization options
 */
export default function PublishWaitlistModal({ 
  isOpen, 
  onClose, 
  templateData 
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const { toast } = useToast();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setDescription("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setError("Waitlist name is required");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Extract templateId if available
      const templateId = templateData?.id;
      
      // Prepare request payload with proper structure
      const payload = {
        name,
        description: description.trim() || undefined,
      };
      
      // Only include templateId if available
      if (templateId) {
        payload.templateId = templateId;
      }
      
      // Include customizationData properly
      if (templateData) {
        // Exclude the id property from customizationData
        const { id, ...customizationData } = templateData;
        payload.customizationData = customizationData;
      }
      
      const response = await fetch("/api/waitlists/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish waitlist");
      }
      
      const data = await response.json();
      
      // Success! Show toast and redirect to sharing page
      toast({
        title: "Waitlist published successfully!",
        description: "Your waitlist is now live and ready to be shared.",
        variant: "success",
      });
      
      // Close the modal
      onClose();
      
      // Redirect to the sharing page for this waitlist
      const sharePageUrl = getWaitlistDashboardUrl(data.id);
      router.push(sharePageUrl);
    } catch (err) {
      console.error("Error publishing waitlist:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Publish Your Waitlist</DialogTitle>
          <DialogDescription>
            Give your waitlist a name and description. This information will be visible to users who join.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="waitlist-name">Waitlist Name</Label>
            <Input
              id="waitlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Product Launch"
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="waitlist-description">Description (Optional)</Label>
            <Textarea
              id="waitlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your waitlist"
              disabled={isSubmitting}
              className="w-full min-h-[100px]"
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs mr-2"></span>
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Waitlist
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 