"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AcmeHeroProps = {
  className?: string;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
  },
};

const imageVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
} as const;

const primaryColor = "hsl(348, 83%, 55%)";
const accentColor = "#2cadc0";

export function AcmeHero({ className }: AcmeHeroProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.section
      ref={ref}
      className={cn(
        "relative overflow-hidden pb-8 pt-12 md:pt-16 lg:pb-10",
        className
      )}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      <FloatingOrbs />
      <GridPattern />

      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div variants={badgeVariants} className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm"
              style={{
                borderColor: `${primaryColor}30`,
                backgroundColor: `${primaryColor}08`,
                color: primaryColor,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>New — AI-powered automation is here</span>
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span className="inline-block">The easiest way to</span>{" "}
            <span className="inline-block">grow and automate</span>{" "}
            <span
              className="inline-block bg-gradient-to-r from-[hsl(348,83%,55%)] to-[#2cadc0] bg-clip-text text-transparent"
            >
              audience communication
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:mt-8"
          >
            Loopra helps creators, startups, and small businesses collect
            subscribers, send newsletters, and build automation workflows — all
            in one place.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row md:mt-10"
          >
            <Link href="/signup">
              <Button
                size="lg"
                className="group relative gap-2 overflow-hidden px-8 text-base shadow-xl transition-shadow hover:shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -z-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${primaryColor})` }}
                />
              </Button>
            </Link>
            <Link href="/#pricing">
              <Button variant="outline" size="lg" className="px-8 text-base">
                View pricing
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground md:mt-16"
          >
            {["No credit card required", "Free plan available", "Cancel anytime"].map(
              (item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="8" cy="8" r="7" fill={`${primaryColor}20`} />
                    <path
                      d="M5 8.5l2 2 4-4"
                      stroke={primaryColor}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </span>
              )
            )}
          </motion.div>
        </div>
      </div>

      <motion.div
        variants={imageVariants}
        className="container relative z-10 mt-6 max-w-6xl md:mt-8"
      >
        <DashboardImage />
      </motion.div>
    </motion.section>
  );
}

function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${primaryColor}, transparent)` }}
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, ${accentColor}, transparent)` }}
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

function GridPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <svg className="absolute h-full w-full opacity-[0.03]">
        <defs>
          <pattern
            id="hero-grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div>
  );
}

function DashboardImage() {
  return (
    <Image
      src="/images/738shots_so.png"
      alt="Loopra dashboard"
      width={1920}
      height={1280}
      className="mx-auto w-full max-w-5xl shadow-lg"
      priority
    />
  );
}
