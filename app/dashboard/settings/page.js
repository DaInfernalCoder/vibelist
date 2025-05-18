"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);

  const [accountForm, setAccountForm] = useState({
    name: "User Name",
    email: "user@example.com",
    company: "Vibelist Inc.",
    notifications: true,
    marketing: false,
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [integrationForm, setIntegrationForm] = useState({
    mailchimpApiKey: "",
    webhookUrl: "",
    notificationEmail: "notifications@example.com",
  });

  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountForm({
      ...accountForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSecurityChange = (e) => {
    const { name, value } = e.target;
    setSecurityForm({
      ...securityForm,
      [name]: value,
    });
  };

  const handleIntegrationChange = (e) => {
    const { name, value } = e.target;
    setIntegrationForm({
      ...integrationForm,
      [name]: value,
    });
  };

  const handleSwitchChange = (name, checked) => {
    setAccountForm({
      ...accountForm,
      [name]: checked,
    });
  };

  const handleSubmit = async (e, formType) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, you would send the form data to your API
      console.log(
        `Saving ${formType} settings:`,
        formType === "account"
          ? accountForm
          : formType === "security"
          ? securityForm
          : integrationForm
      );
    } catch (error) {
      console.error(`Error saving ${formType} settings:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and waitlist settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Update your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, "account")}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={accountForm.name}
                      onChange={handleAccountChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={accountForm.email}
                      onChange={handleAccountChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={accountForm.company}
                      onChange={handleAccountChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="utc">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="utc">UTC (GMT)</SelectItem>
                        <SelectItem value="est">Eastern Time (ET)</SelectItem>
                        <SelectItem value="cst">Central Time (CT)</SelectItem>
                        <SelectItem value="pst">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Notification Preferences
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications">
                          Email Notifications
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about your waitlist activity
                        </p>
                      </div>
                      <Switch
                        id="notifications"
                        checked={accountForm.notifications}
                        onCheckedChange={(checked) =>
                          handleSwitchChange("notifications", checked)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing">Marketing Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive emails about new features and updates
                        </p>
                      </div>
                      <Switch
                        id="marketing"
                        checked={accountForm.marketing}
                        onCheckedChange={(checked) =>
                          handleSwitchChange("marketing", checked)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : null}
                    Save Account Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, "security")}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={securityForm.currentPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={securityForm.newPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={handleSecurityChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : null}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Connect Vibelist with your other tools and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => handleSubmit(e, "integrations")}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mailchimpApiKey">Mailchimp API Key</Label>
                    <Input
                      id="mailchimpApiKey"
                      name="mailchimpApiKey"
                      value={integrationForm.mailchimpApiKey}
                      onChange={handleIntegrationChange}
                      placeholder="Enter your Mailchimp API key"
                    />
                    <p className="text-sm text-muted-foreground">
                      Connect to Mailchimp to automatically sync your waitlist
                      subscribers.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhookUrl">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      name="webhookUrl"
                      value={integrationForm.webhookUrl}
                      onChange={handleIntegrationChange}
                      placeholder="https://your-app.com/webhook"
                    />
                    <p className="text-sm text-muted-foreground">
                      Get notified via webhook when users sign up for your
                      waitlist.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notificationEmail">
                      Notification Email
                    </Label>
                    <Input
                      id="notificationEmail"
                      name="notificationEmail"
                      type="email"
                      value={integrationForm.notificationEmail}
                      onChange={handleIntegrationChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for waitlist activity.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <span className="loading loading-spinner loading-xs mr-2"></span>
                    ) : null}
                    Save Integration Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
