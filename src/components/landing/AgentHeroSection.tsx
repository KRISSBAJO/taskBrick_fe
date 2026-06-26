"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot, CalendarCheck, CheckCircle2, LayoutGrid, ShieldCheck, Workflow } from "lucide-react";
import { motion } from "framer-motion";

const commandStats = [
  ["Projects", "48"],
  ["Open tasks", "312"],
  ["Approvals", "27"],
  ["AI actions", "1.8k"],
] as const;

const workItems = [
  { title: "Sprint planning", meta: "Capacity ready", tone: "bg-[#e8f7ec] text-[#08743e]" },
  { title: "Risk scan", meta: "3 items need owner", tone: "bg-[#fff4cc] text-[#8a6500]" },
  { title: "Meeting actions", meta: "12 synced tasks", tone: "bg-[#eef4ff] text-[#0256ff]" },
] as const;

export function AgentHeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden bg-[#f7f6ef] px-5 pb-16 pt-16 text-[#111111] sm:px-8 lg:px-16 lg:pb-20 lg:pt-20"
    >
      <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
        <Image
          src="/product/board2.png"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-[0.08] blur-[1px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,#f7f6ef_0%,rgba(247,246,239,0.94)_44%,rgba(247,246,239,0.76)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#f7f6ef] to-transparent" />
      </div>

      <div className="mx-auto grid min-h-[calc(100dvh-72px)] max-w-[1440px] items-center gap-12 py-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1.08fr)]">
        <div className="relative z-10 max-w-[680px]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/80 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#68645b] shadow-sm backdrop-blur"
          >
            <span className="size-2 rounded-full bg-[#ffd400]" />
            Enterprise project command
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 max-w-[720px] text-[52px] font-extrabold leading-[0.98] tracking-[-0.02em] text-[#111111] sm:text-[72px] lg:text-[88px]"
          >
            TaskBricks
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="mt-6 max-w-[590px] text-lg font-semibold leading-8 text-[#4f4b43] sm:text-xl"
          >
            Run projects, sprints, meetings, approvals, internal mail, and AI-assisted delivery from one secure workspace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/signup"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[#ffd400] px-6 text-sm font-extrabold text-[#111111] shadow-[0_18px_42px_rgba(255,212,0,0.22)] transition hover:-translate-y-0.5 hover:bg-[#f2c200]"
            >
              Create workspace <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-md border border-black/[0.12] bg-white/82 px-6 text-sm font-extrabold text-[#111111] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-black/[0.22]"
            >
              Open dashboard
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.55 }}
            className="mt-8 grid max-w-[620px] grid-cols-2 overflow-hidden rounded-md border border-black/[0.08] bg-white/82 shadow-[0_20px_70px_rgba(17,17,17,0.08)] backdrop-blur md:grid-cols-4"
          >
            {commandStats.map(([label, value], index) => (
              <div key={label} className={`px-5 py-4 ${index > 0 ? "border-l border-black/[0.06]" : ""}`}>
                <p className="text-2xl font-extrabold tracking-[-0.02em] text-[#111111]">{value}</p>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#68645b]">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.14, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="absolute -inset-8 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_65%_18%,rgba(255,212,0,0.22),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(2,86,255,0.13),transparent_32%)] blur-2xl" />
          <div className="overflow-hidden rounded-[28px] border border-black/[0.08] bg-[#111111] shadow-[0_34px_100px_rgba(17,17,17,0.22)]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 text-white">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/40">Live workspace</p>
                <p className="mt-1 text-lg font-extrabold">Delivery command center</p>
              </div>
              <span className="rounded-full bg-[#ffd400] px-3 py-1 text-[11px] font-extrabold text-[#111111]">Live</span>
            </div>

            <div className="grid gap-4 bg-[#f3f1e8] p-4 sm:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-md bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-extrabold text-[#111111]">
                    <LayoutGrid className="size-4 text-[#0256ff]" aria-hidden="true" />
                    Board health
                  </span>
                  <span className="text-xs font-extrabold text-[#0f8a45]">92%</span>
                </div>
                <div className="mt-5 space-y-3">
                  {workItems.map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-md border border-black/[0.06] bg-[#fbfaf6] p-3">
                      <span className={`flex size-9 items-center justify-center rounded-md ${item.tone}`}>
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-extrabold text-[#111111]">{item.title}</span>
                        <span className="block truncate text-xs font-semibold text-[#68645b]">{item.meta}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-white p-4">
                <div className="grid grid-cols-3 gap-2">
                  <HeroMetric icon={Workflow} label="Sprints" value="7" />
                  <HeroMetric icon={CalendarCheck} label="Meetings" value="18" />
                  <HeroMetric icon={ShieldCheck} label="Controls" value="24" />
                </div>
                <div className="mt-4 overflow-hidden rounded-md border border-black/[0.06] bg-[#fbfaf6]">
                  <Image
                    src="/product/project.png"
                    alt="TaskBricks project workspace preview"
                    width={1280}
                    height={720}
                    priority
                    className="h-auto w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-md bg-[#111111] px-4 py-3 text-white">
                  <span className="inline-flex items-center gap-2 text-sm font-extrabold">
                    <Bot className="size-4 text-[#ffd400]" aria-hidden="true" />
                    AI action review
                  </span>
                  <span className="text-xs font-extrabold text-[#ffd400]">5 ready</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Workflow;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-[#f3f1e8] p-3">
      <Icon className="size-4 text-[#0256ff]" aria-hidden="true" />
      <p className="mt-3 text-2xl font-extrabold tracking-[-0.02em] text-[#111111]">{value}</p>
      <p className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#68645b]">{label}</p>
    </div>
  );
}
