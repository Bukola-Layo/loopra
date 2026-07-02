import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type MarketingLayoutProps = {
  children: ReactNode;
};

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <img
              src="/images/illustrations/loopra-logo.svg"
              alt="Loopra"
              className="h-8 w-auto"
            />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-black text-white pt-24 pb-0 relative overflow-hidden mt-auto">
        {/* Email illustration container */}
        <div className="relative flex justify-center mb-16">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[hsl(348,83%,55%)]/20 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 w-32 h-32 bg-[#0c0c0c] rounded-[1.5rem] border border-zinc-800 shadow-2xl flex items-center justify-center overflow-hidden group cursor-pointer hover:border-zinc-700 transition-colors">
            {/* The actual mail icon in primary color */}
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(348,83%,55%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_8px_hsla(348,83%,55%,0.5)]">
              <rect width="20" height="16" x="2" y="4" rx="2"></rect>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
            </svg>
            
            {/* Circuit-like lines mimicking the image */}
            <div className="absolute top-[-10px] left-[60%] w-[1px] h-[40px] bg-zinc-800"></div>
            <div className="absolute top-[-10px] left-[40%] w-[1px] h-[30px] bg-zinc-800"></div>
            <div className="absolute bottom-[-10px] left-[30%] w-[1px] h-[30px] bg-zinc-800"></div>
            <div className="absolute top-[40%] left-[-10px] w-[30px] h-[1px] bg-zinc-800"></div>
            <div className="absolute bottom-[30%] right-[-10px] w-[30px] h-[1px] bg-zinc-800"></div>
            
            {/* Small glowing dots */}
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-[hsl(348,83%,55%)] shadow-[0_0_4px_hsla(348,83%,55%,0.8)]"></div>
            <div className="absolute bottom-6 left-6 w-1 h-1 rounded-full bg-[hsl(348,83%,55%)] opacity-50"></div>
          </div>
          
          {/* External circuit dots/lines (simplified) */}
          <div className="absolute top-0 right-[40%] w-3 h-3 rounded-sm border border-zinc-700 bg-zinc-900 opacity-50"></div>
          <div className="absolute bottom-4 left-1/4 w-4 h-4 rounded-sm border border-[hsl(348,83%,55%)] bg-[hsl(348,83%,55%)]/10 shadow-[0_0_8px_hsla(348,83%,55%,0.3)]"></div>
          <div className="absolute top-1/4 right-[30%] w-2 h-2 rounded-sm border border-zinc-700 bg-zinc-900 opacity-50"></div>
        </div>

        {/* The main footer grid structure with borders */}
        <div className="container max-w-[1200px] mx-auto px-4 sm:px-8 border-t border-zinc-800/60">
          

          
          {/* Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 min-h-[300px]">
            {/* Column 1 */}
            <div className="p-6 md:p-8 border-r border-zinc-800/60 space-y-6">
              <h4 className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">About Us</h4>
              <ul className="space-y-4">
                {["Pricing", "Contact", "FAQ", "Blog"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 2 */}
            <div className="p-6 md:p-8 md:border-r border-zinc-800/60 space-y-6">
              <h4 className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Support</h4>
              <ul className="space-y-4">
                {["Help Center", "Terms", "Privacy", "Security"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 3 */}
            <div className="p-6 md:p-8 border-r border-zinc-800/60 space-y-6">
              <h4 className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Community</h4>
              <ul className="space-y-4">
                {["Forum", "Events", "Partners", "Affiliates", "Career"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Column 4 */}
            <div className="p-6 md:p-8 space-y-6">
              <h4 className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Press</h4>
              <ul className="space-y-4">
                {["Investors", "Terms of Use", "Privacy Policy", "Cookie Policy", "Legal"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Copyright Row */}
          <div className="border-t border-zinc-800/60 py-6 text-center text-sm text-zinc-500 flex flex-col md:flex-row justify-between items-center px-4 md:px-8">
            <p>&copy; {new Date().getFullYear()} Loopra. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Developed by <span className="text-zinc-300 font-medium">Bukola Akintomide</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
