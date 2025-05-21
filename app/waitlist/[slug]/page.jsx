"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function PublicWaitlistPage() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customStyles, setCustomStyles] = useState({});

  // Fetch the waitlist data
  useEffect(() => {
    async function fetchWaitlist() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/waitlists/slug/${slug}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load waitlist");
        }
        
        const data = await response.json();
        setWaitlist(data);
        
        // Apply custom styles from template_data
        if (data.template_data) {
          const templateData = typeof data.template_data === 'string' 
            ? JSON.parse(data.template_data) 
            : data.template_data;
            
          setCustomStyles({
            backgroundColor: templateData.background_color || "#ffffff",
            textColor: templateData.text_color || "#000000",
            themeColor: templateData.theme_color || "#4f46e5",
            heroText: templateData.hero_text || "Join Our Waitlist",
            descriptionText: templateData.description_text || "Sign up to get early access",
            buttonText: templateData.button_text || "Join Waitlist",
            logoUrl: templateData.logo_url || "",
            fontFamily: templateData.font_family || "Inter, sans-serif",
          });
        }
      } catch (err) {
        console.error("Error fetching waitlist:", err);
        setError(err.message || "Failed to load waitlist");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (slug) {
      fetchWaitlist();
    }
  }, [slug]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          waitlistId: waitlist.id,
          source: "public_waitlist",
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }
      
      // Success
      toast({
        title: "Success!",
        description: "You've been added to the waitlist",
        variant: "success",
      });
      
      setEmail("");
    } catch (err) {
      console.error("Error joining waitlist:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to join waitlist",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading waitlist...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-4">Waitlist Not Found</h2>
          <p className="mb-6">The waitlist you&apos;re looking for doesn&apos;t exist or isn&apos;t published yet.</p>
          <Button asChild>
            <a href="/">Return Home</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        backgroundColor: customStyles.backgroundColor,
        color: customStyles.textColor,
        fontFamily: customStyles.fontFamily
      }}
    >
      <Card className="w-full max-w-md shadow-lg">
        {customStyles.logoUrl && (
          <div className="flex justify-center mt-6">
            <Image 
              src={customStyles.logoUrl}
              alt={waitlist?.name || "Waitlist Logo"} 
              width={150} 
              height={50}
              className="object-contain"
            />
          </div>
        )}
        
        <CardHeader>
          <CardTitle 
            className="text-2xl font-bold text-center"
            style={{ color: customStyles.textColor }}
          >
            {customStyles.heroText}
          </CardTitle>
          {waitlist?.name && (
            <CardTitle className="text-center mt-2">{waitlist.name}</CardTitle>
          )}
          <CardDescription className="text-center">
            {waitlist?.description || customStyles.descriptionText}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full"
                style={{
                  backgroundColor: customStyles.themeColor,
                  color: "#ffffff"
                }}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs mr-2"></span>
                    Processing...
                  </>
                ) : (
                  customStyles.buttonText
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Powered by Vibelist</p>
        </CardFooter>
      </Card>
    </div>
  );
} 