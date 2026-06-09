import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AuthGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
