"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const heroStats = [
  { value: "7+", label: "core modules" },
  { value: "AI", label: "smart automation" },
  { value: "RBAC", label: "tenant security" },
] as const;

export function AgentHeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden border-b border-black/[0.06] bg-[#fbfaf6] px-5 pb-12 pt-8 text-[#111111] sm:px-8 lg:px-16 lg:pb-14 lg:pt-10"
    >
      <div className="mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/84 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#68645b] shadow-sm backdrop-blur"
        >
          <span className="size-2 animate-pulse rounded-full bg-[#ffd400]" />
          AI-powered enterprise work management
        </motion.div>

        <div className="mt-7 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px]">
          <div>
           <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.04,
              duration: 0.6,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="max-w-[700px] text-[44px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#111111] sm:text-[54px] lg:text-[60px]"
          >
            Manage Projects,
            <br />
            Sprints &{" "}
            <span
              className="relative inline-block drop-shadow-[0_0_10px_rgba(255,212,0,0.25)]"
            >
              AI
              <svg
                aria-hidden="true"
                viewBox="0 0 200 10"
                className="absolute -bottom-1 left-0 w-full"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M3 7 Q50 2 100 7 Q150 12 197 7"
                  stroke="#ffd400"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <br />
            <span className="text-[#111111]">
              in One Secure Workspace.
            </span>
          </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="mt-6 max-w-[560px] text-lg leading-[1.8] text-[#4f4b43]"
            >
              Plan projects, manage agile sprints, automate approvals, collaborate through
              internal messaging, and use AI to identify risks, summarize progress, and
              accelerate delivery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#ffd400] px-6 text-sm font-extrabold text-[#111111] shadow-[0_4px_18px_rgba(255,212,0,0.48)] transition hover:-translate-y-0.5 hover:bg-[#f5ca00] hover:shadow-[0_6px_22px_rgba(255,212,0,0.55)]"
              >
                Start for free <ArrowRight className="size-4" aria-hidden="true" />
              </Link>

              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-black/[0.14] bg-white/80 px-6 text-sm font-extrabold text-[#111111] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-black/[0.24] hover:bg-white"
              >
                View demo
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.65 }}
              className="mt-8 grid max-w-[560px] grid-cols-3 divide-x divide-black/[0.08] rounded-2xl border border-black/[0.08] bg-white/72 shadow-sm backdrop-blur"
            >
              {heroStats.map((stat) => (
                <div key={stat.label} className="min-w-0 px-4 py-3">
                  <p className="text-lg font-extrabold leading-none text-[#111111]">
                    {stat.value}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8a8578]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:block"
          >
            <Image
              src="/product/test2.png"
              alt="TaskBricks dashboard preview"
              width={920}
              height={600}
              className="w-full object-contain drop-shadow-[0_40px_90px_rgba(17,17,17,0.18)]"
              priority
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}