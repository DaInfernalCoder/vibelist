"use client";

import { MessageSquare } from "lucide-react";

// Insighto feedback button that opens the feedback board in a new tab
const ButtonInsighto = () => {
  const handleClick = () => {
    window.open(
      "https://insigh.to/b/vibelist",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 btn btn-primary btn-sm gap-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
      data-tooltip-id="tooltip"
      data-tooltip-content="Share feedback or suggest features"
      title="Share feedback"
    >
      <MessageSquare className="w-4 h-4" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
};

export default ButtonInsighto;
