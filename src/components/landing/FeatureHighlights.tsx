"use client";

import React, { useRef } from "react";
import { ShieldCheck, TrendingUp, Zap, Lock, CheckCircle2 } from "lucide-react";
import { motion, useInView, useSpring, useTransform, useMotionValue } from "framer-motion";

type Feature = {
  number: string;
  eyebrow: string;
  title: string;
  text: string;
  icon: React.ElementType;
  tags: readonly string[];
  accent: string;
};

const FEATURES: readonly Feature[] = [
  {
    number: "01",
    eyebrow: "Workspace Security",
    title: "Scoped, secure team spaces",
    text: "Role-based access tokens and cryptographic workspace boundaries isolate your team data layers safely by default.",
    icon: ShieldCheck,
    tags: ["Owner", "Admin", "Member"],
    accent: "#6d5dd3",
  },
  {
    number: "02",
    eyebrow: "Sprint Execution",
    title: "Ship tasks at full velocity",
    text: "Dynamic execution blocks, live owner metrics, and synchronized state transitions keep delivery loops perfectly transparent.",
    icon: Zap,
    tags: ["In Progress", "Review", "Done"],
    accent: "#d97706",
  },
  {
    number: "03",
    eyebrow: "Team Analytics",
    title: "Metrics that move teams forward",
    text: "Continuous velocity arrays and structural charts compile automatically right from active project workspaces.",
    icon: TrendingUp,
    tags: ["Velocity", "Burndown", "Throughput"],
    accent: "#059669",
  },
] as const;

export function FeatureHighlights() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, margin: "-120px" });

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden border-t border-black/[0.03] bg-[#fffdf3] px-6 py-32 text-[#111111] antialiased sm:px-8 lg:px-16"
    >
      {/* Light Technical Layout Grid background */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.012)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1240px]">
        {/* Header Telemetry Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 border-b border-black/[0.05] pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
        >
          <div>
            <div className="inline-flex h-6 items-center gap-2 rounded-full border border-black/[0.06] bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 shadow-sm">
              <span className="size-1.5 rounded-full bg-[#ffd400]" aria-hidden="true" />
              Product Capabilities
            </div>
            <h2 className="mt-4 text-3xl font-light tracking-tight text-[#111111] sm:text-4xl lg:text-5xl leading-[1.1]">
              Engineered to speed up execution.
            </h2>
          </div>
          <p className="max-w-[340px] text-[13px] font-medium leading-relaxed text-[#55555e]">
            Structure your milestones, decouple workflow latencies, and optimize delivery metrics inside a unified grid interface.
          </p>
        </motion.div>

        {/* Bento Grid Space */}
        <motion.div
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-6 lg:grid-cols-12"
        >
          {/* Feature 01 — Tall Core Column */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
            className="lg:col-span-5"
          >
            <FeatureCard feature={FEATURES[0]} index={0} />
          </motion.div>

          {/* Features 02 + 03 — Stacked Right Row Slices */}
          <div className="grid gap-6 lg:col-span-7">
            {[FEATURES[1], FEATURES[2]].map((f, i) => (
              <motion.div
                key={f.number}
                variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } }}
              >
                <FeatureCard feature={f} index={i + 1} isWide />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index, isWide = false }: { feature: Feature; index: number; isWide?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const Icon = feature.icon;

  // Fluid continuous mouse mechanics mapping variables
  const mX = useMotionValue(0);
  const mY = useMotionValue(0);
  const springX = useSpring(mX, { stiffness: 90, damping: 20 });
  const springY = useSpring(mY, { stiffness: 90, damping: 20 });
  
  const transformX = useTransform(springX, [-0.5, 0.5], [-4, 4]);
  const transformY = useTransform(springY, [-0.5, 0.5], [-4, 4]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mX.set((e.clientX - rect.left) / rect.width - 0.5);
    mY.set((e.clientY - rect.top) / rect.height - 0.5);
    cardRef.current.style.setProperty("--m-x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--m-y", `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    mX.set(0);
    mY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      style={{ x: transformX, y: transformY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-white border border-black/[0.04] p-8 shadow-sm transition-all duration-500 hover:border-black/15 hover:shadow-md will-change-transform ${
        isWide ? "min-h-[260px] lg:min-h-[210px] lg:flex-row lg:items-center gap-8" : "min-h-[460px]"
      }`}
    >
      {/* Surface Spotlight Shimmer Tracker */}
      <div
        className="pointer-events-none absolute inset-0 z-10 rounded-[23px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: "radial-gradient(180px circle at var(--m-x, 50%) var(--m-y, 50%), rgba(0,0,0,0.015), transparent 85%)",
        }}
        aria-hidden="true"
      />

      {/* Typography Copy Container */}
      <div className={`relative z-20 flex flex-col justify-between h-full ${isWide ? "lg:max-w-[58%]" : ""}`}>
        <div>
          <div className="flex items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-black/[0.04] bg-neutral-50 shadow-inner"
              style={{ color: feature.accent }}
            >
              <Icon className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {feature.eyebrow}
            </span>
          </div>

          <h3 className="mt-5 text-xl font-bold tracking-tight text-[#111111]">
            {feature.title}
          </h3>
          <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-[#55555e]">
            {feature.text}
          </p>
        </div>

        {/* Minimalist Inline Tag Chips */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-black/[0.04] bg-neutral-50/80 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#44444f]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Embedded High-Fidelity UI Micro-Animations Layout Backdrops */}
      <div className={`relative z-10 flex items-center justify-center shrink-0 ${isWide ? "w-full lg:w-[38%] h-40 lg:h-full mt-5 lg:mt-0" : "w-full h-56 mt-6"}`}>
        {index === 0 && <SecurityVisual accent={feature.accent} />}
        {index === 1 && <SprintVisual accent={feature.accent} />}
        {index === 2 && <AnalyticsVisual accent={feature.accent} />}
      </div>

      {/* Numeric Identifier Block Alignment */}
      <span
        className="absolute right-6 top-4 select-none font-light leading-none text-black/[0.035] text-[52px] pointer-events-none"
        aria-hidden="true"
      >
        {feature.number}
      </span>

      {/* Bottom Linear Progress Shimmer Component */}
      <div className="absolute bottom-0 inset-x-0 h-[2px] w-full overflow-hidden bg-black/[0.02] z-20">
        <motion.div
          className="h-full w-full origin-left scale-x-[0.25] rounded-full transition-transform duration-500 ease-[0.16,1,0.3,1] group-hover:scale-x-100"
          style={{ backgroundColor: feature.accent }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Procedural Micro-Interactions Layouts ────────────────────────────── */

function SecurityVisual({ accent }: { accent: string }) {
  const roles = ["Owner", "Admin", "Member"] as const;
  return (
    <div className="relative w-full max-w-[240px] h-full flex flex-col items-center justify-center gap-3">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 16, ease: "linear" }}
        className="absolute size-36 rounded-full border border-dashed"
        style={{ borderColor: `${accent}20` }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        className="absolute size-24 rounded-full border border-dashed"
        style={{ borderColor: `${accent}35` }}
      />
      <motion.div
        whileHover={{ scale: 1.08 }}
        className="relative z-10 flex size-14 items-center justify-center rounded-2xl bg-white shadow-[0_12px_32px_rgba(0,0,0,0.08)] border border-black/[0.04] mb-3"
      >
        <Lock className="size-5" style={{ color: accent }} />
      </motion.div>
      <div className="relative z-10 flex gap-1.5">
        {roles.map((role, i) => (
          <motion.span
            key={role}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="rounded-full border border-black/[0.05] bg-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shadow-sm"
            style={{ color: accent }}
          >
            {role}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function SprintVisual({ accent }: { accent: string }) {
  const tasks = [
    { label: "TSK-084", state: "Done", done: true },
    { label: "TSK-102", state: "Review", done: false },
    { label: "TSK-117", state: "In Progress", done: false },
  ] as const;
  return (
    <div className="w-full max-w-[240px] h-full flex flex-col justify-center gap-2 font-mono text-[10px] text-neutral-400">
      {tasks.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.09, duration: 0.45 }}
          whileHover={{ x: 3 }}
          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-black/[0.04] shadow-sm"
        >
          <div className="flex items-center gap-2">
            {item.done ? (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            ) : (
              <span className="size-2 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            )}
            <span className="font-semibold text-neutral-700">{item.label}</span>
          </div>
          <span
            className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: item.done ? "#ecfdf5" : `${accent}14`,
              color: item.done ? "#059669" : accent,
            }}
          >
            {item.state}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function AnalyticsVisual({ accent }: { accent: string }) {
  const bars = [55, 85, 42, 95, 68, 76, 38] as const;
  return (
    <div className="w-full max-w-[240px] flex flex-col gap-2 px-2">
      <div className="flex items-end justify-between gap-1.5 h-32">
        {bars.map((val, idx) => (
          <div key={idx} className="flex-1 bg-neutral-50 border border-black/[0.03] rounded-t-lg h-full flex items-end overflow-hidden">
            <motion.div
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: val / 100 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full origin-bottom rounded-t-md"
              style={{
                height: "100%",
                background: `linear-gradient(to top, ${accent}18, ${accent}d0)`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Velocity</span>
        <span className="text-[10px] font-black" style={{ color: accent }}>+24%</span>
      </div>
    </div>
  );
}
