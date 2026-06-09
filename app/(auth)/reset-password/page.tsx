"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return (
      <AuthLayout
        title="Invalid reset link"
        subtitle="The password reset link is missing or invalid"
      >
        <div className="space-y-4">
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-role-error-light)",
              color: "var(--color-role-error)",
            }}
          >
            This password reset link is invalid. Please request a new one.
          </div>
          <Link href="/auth/forgot-password" className="block w-full">
            <Button className="w-full">Request new link</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong");
      setIsLoading(false);
      return;
    }

    router.push("/login?passwordReset=true");
  }

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Enter a new password for your account"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error && (
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-role-error-light)",
              color: "var(--color-role-error)",
            }}
          >
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Create a strong password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Know your password?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
