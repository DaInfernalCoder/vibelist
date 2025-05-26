"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import WaitlistEditor from "@/app/dashboard/create/waitlist-editor";
import TemplateProvider from "@/app/dashboard/create/context/TemplateProvider";
import EditTemplateProvider from "./EditTemplateProvider";

/**
 * WaitlistEditorWithData - A wrapper component that loads existing waitlist data
 * into the waitlist editor for editing purposes
 */
export default function WaitlistEditorWithData({ waitlistData }) {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  if (!waitlistData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No waitlist data available</p>
      </div>
    );
  }

  return (
    <EditTemplateProvider waitlistData={waitlistData} waitlistId={id}>
      <WaitlistEditor isEditMode={true} />
    </EditTemplateProvider>
  );
}
