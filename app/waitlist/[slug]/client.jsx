"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Twitter, Facebook, Linkedin, Share2, Copy } from "lucide-react";
import { getWaitlistUrl, getSocialShareUrls } from "@/lib/url-utils";

export function PublicWaitlistClient() {
  const { slug } = useParams();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customStyles, setCustomStyles] = useState({});
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);

  // Generate the current page URL
  const getPageUrl = () => {
    return getWaitlistUrl(slug);
  };

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

  // Social sharing functions
  const shareOnTwitter = () => {
    const url = getPageUrl();
    const text = `Join me on the waitlist for ${waitlist?.name || 'this exciting new product'}!`;
    const shareUrls = getSocialShareUrls({
      url,
      title: waitlist?.name || 'Join our waitlist',
      description: text
    });
    window.open(shareUrls.twitter, '_blank');
    trackShareEvent('twitter');
  };

  const shareOnFacebook = () => {
    const url = getPageUrl();
    const shareUrls = getSocialShareUrls({
      url,
      title: waitlist?.name || 'Join our waitlist',
      description: waitlist?.description || 'Sign up to get early access'
    });
    window.open(shareUrls.facebook, '_blank');
    trackShareEvent('facebook');
  };

  const shareOnLinkedIn = () => {
    const url = getPageUrl();
    const shareUrls = getSocialShareUrls({
      url,
      title: waitlist?.name || 'Join our waitlist',
      description: waitlist?.description || 'Sign up to get early access'
    });
    window.open(shareUrls.linkedin, '_blank');
    trackShareEvent('linkedin');
  };

  const copyToClipboard = () => {
    const url = getPageUrl();
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link Copied!",
        description: "Waitlist link copied to clipboard",
        variant: "success",
      });
      trackShareEvent('copy');
    }).catch(err => {
      console.error("Error copying to clipboard:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    });
  };

  // Track sharing events
  const trackShareEvent = (platform) => {
    try {
      // Check if window and posthog are available (client-side)
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('waitlist_shared', {
          waitlist_id: waitlist?.id,
          waitlist_name: waitlist?.name,
          platform: platform,
          slug: slug
        });
      }
    } catch (error) {
      console.error('Error tracking share event:', error);
    }
  };

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
        description: "You&apos;ve been added to the waitlist",
        variant: "success",
      });
      
      setEmail("");
      setIsSignedUp(true);
      setShowShareOptions(true);
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

  // Social share component
  const SocialShareSection = () => (
    <div className="mt-6 w-full">
      <div className="text-center mb-4">
        <h3 className="font-medium mb-2">Share this waitlist</h3>
        <p className="text-sm text-muted-foreground">Help us spread the word!</p>
      </div>
      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={shareOnTwitter}
          aria-label="Share on Twitter"
          className="rounded-full hover:bg-blue-50 transition-colors"
        >
          <Twitter className="h-5 w-5 text-[#1DA1F2]" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={shareOnFacebook}
          aria-label="Share on Facebook"
          className="rounded-full hover:bg-blue-50 transition-colors"
        >
          <Facebook className="h-5 w-5 text-[#4267B2]" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={shareOnLinkedIn}
          aria-label="Share on LinkedIn"
          className="rounded-full hover:bg-blue-50 transition-colors"
        >
          <Linkedin className="h-5 w-5 text-[#0077B5]" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={copyToClipboard}
          aria-label="Copy link"
          className="rounded-full hover:bg-blue-50 transition-colors"
        >
          <Copy className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );

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
          {!isSignedUp ? (
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
          ) : (
            <div className="text-center py-4">
              <h3 className="text-xl font-medium mb-2">Thanks for joining!</h3>
              <p className="mb-4">We&apos;ll notify you when we launch.</p>
              <Button 
                variant="outline"
                onClick={() => setIsSignedUp(false)}
                className="mt-2"
              >
                Sign up another email
              </Button>
            </div>
          )}
          
          {/* Show sharing options to everyone or just after signup */}
          {(showShareOptions || waitlist?.show_social_proof) && <SocialShareSection />}
          
          {/* Show manual share button if not already showing share options */}
          {!showShareOptions && !waitlist?.show_social_proof && (
            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareOptions(true)}
                className="flex items-center mx-auto gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share this waitlist
              </Button>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>Powered by Vibelist</p>
        </CardFooter>
      </Card>
    </div>
  );
} 