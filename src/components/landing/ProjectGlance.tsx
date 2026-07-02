"use client";

import Image from "next/image";
import { CheckCircle2, Clock, Copy, MessageSquare, TrendingUp } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { avatars, projectCards, type ProjectCard } from "./landing-data";

/* ─── Extended card data ────────────────────────────────────────────────── */

const extendedCards = [
  { ...projectCards[0], progress: 68, status: "In Progress" as const, daysLeft: 3 },
  { ...projectCards[1], progress: 45, status: "In Review" as const, daysLeft: 7 },
  { ...projectCards[2], progress: 82, status: "In Progress" as const, daysLeft: 2 },
  { ...projectCards[3], progress: 25, status: "Planning" as const, daysLeft: 14 },
];

/* ─── Style maps ────────────────────────────────────────────────────────── */

const priorityCfg: Record<
  ProjectCard["tone"],
  { bar: string; badge: string; ring: string; fill: string }
> = {
  blue: {
    bar: "bg-[#ffd400]",
    badge: "bg-[#fff5b8] text-[#7a6300]",
    ring: "hover:ring-[#ffd400]/40",
    fill: "bg-[#ffd400]",
  },
  green: {
    bar: "bg-[#22c55e]",
    badge: "bg-[#dcfce7] text-[#15803d]",
    ring: "hover:ring-[#22c55e]/40",
    fill: "bg-[#22c55e]",
  },
  orange: {
    bar: "bg-[#f97316]",
    badge: "bg-[#ffedd5] text-[#c2410c]",
    ring: "hover:ring-[#f97316]/40",
    fill: "bg-[#f97316]",
  },
};

const statusCfg = {
  "In Progress": { Icon: TrendingUp, color: "text-[#b08900]" },
  "In Review": { Icon: CheckCircle2, color: "text-[#22c55e]" },
  Planning: { Icon: Clock, color: "text-[#a09580]" },
} as const;

/* ─── Motion variants ───────────────────────────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};

const card = {
  hidden: { opacity: 0, y: 38, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ProjectGlance() {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, margin: "-60px" });

  return (
    <section
      id="project-glance"
      className="relative overflow-hidden bg-[#f7f6ef] px-5 py-24 sm:px-8 lg:px-16"
    >
      {/* Subtle warm divider lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#e8e0c8]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#e8e0c8]"
      />

      {/* ── Header ── */}
      <div className="relative mx-auto max-w-3xl text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.88, y: 14 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-[#111111] shadow-sm"
        >
          <span className="size-2 rounded-full bg-[#ffd400]" aria-hidden="true" />
          Project intelligence
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="mt-5 text-4xl font-black leading-[1.08] text-[#111111] sm:text-5xl"
        >
          All your projects at a glance
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 text-sm font-medium leading-relaxed text-[#68645b]"
        >
          Real-time visibility across every active project — priority, progress, and team, all in one place.
        </motion.p>
      </div>

      {/* ── Cards ── */}
      <motion.div
        ref={gridRef}
        variants={container}
        initial="hidden"
        animate={inView ? "show" : "hidden"}
        className="relative mx-auto mt-14 grid max-w-[1200px] gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {extendedCards.map((proj, i) => {
          const p = priorityCfg[proj.tone];
          const { Icon: StatusIcon, color: statusColor } = statusCfg[proj.status];
          const urgent = proj.daysLeft <= 3;

          return (
            <motion.article
              key={proj.title}
              variants={card}
              className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#e8e0c8] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:ring-2 ${p.ring}`}
            >
              {/* Priority colour strip */}
              <div className={`h-[3px] w-full ${p.bar}`} />

              <div className="flex flex-1 flex-col p-5">
                {/* Badge row */}
                <div className="flex items-center justify-between">
                  <span className={`rounded-md px-2.5 py-1 text-[11px] font-black ${p.badge}`}>
                    {proj.priority}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${statusColor}`}>
                    <StatusIcon className="size-3" aria-hidden="true" />
                    {proj.status}
                  </span>
                </div>

                {/* Title */}
                <h3 className="mt-4 text-[15px] font-black leading-snug text-[#111111]">
                  {proj.title}
                </h3>

                {/* Body */}
                <p className="mt-2 flex-1 text-xs font-medium leading-relaxed text-[#68645b]">
                  {proj.body}
                </p>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#a09580]">
                      Progress
                    </span>
                    <span className="text-[11px] font-black text-[#111111]">
                      {proj.progress}%
                    </span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded-full bg-[#e8e0c8]">
                    <motion.div
                      className={`h-full rounded-full ${p.fill}`}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${proj.progress}%` } : { width: 0 }}
                      transition={{
                        delay: 0.35 + i * 0.1,
                        duration: 1.0,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-[#e8e0c8] pt-4">
                  {/* Avatars */}
                  <div className="flex">
                    {avatars.slice(0, 2).map((src, j) => (
                      <Image
                        key={src}
                        src={src}
                        alt=""
                        width={26}
                        height={26}
                        className="-mr-2 rounded-full border-2 border-white"
                        style={{ zIndex: 2 - j }}
                      />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-[#a09580]">
                    <span className="inline-flex items-center gap-0.5">
                      <MessageSquare className="size-3" aria-hidden="true" />
                      10
                    </span>
                    <span className="inline-flex items-center gap-0.5">
                      <Copy className="size-3" aria-hidden="true" />
                      3
                    </span>
                    <span className={`font-black ${urgent ? "text-[#f97316]" : "text-[#a09580]"}`}>
                      {proj.daysLeft}d left
                    </span>
                  </div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </motion.div>
    </section>
  );
}
