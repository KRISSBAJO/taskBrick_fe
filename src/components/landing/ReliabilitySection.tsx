"use client";

import Image from "next/image";
import { Activity, CheckCircle2, Lock, ShieldCheck, Zap } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ─── Data ──────────────────────────────────────────────────────────────── */

const bullets = [
  {
    Icon: Activity,
    text: "Automatic failover with zero-downtime deployments across all regions.",
  },
  {
    Icon: Lock,
    text: "End-to-end 256-bit encryption — data protected at rest and in transit.",
  },
  {
    Icon: Zap,
    text: "24/7 infrastructure monitoring with sub-60-second incident response.",
  },
];

const metrics = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "<100ms", label: "API response" },
  { value: "0", label: "Data breaches" },
];

/* ─── Animation helpers ─────────────────────────────────────────────────── */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.55, ease: "easeOut" as const },
});

/* ─── Component ─────────────────────────────────────────────────────────── */

export function ReliabilitySection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="about"
      className="relative overflow-hidden bg-[#111111] px-5 py-24 text-white sm:px-8 lg:px-16"
    >
      {/* Dot-grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Ambient glow — right */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-[#ffd400]/6 blur-[110px]"
      />

      {/* ── Main grid ── */}
      <div
        ref={ref}
        className="relative mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-2"
      >
        {/* ── Left: Copy ── */}
        <div>
          {/* Badge */}
          <motion.span
            {...fadeUp(0)}
            animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-[#ffd400] px-4 py-2 text-sm font-black text-[#111111]"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Security-first platform
          </motion.span>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.12, duration: 0.55, ease: "easeOut" }}
            className="mt-6 max-w-lg text-4xl font-black leading-[1.1] text-white sm:text-5xl"
          >
            Built for{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[#ffd400]">reliability</span>
            </span>{" "}
            and trust
          </motion.h2>

          {/* Bullet list */}
          <ul className="mt-8 space-y-4">
            {bullets.map(({ Icon, text }, i) => (
              <motion.li
                key={text}
                initial={{ opacity: 0, x: -22 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.22 + i * 0.1, duration: 0.5, ease: "easeOut" }}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#ffd400]/12 text-[#ffd400]">
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <span className="text-sm font-medium leading-relaxed text-white/65">
                  {text}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* Metrics strip */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.54, duration: 0.55, ease: "easeOut" }}
            className="mt-10 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8"
          >
            {metrics.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center bg-[#111111] px-4 py-5 text-center"
              >
                <p className="text-2xl font-black text-white">{value}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/38">
                  {label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: Image + floating badges ── */}
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
          className="relative"
        >
          {/* Main image */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <Image
              src="/figma/reliability.jpg"
              alt="A person working on logaXP"
              width={600}
              height={500}
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />
          </div>

          {/* Floating: Live status — top left */}
          <motion.div
            initial={{ opacity: 0, x: -18, y: -10 }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="absolute -left-4 top-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/65 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md sm:-left-6"
          >
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-70" />
              <span className="relative inline-flex size-2.5 rounded-full bg-[#22c55e]" />
            </span>
            <div>
              <p className="text-[11px] font-black text-white">All systems operational</p>
              <p className="mt-0.5 text-[10px] text-white/45">Updated just now</p>
            </div>
          </motion.div>

          {/* Floating: Uptime — top right */}
          <motion.div
            initial={{ opacity: 0, x: 18, y: -10 }}
            animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="absolute -right-4 top-8 flex flex-col items-center rounded-2xl border border-white/10 bg-black/65 px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-md sm:-right-6"
          >
            <p className="text-2xl font-black text-[#ffd400]">99.9%</p>
            <p className="mt-0.5 text-[10px] font-semibold text-white/45">Uptime</p>
          </motion.div>

          {/* Floating: Live operations — bottom bar */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/65 p-4 backdrop-blur-md"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ffd400]/15">
              <CheckCircle2 className="size-4 text-[#ffd400]" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-black text-[#ffd400]">Live operations</p>
              <p className="text-xs text-white/60">
                Continuous monitoring, secure sessions, and high availability.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
