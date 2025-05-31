"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useWaitlist } from "@/contexts/WaitlistContext";
import { createClient } from "@/libs/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import WaitlistEditorWithData from "./components/WaitlistEditorWithData";

export default function EditWaitlistPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const { waitlists, selectWaitlist } = useWaitlist();

  const [waitlistData, setWaitlistData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const supabase = createClient();

  // Fetch waitlist data on component mount
  useEffect(() => {
    const fetchWaitlistData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // First try to find the waitlist in the context
        const contextWaitlist = waitlists.find((w) => w.id === id);

        if (contextWaitlist) {
          // If found in context, fetch additional customization data
          const { data: customizationData, error: customError } = await supabase
            .from("customization_settings")
            .select("*")
            .eq("waitlist_id", id)
            .single();

          if (customError && customError.code !== "PGRST116") {
            throw customError;
          }

          const fullWaitlistData = {
            ...contextWaitlist,
            customization_settings: customizationData || {},
          };

          setWaitlistData(fullWaitlistData);
          selectWaitlist(contextWaitlist);
        } else {
          // If not in context, fetch from API
          const response = await fetch(`/api/waitlists/${id}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch waitlist");
          }

          setWaitlistData(data);
          selectWaitlist(data);
        }
      } catch (err) {
        console.error("Error fetching waitlist:", err);
        setError(err.message);
        toast({
          title: "Error",
          description: "Failed to load waitlist data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchWaitlistData();
  }, [id, waitlists, supabase, selectWaitlist, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/create">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Loading Waitlist...</h1>
            <p className="text-muted-foreground mt-2">
              Please wait while we load your waitlist data.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !waitlistData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/create">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Waitlist Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The waitlist you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have permission to access it.
            </p>
          </div>
        </div>

        <div className="text-center py-12">
          <p className="text-destructive mb-4">
            {error || "Waitlist not found"}
          </p>
          <Button
            asChild
            className="text-white border-0"
            style={{ backgroundColor: "#9334E8" }}
          >
            <Link href="/dashboard/create">Create New Waitlist</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/create">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Waitlist</h1>
            <p className="text-muted-foreground mt-2">
              Editing: <span className="font-medium">{waitlistData.name}</span>
            </p>
          </div>
        </div>
      </div>

      <WaitlistEditorWithData waitlistData={waitlistData} />
    </div>
  );
}
