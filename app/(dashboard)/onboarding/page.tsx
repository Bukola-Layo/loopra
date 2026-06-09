"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const router = useRouter();

  const handleComplete = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Create workspace via API
    router.push("/dashboard");
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleComplete}>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Loopra</CardTitle>
            <CardDescription>
              Let&apos;s set up your workspace to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                placeholder="My Awesome Company"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                required
              />
            </div>
            {/* Future onboarding steps can be added here */}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Complete Setup
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
