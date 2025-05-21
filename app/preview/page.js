import { Suspense } from "react";
import PreviewContent from "./PreviewContent";

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
