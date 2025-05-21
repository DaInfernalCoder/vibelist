"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Copy, ExternalLink, Facebook, Linkedin, Twitter } from "lucide-react";
import { CircleCheck } from "lucide-react";

export default function WaitlistSharePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Fetch waitlist data
  useEffect(() => {
    const fetchWaitlist = async () => {
      try {
        const response = await fetch(`/api/waitlists/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch waitlist");
        }
        
        setWaitlist(data);
      } catch (err) {
        console.error("Error fetching waitlist:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchWaitlist();
    }
  }, [id]);
  
  // Generate the waitlist URL
  const waitlistUrl = waitlist?.url_slug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/waitlist/${waitlist.url_slug}`
    : "";
  
  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(waitlistUrl);
      setCopySuccess(true);
      toast({
        title: "Link copied!",
        description: "Waitlist link copied to clipboard",
        variant: "success",
      });
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Social media sharing functions
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join my waitlist: ${waitlist.name}`)}&url=${encodeURIComponent(waitlistUrl)}`;
    window.open(twitterUrl, '_blank');
  };
  
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(waitlistUrl)}`;
    window.open(facebookUrl, '_blank');
  };
  
  const shareOnLinkedIn = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(waitlistUrl)}`;
    window.open(linkedinUrl, '_blank');
  };
  
  // Open waitlist preview
  const openPreview = () => {
    window.open(waitlistUrl, '_blank');
  };
  
  // Go to analytics
  const goToAnalytics = () => {
    router.push(`/dashboard/analytics?waitlist=${id}`);
  };
  
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  return (
    <div className="container max-w-3xl py-10">
      <div className="flex items-center justify-center mb-8">
        <div className="bg-green-100 text-green-700 rounded-full p-2">
          <CircleCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold ml-2">Waitlist Published!</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{waitlist.name}</CardTitle>
          <CardDescription>
            {waitlist.description || "Your waitlist is now live and ready to be shared."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Share your waitlist link</h3>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={waitlistUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copySuccess ? (
                  <CircleCheck className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Share on social media</h3>
            <div className="flex gap-2">
              <Button onClick={shareOnTwitter} variant="outline" size="sm">
                <Twitter className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button onClick={shareOnFacebook} variant="outline" size="sm">
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button onClick={shareOnLinkedIn} variant="outline" size="sm">
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={openPreview} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Waitlist
            </Button>
            <Button onClick={goToAnalytics} variant="default">
              View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container max-w-3xl py-10">
      <div className="flex items-center justify-center mb-8">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-8 w-40 ml-2" />
      </div>
      
      <Skeleton className="h-[400px] w-full rounded-md" />
    </div>
  );
}

function ErrorState({ error }) {
  return (
    <div className="container max-w-3xl py-10">
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    </div>
  );
} 