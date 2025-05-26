"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Twitter, Facebook, Linkedin, Copy, CheckCircle } from "lucide-react";
import {
  shareOnTwitter,
  shareOnFacebook,
  shareOnLinkedIn,
  copyToClipboard,
} from "../utils/social-sharing";

const SocialShareSection = ({ url, title, customStyles }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleTwitterShare = () => {
    shareOnTwitter(url, title);
  };

  const handleFacebookShare = () => {
    shareOnFacebook(url);
  };

  const handleLinkedInShare = () => {
    shareOnLinkedIn(url, title);
  };

  const handleCopyToClipboard = () => {
    copyToClipboard(
      url,
      () => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      },
      (err) => {
        console.error("Copy failed:", err);
      }
    );
  };

  return (
    <div className="mt-8 space-y-4">
      <h3
        className="text-lg font-semibold text-center"
        style={{ color: customStyles.headingTextColor }}
      >
        Share this waitlist
      </h3>
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleTwitterShare}
          title="Share on Twitter"
          aria-label="Share on Twitter"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Twitter className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleFacebookShare}
          title="Share on Facebook"
          aria-label="Share on Facebook"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Facebook className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleLinkedInShare}
          title="Share on LinkedIn"
          aria-label="Share on LinkedIn"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          <Linkedin className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyToClipboard}
          title="Copy link"
          aria-label="Copy link"
          className="hover:text-[var(--waitlist-theme-color)] transition-colors"
        >
          {copySuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Copy className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default SocialShareSection;
