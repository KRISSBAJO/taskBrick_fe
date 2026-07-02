"use client";

import React, { useRef, type ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bot,
  CheckCircle2,
  Gauge,
  GitBranch,
  Mail,
  MessageSquare,
  ShieldAlert,
  UserPlus,
  Workflow,
  Zap,
} from "lucide-react";
import { motion, useInView, useSpring, useTransform, useMotionValue } from "framer-motion";

type WorkflowNode = {
  icon: ElementType;
  label: string;
  meta: string;
  tone: "yellow" | "dark" | "blue" | "green" | "red" | "white";
};

const topFlow: WorkflowNode[] = [
  { icon: Zap, label: "A new request comes in", meta: "TRIGGER", tone: "yellow" },
  { icon: Bot, label: "TaskBricks checks priority, workload, and deadlines — then routes the work", meta: "SMART ROUTING", tone: "dark" },
];

const leftBranch: WorkflowNode[] = [
  { icon: ShieldAlert, label: "Escalate it to the priority queue", meta: "ESCALATION", tone: "red" },
  { icon: MessageSquare, label: "Alert the team in Slack", meta: "NOTIFICATION", tone: "blue" },
  { icon: BellRing, label: "Schedule follow-ups so nothing stalls", meta: "FOLLOW-UP", tone: "white" },
];

const rightBranch: WorkflowNode[] = [
  { icon: UserPlus, label: "Assign the best available owner", meta: "ASSIGNMENT", tone: "green" },
  { icon: Mail, label: "Confirm receipt to the requester", meta: "CONFIRMATION", tone: "white" },
  { icon: Gauge, label: "Update SLA and progress tracking", meta: "TRACKING", tone: "yellow" },
];

export function WorkflowAutomationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      id="automation"
      className="relative scroll-mt-24 overflow-hidden bg-[#0a0a0a] px-6 py-32 text-white antialiased sm:px-8 lg:px-16"
    >
      {/* Dot grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Ambient gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[#ffd400]/[0.06] blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1200px]">

        {/* Header strip */}
        <div className="mb-20 flex flex-wrap items-center justify-between gap-6 border-b border-white/[0.08] pb-8">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05] text-[#ffd400]">
              <Workflow className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">Workflow automation</h2>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-white/40">Your process runs itself</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-8 font-mono text-[11px]">
            <div className="flex items-center gap-2.5">
              <span className="text-white/40">TRIGGERS:</span>
              <span className="font-bold text-white">Every new request</span>
            </div>
            <span className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
              <span className="text-white/40">RUNS:</span>
              <span className="font-bold text-[#ffd400]">24/7, hands-free</span>
            </div>
            <span className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
              <span className="text-white/40">SETUP:</span>
              <span className="font-bold text-emerald-400">No code required</span>
            </div>
          </div>
        </div>

        {/* Graph canvas */}
        <div className="relative mx-auto max-w-[800px]">

          {/* SVG signal paths */}
          <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
            <svg className="h-full w-full overflow-visible" fill="none">
              <defs>
                <linearGradient id="traceGradientDark" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.04} />
                  <stop offset="50%" stopColor="#ffd400" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <path d="M 400 40 L 400 320" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
              <path d="M 400 200 L 210 200 L 210 320" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
              <path d="M 400 200 L 590 200 L 590 320" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />

              <motion.path
                d="M 400 40 L 400 320"
                stroke="url(#traceGradientDark)"
                strokeWidth="2"
                strokeDasharray="40 120"
                animate={{ strokeDashoffset: [-160, 160] }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              />
              <motion.path
                d="M 400 200 L 210 200 L 210 320"
                stroke="rgba(248,113,113,0.3)"
                strokeWidth="2"
                strokeDasharray="30 90"
                animate={{ strokeDashoffset: [-120, 120] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.5 }}
              />
              <motion.path
                d="M 400 200 L 590 200 L 590 320"
                stroke="rgba(52,211,153,0.3)"
                strokeWidth="2"
                strokeDasharray="30 90"
                animate={{ strokeDashoffset: [-120, 120] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear", delay: 0.5 }}
              />
            </svg>
          </div>

          {/* Root trigger block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto max-w-[460px]"
          >
            <PipelineCard node={topFlow[0]} isLarge />
          </motion.div>

          {/* Core logic transformer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto mt-16 max-w-[540px]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -top-6 left-1/2 z-20 flex size-11 -translate-x-1/2 items-center justify-center rounded-xl border border-[#ffd400]/25 bg-[#ffd400] text-[#111111] shadow-[0_0_24px_rgba(255,212,0,0.3)]"
            >
              <GitBranch className="size-4.5" />
            </motion.div>
            <div className="rounded-2xl border border-[#ffd400]/30 bg-[#ffd400]/[0.04] p-1 shadow-[0_0_40px_rgba(255,212,0,0.08)]">
              <PipelineCard node={topFlow[1]} isLarge />
            </div>
          </motion.div>

          {/* Branch columns */}
          <div className="mt-16 grid gap-8 md:grid-cols-2 md:gap-12">
            <BranchColumn label="IF BLOCKED OR AT RISK" nodes={leftBranch} delayOffset={0.2} inView={inView} />
            <BranchColumn label="IF ON TRACK" nodes={rightBranch} delayOffset={0.3} inView={inView} />
          </div>

          {/* Terminal resolved card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mx-auto mt-16 max-w-[540px]"
          >
            <div className="group/terminal relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141414] p-5 shadow-xl">
              <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-400/[0.05] to-transparent"
                animate={{ translateX: ["100%", "-100%"] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/[0.2] bg-emerald-500/[0.1] text-emerald-400">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <h4 className="text-[13.5px] font-bold tracking-wide text-white">Work delivered, everyone in the loop</h4>
                    <p className="mt-1 text-[12px] font-medium text-white/40">Owners assigned, stakeholders notified, status tracked — no manual handoffs</p>
                  </div>
                </div>
                <span className="hidden rounded-md border border-emerald-500/[0.2] bg-emerald-500/[0.1] px-2.5 py-1 font-mono text-[9px] tracking-widest text-emerald-400 sm:inline-block">
                  DONE
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTAs */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#ffd400] px-6 text-xs font-bold text-[#111111] shadow-[0_8px_24px_rgba(255,212,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f2c200]"
          >
            Start for free
            <ArrowRight className="ml-2 size-3.5" />
          </Link>
          <Link
            href="/book-demo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 text-xs font-bold text-white transition-all duration-300 hover:border-white/[0.2] hover:bg-white/[0.08]"
          >
            Book demo
          </Link>
        </div>

      </div>
    </section>
  );
}

function BranchColumn({ label, nodes, delayOffset, inView }: { label: string; nodes: WorkflowNode[]; delayOffset: number; inView: boolean }) {
  return (
    <div className="relative flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mx-auto w-fit rounded-full border border-white/[0.08] bg-white/[0.05] px-3 py-1 font-mono text-[9px] tracking-widest text-white/40">
        {label}
      </div>
      {nodes.map((node, i) => (
        <motion.div
          key={node.label}
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: delayOffset + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <PipelineCard node={node} />
        </motion.div>
      ))}
    </div>
  );
}

function PipelineCard({ node, isLarge = false }: { node: WorkflowNode; isLarge?: boolean }) {
  const elementRef = useRef<HTMLDivElement>(null);
  const Icon = node.icon;

  const mX = useMotionValue(0);
  const mY = useMotionValue(0);
  const springX = useSpring(mX, { stiffness: 100, damping: 22 });
  const springY = useSpring(mY, { stiffness: 100, damping: 22 });

  const transformX = useTransform(springX, [-0.5, 0.5], [-4, 4]);
  const transformY = useTransform(springY, [-0.5, 0.5], [-4, 4]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!elementRef.current) return;
    const bounds = elementRef.current.getBoundingClientRect();
    mX.set((e.clientX - bounds.left) / bounds.width - 0.5);
    mY.set((e.clientY - bounds.top) / bounds.height - 0.5);
    elementRef.current.style.setProperty("--m-x", `${e.clientX - bounds.left}px`);
    elementRef.current.style.setProperty("--m-y", `${e.clientY - bounds.top}px`);
  }

  function handleMouseLeave() {
    mX.set(0);
    mY.set(0);
  }

  const baseToneMap = {
    yellow: "text-[#ffd400] border-[#ffd400]/30 bg-[#ffd400]/10",
    dark: "text-[#ffd400] border-white/[0.12] bg-white/[0.06]",
    blue: "text-[#60a5fa] border-[#60a5fa]/25 bg-[#60a5fa]/10",
    green: "text-emerald-400 border-emerald-400/25 bg-emerald-400/10",
    red: "text-red-400 border-red-400/25 bg-red-400/10",
    white: "text-white/60 border-white/[0.1] bg-white/[0.04]",
  };

  return (
    <motion.div
      ref={elementRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: transformX, y: transformY }}
      className="group/card relative rounded-xl border border-white/[0.07] bg-[#141414] p-4 shadow-sm transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] will-change-transform"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background: `radial-gradient(120px circle at var(--m-x, 0px) var(--m-y, 0px), rgba(255,255,255,0.04), transparent 85%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-4">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${baseToneMap[node.tone]}`}>
          <Icon className={isLarge ? "size-5" : "size-4"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`${isLarge ? "text-[13.5px]" : "text-[12.5px]"} font-bold leading-snug tracking-wide text-white`}>
            {node.label}
          </p>
          <p className="mt-1.5 font-mono text-[9px] uppercase tracking-widest text-white/40">
            {node.meta}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
