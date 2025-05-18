"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function CreateWaitlist() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template: "basic",
    collectEmail: true,
    collectName: true,
    collectPhone: false,
    collectCustomFields: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSwitchChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call to create a new waitlist
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would send the formData to your API here
      console.log("Creating waitlist with data:", formData);

      // Redirect to the dashboard after successful creation
      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating waitlist:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Waitlist</h1>
        <p className="text-muted-foreground mt-2">
          Create a new waitlist for your product or service.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for your waitlist.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Waitlist Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="My Awesome Product Waitlist"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a description for your waitlist..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={formData.template}
                  onValueChange={(value) =>
                    handleSelectChange("template", value)
                  }
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="referral">Referral Program</SelectItem>
                    <SelectItem value="exclusive">Exclusive Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Waitlist Fields</CardTitle>
              <CardDescription>
                Configure what information to collect from users.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collectEmail">Email Address</Label>
                  <p className="text-sm text-muted-foreground">
                    Required for all waitlists
                  </p>
                </div>
                <Switch id="collectEmail" checked={true} disabled />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collectName">Full Name</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect users&apos; names
                  </p>
                </div>
                <Switch
                  id="collectName"
                  checked={formData.collectName}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("collectName", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collectPhone">Phone Number</Label>
                  <p className="text-sm text-muted-foreground">
                    Collect phone numbers
                  </p>
                </div>
                <Switch
                  id="collectPhone"
                  checked={formData.collectPhone}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("collectPhone", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="collectCustomFields">Custom Fields</Label>
                  <p className="text-sm text-muted-foreground">
                    Add custom fields for your waitlist
                  </p>
                </div>
                <Switch
                  id="collectCustomFields"
                  checked={formData.collectCustomFields}
                  onCheckedChange={(checked) =>
                    handleSwitchChange("collectCustomFields", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.push("/dashboard")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="loading loading-spinner loading-xs mr-2"></span>
            ) : null}
            Create Waitlist
          </Button>
        </div>
      </form>
    </div>
  );
}
