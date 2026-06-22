"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setStatus("error");
        setMessage("Invalid verification link");
        return;
      }

      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`
        );

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully!");
        } else {
          const data = await response.json();
          setStatus("error");
          setMessage(data.error ?? "Failed to verify email");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <AuthLayout
      title={
        status === "verifying"
          ? "Verifying email..."
          : status === "success"
            ? "Email verified!"
            : "Verification failed"
      }
      subtitle={
        status === "verifying"
          ? "Please wait while we verify your email"
          : message
      }
    >
      {status === "verifying" && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {status === "success" && (
        <div className="space-y-4">
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-role-success-light)",
              color: "var(--color-role-success)",
            }}
          >
            Your email has been verified. You can now log in to your account.
          </div>
          <Link href="/login" className="block w-full">
            <Button className="w-full">Go to login</Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4">
          <div
            className="rounded-md px-4 py-3 text-sm"
            style={{
              backgroundColor: "var(--color-role-error-light)",
              color: "var(--color-role-error)",
            }}
          >
            {message}
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="flex-1">
              <Button className="w-full" variant="outline">
                Back to login
              </Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button className="w-full">Try again</Button>
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
