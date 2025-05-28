"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWaitlistUrl } from "@/lib/url-utils";

const WaitlistLinkCard = ({ waitlist, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const waitlistUrl = waitlist?.url_slug
    ? getWaitlistUrl(waitlist.url_slug)
    : "";

  const handleCopy = async () => {
    if (!waitlistUrl) return;

    try {
      await navigator.clipboard.writeText(waitlistUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = waitlistUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVisit = () => {
    if (waitlistUrl) {
      window.open(waitlistUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse flex-1"></div>
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!waitlist?.url_slug) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <LinkIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Waitlist Link</h3>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-dashed">
          <p className="text-gray-500 text-center">
            No public URL available - waitlist may not be published yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <LinkIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Waitlist Link
              </h3>
              <p className="text-sm text-gray-500">
                Share this link to let people join your waitlist
              </p>
            </div>
          </div>
        </div>

        {/* URL Display */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-gray-700 break-all">
                {waitlistUrl}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCopy}
            className={`flex-1 transition-all duration-200 ${
              copied
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
            size="lg"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleVisit}
            className="px-4 hover:bg-gray-50"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WaitlistLinkCard;
