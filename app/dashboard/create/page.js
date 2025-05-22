"use client";

import { useRouter } from "next/navigation";
import WaitlistEditor from "./waitlist-editor";

export default function CreateWaitlist() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Waitlist</h1>
        <p className="text-muted-foreground mt-2">
          Create a new waitlist for your product or service.
        </p>
      </div>

      <WaitlistEditor />
    </div>
  );
}
