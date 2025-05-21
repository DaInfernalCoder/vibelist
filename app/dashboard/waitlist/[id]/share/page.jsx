"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Facebook, Linkedin, Twitter, Download, QrCode, Image as ImageIcon } from "lucide-react";
import { CircleCheck } from "lucide-react";
import { getWaitlistUrl, getSocialShareUrls } from "@/lib/url-utils";
import QRCode from 'qrcode';
import * as htmlToImage from 'html-to-image';

export default function WaitlistSharePage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [waitlist, setWaitlist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showShareImage, setShowShareImage] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const qrCanvasRef = useRef(null);
  const shareImageRef = useRef(null);
  
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
    ? getWaitlistUrl(waitlist.url_slug)
    : "";
  
  // Generate QR code when waitlist URL is available
  useEffect(() => {
    if (waitlistUrl) {
      generateQRCode();
    }
  }, [waitlistUrl]);

  // Generate QR code
  const generateQRCode = async () => {
    try {
      if (!waitlistUrl) return;
      
      // Generate QR code as data URL
      const dataUrl = await QRCode.toDataURL(waitlistUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      
      setQrCodeUrl(dataUrl);
      
      // Also render to canvas for better quality when downloading
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, waitlistUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
      toast({
        title: "QR Code Error",
        description: "Could not generate QR code",
        variant: "destructive",
      });
    }
  };
  
  // Download QR code image
  const downloadQRCode = () => {
    try {
      if (!qrCanvasRef.current) return;
      
      // Convert canvas to data URL
      const dataUrl = qrCanvasRef.current.toDataURL('image/png');
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${waitlist.name || 'waitlist'}-qrcode.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Download Started",
        description: "QR code image download started",
        variant: "success",
      });
    } catch (err) {
      console.error("Error downloading QR code:", err);
      toast({
        title: "Download Failed",
        description: "Could not download QR code image",
        variant: "destructive",
      });
    }
  };

  // Generate shareable image
  const generateShareImage = async () => {
    if (!shareImageRef.current) return;
    
    setIsGeneratingImage(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(shareImageRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        width: 1200,
        height: 630,
      });
      
      // Create download link
      const downloadLink = document.createElement('a');
      downloadLink.href = dataUrl;
      downloadLink.download = `${waitlist.name || 'waitlist'}-share.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: "Image Downloaded",
        description: "Shareable image has been downloaded",
        variant: "success",
      });
    } catch (err) {
      console.error("Error generating share image:", err);
      toast({
        title: "Image Generation Failed",
        description: "Could not generate shareable image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Toggle QR code display
  const toggleQrCode = () => {
    setShowQrCode(!showQrCode);
    if (showShareImage) setShowShareImage(false);
  };
  
  // Toggle share image display
  const toggleShareImage = () => {
    setShowShareImage(!showShareImage);
    if (showQrCode) setShowQrCode(false);
  };
  
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
    const shareUrls = getSocialShareUrls({
      url: waitlistUrl,
      title: waitlist?.name || 'Join our waitlist',
      description: `Join my waitlist: ${waitlist?.name || 'New waitlist'}`
    });
    window.open(shareUrls.twitter, '_blank');
  };
  
  const shareOnFacebook = () => {
    const shareUrls = getSocialShareUrls({
      url: waitlistUrl,
      title: waitlist?.name || 'Join our waitlist',
      description: waitlist?.description || 'Sign up to get early access'
    });
    window.open(shareUrls.facebook, '_blank');
  };
  
  const shareOnLinkedIn = () => {
    const shareUrls = getSocialShareUrls({
      url: waitlistUrl,
      title: waitlist?.name || 'Join our waitlist',
      description: waitlist?.description || 'Sign up to get early access'
    });
    window.open(shareUrls.linkedin, '_blank');
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
            <div className="flex flex-wrap gap-2">
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
              <Button onClick={toggleQrCode} variant="outline" size="sm">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
              <Button onClick={toggleShareImage} variant="outline" size="sm">
                <ImageIcon className="h-4 w-4 mr-2" />
                Share Image
              </Button>
            </div>
          </div>
          
          {showQrCode && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">QR Code</h3>
              <div className="flex flex-col items-center gap-3">
                {qrCodeUrl ? (
                  <>
                    <div className="bg-white p-3 rounded-md">
                      <img 
                        src={qrCodeUrl} 
                        alt="Waitlist QR Code" 
                        className="w-48 h-48"
                      />
                      <canvas ref={qrCanvasRef} className="hidden" width="300" height="300"></canvas>
                    </div>
                    <Button onClick={downloadQRCode} variant="secondary" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Use this QR code on printed materials or displays to let people easily join your waitlist
                    </p>
                  </>
                ) : (
                  <div className="w-48 h-48 bg-muted animate-pulse flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Generating QR code...</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {showShareImage && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="text-sm font-medium mb-3">Shareable Image</h3>
              <div className="flex flex-col items-center gap-3">
                <div 
                  ref={shareImageRef} 
                  className="relative w-full aspect-[1200/630] bg-white p-8 rounded-md overflow-hidden shadow-sm"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex flex-col space-y-4">
                      <div className="text-3xl font-bold text-blue-900">{waitlist.name}</div>
                      <div className="text-lg text-gray-700">
                        {waitlist.description || "Join our exclusive waitlist"}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-6">
                      <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                        {qrCodeUrl && (
                          <img 
                            src={qrCodeUrl} 
                            alt="QR Code" 
                            className="w-20 h-20 mr-3"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">Scan to join the waitlist</div>
                          <div className="text-xs text-gray-500 break-all">{waitlistUrl}</div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-right text-gray-500">
                        Powered by Vibelist
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={generateShareImage} 
                  variant="secondary" 
                  size="sm"
                  disabled={isGeneratingImage}
                >
                  {isGeneratingImage ? (
                    <>
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download Image
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-1">
                  Download this image to share on social media or in marketing materials
                </p>
              </div>
            </div>
          )}
          
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