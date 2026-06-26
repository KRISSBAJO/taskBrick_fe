"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, LayoutGrid, ShieldCheck, Workflow } from "lucide-react";
import { motion } from "framer-motion";

const commandStats = [
  ["Projects", "48"],
  ["Open tasks", "312"],
  ["Approvals", "27"],
  ["AI actions", "1.8k"],
] as const;

const capabilities = [
  { icon: LayoutGrid, label: "Boards" },
  { icon: Workflow, label: "Sprints" },
  { icon: ShieldCheck, label: "Approvals" },
  { icon: Bot, label: "AI" },
] as const;

export function AgentHeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden border-b border-black/[0.06] bg-[#f7f6ef] px-5 pb-14 pt-10 text-[#111111] sm:px-8 lg:px-16 lg:pb-16 lg:pt-12"
    >
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
        <Image
          src="/product/board2.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-[0.045]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,246,239,0.96)_0%,rgba(247,246,239,0.9)_58%,#f7f6ef_100%)]" />
      </div>

      <div className="mx-auto max-w-[1180px]">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/84 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#68645b] shadow-sm backdrop-blur"
        >
          <span className="size-2 rounded-full bg-[#ffd400]" />
          Enterprise project command
        </motion.div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_360px] lg:items-end">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[760px] text-[48px] font-extrabold leading-[0.98] tracking-[-0.02em] text-[#111111] sm:text-[70px] lg:text-[78px]"
            >
              TaskBricks
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="mt-5 max-w-[650px] text-lg font-semibold leading-8 text-[#4f4b43] sm:text-xl"
            >
              A secure delivery workspace for projects, sprints, meetings, approvals, internal mail, and AI-assisted operations.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.5 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/signup"
                className="inline-flex h-12 items-center gap-2 rounded-md bg-[#ffd400] px-6 text-sm font-extrabold text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.2)] transition hover:-translate-y-0.5 hover:bg-[#f2c200]"
              >
                Create workspace <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center gap-2 rounded-md border border-black/[0.12] bg-white/86 px-6 text-sm font-extrabold text-[#111111] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-black/[0.22]"
              >
                Open dashboard
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="grid grid-cols-2 gap-2 rounded-md border border-black/[0.08] bg-white/82 p-2 shadow-[0_20px_70px_rgba(17,17,17,0.07)] backdrop-blur"
          >
            {capabilities.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-md bg-[#f3f1e8] px-3 py-3">
                <span className="flex size-8 items-center justify-center rounded-md bg-white text-[#0256ff] shadow-sm">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-extrabold text-[#111111]">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.55 }}
          className="mt-9 grid overflow-hidden rounded-md border border-black/[0.08] bg-white/88 shadow-[0_18px_60px_rgba(17,17,17,0.07)] backdrop-blur md:grid-cols-[1fr_420px]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4">
            {commandStats.map(([label, value], index) => (
              <div
                key={label}
                className={`px-5 py-5 ${index > 0 ? "md:border-l md:border-black/[0.06]" : ""} ${index > 1 ? "border-t border-black/[0.06] md:border-t-0" : ""}`}
              >
                <p className="text-2xl font-extrabold tracking-[-0.02em] text-[#111111]">{value}</p>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#68645b]">{label}</p>
              </div>
            ))}
          </div>

          <div className="hidden items-center gap-3 border-l border-black/[0.06] bg-[#fbfaf6] px-5 py-4 md:flex">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e8f7ec] text-[#08743e]">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#111111]">Live workspace health</p>
              <p className="truncate text-xs font-semibold text-[#68645b]">Boards, meetings, and controls stay in sync.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
