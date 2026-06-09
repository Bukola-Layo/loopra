import Link from "next/link";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
  title: string;
  subtitle?: string;
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm space-y-6 bg-[#ffffff] p-8 rounded-xl shadow-sm border">
          <div className="flex justify-center pb-2">
            <Link href="/">
              <img
                src="/images/illustrations/loopra-logo.svg"
                alt="Loopra"
                className="h-9 w-auto"
              />
            </Link>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
