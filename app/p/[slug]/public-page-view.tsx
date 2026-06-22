"use client";

import { useState, FormEvent } from "react";
import { Check, Loader2 } from "lucide-react";

type Props = {
  name: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  slug: string;
  subscriberCount: number;
  showSubscriberCount: boolean;
  settings: Record<string, unknown> | null;
  workspaceName: string;
  workspaceLogo: string | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function PublicPageView({
  name,
  description,
  logo,
  coverImage,
  slug,
  subscriberCount,
  showSubscriberCount,
  settings,
}: Props) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const accentColor = (settings?.accentColor as string) ?? "#dd2d4a";
  const layout = (settings?.layout as string) ?? "centered";
  const collectName = settings?.collectName !== false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/p/${slug}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName }),
      });
      if (!res.ok) throw new Error("Failed");
      setSubscribed(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 p-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: accentColor }}>
            <Check className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">You&apos;re subscribed!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks for joining {name}. Check your inbox for a confirmation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-50 to-zinc-100">
      {coverImage && (
        <div
          className="h-48 w-full bg-cover bg-center sm:h-64"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      )}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className={layout === "card" ? "rounded-2xl border bg-white p-8 shadow-sm" : "text-center"}>
            <div className="flex flex-col items-center">
              {logo ? (
                <img src={logo} alt={name} className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {getInitials(name)}
                </div>
              )}
              <h1 className="mt-4 text-2xl font-bold tracking-tight">{name}</h1>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground text-balance max-w-sm">
                  {description}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              {collectName && (
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none ring-0 focus:border-ring focus:ring-1 focus:ring-ring"
                />
              )}
              <input
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none ring-0 focus:border-ring focus:ring-1 focus:ring-ring"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Subscribe
              </button>
            </form>

            {showSubscriberCount && subscriberCount > 0 && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Join {subscriberCount.toLocaleString()}+ subscribers
              </p>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Powered by <span className="font-medium" style={{ color: accentColor }}>Loopra</span>
          </p>
        </div>
      </div>
    </div>
  );
}
