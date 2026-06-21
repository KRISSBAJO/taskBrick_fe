"use client";

import React, { useEffect, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle2,
  FileText,
  Radar,
  Search,
  Settings2,
  ShieldCheck,
  Wand2,
  Workflow,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence, useInView, useSpring, useTransform, useMotionValue } from "framer-motion";
import * as THREE from "three";

type AgentVisual = "research" | "reporting" | "insights" | "meetings" | "process";
type DisposableResource = { dispose: () => void };
type MutableVector3 = {
  x: number;
  y: number;
  z: number;
  distanceTo: (other: MutableVector3) => number;
  set: (x: number, y: number, z: number) => void;
};
type SceneNode = {
  position: MutableVector3;
  scale: { setScalar: (value: number) => void };
};
type EmissiveMaterial = DisposableResource & { emissiveIntensity: number };
type OpacityMaterial = DisposableResource & { opacity: number };
type DynamicBufferAttribute = {
  array: Float32Array;
  needsUpdate: boolean;
  setUsage: (usage: unknown) => void;
};

type AgentCard = {
  title: string;
  eyebrow: string;
  description: string;
  icon: ElementType;
  visual: AgentVisual;
  span: string;
  glow: string;
  capabilities: string[];
};

function disposeAll(resources: DisposableResource[]) {
  resources.forEach((resource) => resource.dispose());
}

const agentCards: AgentCard[] = [
  {
    title: "Research agents",
    eyebrow: "Market Analyzer + Vendor Scout",
    description: "Pull project context, compare vendors, and surface decision-ready intelligence.",
    icon: Search,
    visual: "research",
    span: "xl:col-span-4",
    glow: "rgba(255, 212, 0, 0.12)",
    capabilities: ["scan docs", "rank options", "summarize evidence"],
  },
  {
    title: "Reporting agents",
    eyebrow: "Daily Wrap-Up + Status Reporter",
    description: "Turn task movement into clean updates for leaders, clients, and delivery rooms.",
    icon: BarChart3,
    visual: "reporting",
    span: "xl:col-span-4",
    glow: "rgba(255, 212, 0, 0.15)",
    capabilities: ["daily digest", "KPI summary", "stakeholder update"],
  },
  {
    title: "Insight agents",
    eyebrow: "Risk Analyzer + Anomaly Detector",
    description: "Spot blocked work, scope drift, and delivery risk before they become expensive.",
    icon: Radar,
    visual: "insights",
    span: "xl:col-span-4",
    glow: "rgba(2, 86, 255, 0.15)",
    capabilities: ["risk signals", "SLA alerts", "progress gaps"],
  },
  {
    title: "Meeting assistants",
    eyebrow: "Scheduler + Action Extractor",
    description: "Plan sessions, capture decisions, and convert conversations into accountable work.",
    icon: CalendarDays,
    visual: "meetings",
    span: "xl:col-span-6",
    glow: "rgba(15, 138, 69, 0.12)",
    capabilities: ["agenda builder", "call summary", "action items"],
  },
  {
    title: "Process optimizers",
    eyebrow: "Workflow Cleaner + Data Fixer",
    description: "Find duplicated steps, broken ownership, and stale data across your operations.",
    icon: Settings2,
    visual: "process",
    span: "xl:col-span-6",
    glow: "rgba(180, 83, 9, 0.12)",
    capabilities: ["remove waste", "fix routing", "clean fields"],
  },
];

const promptText = "Create a launch-risk agent for enterprise projects";

export function AgentUseCasesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });
  const [typedPrompt, setTypedPrompt] = useState("");

  useEffect(() => {
    if (!inView) return;
    let index = 0;
    const interval = window.setInterval(() => {
      setTypedPrompt((prev) => prev + promptText.charAt(index));
      index++;
      if (index >= promptText.length) window.clearInterval(interval);
    }, 35);
    return () => window.clearInterval(interval);
  }, [inView]);

  return (
    <section
      ref={sectionRef}
      id="agents"
      className="relative scroll-mt-24 overflow-hidden bg-[#020202] px-6 py-36 text-white antialiased sm:px-8 lg:px-16"
    >
      {/* High-End Dynamic Grid & Backdrop Core */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-1/4 -top-1/4 h-[1000px] w-[1000px] rounded-full bg-[#ffd400]/[0.025] blur-[150px]" />
        <div className="absolute -right-1/4 top-1/4 h-[1000px] w-[1000px] rounded-full bg-[#0256ff]/[0.04] blur-[180px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_40%_at_50%_50%,#000_60%,transparent_100%)]" />
      </div>

      <div className="relative mx-auto max-w-[1440px]">
        {/* Header Engine */}
        <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium tracking-widest uppercase text-[#ffd400] backdrop-blur-xl"
            >
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ffd400]/50 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#ffd400]" />
              </span>
              <Bot className="size-3.5" />
              TaskBricks Engine Layers
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]"
            >
              Autonomous execution. <br />
              <span className="bg-gradient-to-r from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                Tailored architectural loops.
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 max-w-[560px] text-[15px] font-normal leading-relaxed text-[#8e8e93]"
            >
              Isolate latency, balance production states, and deploy predictive system observers directly into your existing structural stacks.
            </motion.p>
          </div>

          {/* Cinematic Orb — replaces static metric cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <div className="relative p-7">
              <CinematicOrb />

              {/* Floating metric badge — top-left */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="absolute left-0 top-4 rounded-xl border border-white/[0.07] bg-black/75 px-3 py-2.5 text-center shadow-2xl backdrop-blur-xl"
              >
                <p className="text-xl font-light text-white">05</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-neutral-500">Core Layouts</p>
              </motion.div>

              {/* Floating metric badge — top-right (yellow accent) */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="absolute right-0 top-4 rounded-xl border border-[#ffd400]/25 bg-black/75 px-3 py-2.5 text-center shadow-2xl backdrop-blur-xl"
              >
                <p className="text-xl font-light text-[#ffd400]">14ms</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-neutral-500">Inference</p>
              </motion.div>

              {/* Floating metric badge — bottom-center */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/[0.07] bg-black/75 px-4 py-2.5 text-center shadow-2xl backdrop-blur-xl"
              >
                <p className="text-sm font-light text-white">SecOps</p>
                <p className="mt-0.5 text-[9px] font-medium uppercase tracking-widest text-neutral-500">Enterprise Guard</p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Unified Reactive Grid */}
        <div className="mt-20 grid gap-5 md:grid-cols-2 xl:grid-cols-12">
          {agentCards.map((agent, i) => (
            <CanvasCard key={agent.title} agent={agent} index={i} inView={inView} />
          ))}
        </div>

        {/* Master Studio Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="group/studio mt-5 grid overflow-hidden rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#09090b] to-[#030303] shadow-[0_30px_100px_rgba(0,0,0,0.9)] transition-all duration-500 hover:border-white/[0.08] lg:grid-cols-[0.88fr_1.12fr]"
        >
          <div className="p-8 sm:p-12">
            <div className="flex items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] text-[#ffd400] backdrop-blur-md transition-all duration-500 group-hover/studio:border-white/[0.15] group-hover/studio:bg-white/[0.05]">
                <Wand2 className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-white/30">Studio Engine</p>
                <h3 className="text-xl font-normal tracking-tight text-white">Dynamic Initialization</h3>
              </div>
            </div>

            <div className="mt-10 rounded-xl border border-white/[0.05] bg-black/50 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex gap-2">
                  <span className="size-2 rounded-full bg-white/10" />
                  <span className="size-2 rounded-full bg-white/10" />
                  <span className="size-2 rounded-full bg-white/10" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-widest text-white/20">Compilation String</span>
              </div>
              <div className="mt-4 flex min-h-[80px] items-start rounded-lg bg-white/[0.01] p-4 text-sm font-mono leading-relaxed text-neutral-300 border border-white/[0.02]">
                <p className="flex-1 tracking-wide">
                  {typedPrompt}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.75 }}
                    className="inline-block h-4 w-1.5 translate-y-0.5 bg-[#ffd400] ml-0.5"
                  />
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Context Array", "Logic Rule", "Access Validation"].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/[0.03] bg-white/[0.01] p-4 transition-colors duration-300 hover:bg-white/[0.02]">
                  <CheckCircle2 className="size-4 shrink-0 text-[#0f8a45]" />
                  <span className="text-xs font-medium text-neutral-400">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden bg-white/[0.01] p-8 sm:p-12 border-t border-white/[0.05] lg:border-l lg:border-t-0">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,212,0,0.006)_1px,transparent_1px),linear-gradient(90deg,rgba(255,212,0,0.006)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_at_top_right,#000,transparent_60%)]" />

            <div className="relative flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-[#ffd400]">Operational Layer</p>
                <h4 className="mt-2 text-2xl font-light tracking-tight text-white">Launch Risk Sentinel</h4>
              </div>
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#ffd400]/20 bg-[#ffd400]/5 text-[#ffd400] shadow-[0_0_40px_rgba(255,212,0,0.05)]">
                <Bot className="size-6" />
              </span>
            </div>

            <div className="relative mt-10 grid gap-3">
              <GeneratedStep icon={Search} label="Ingests asynchronous enterprise channels" />
              <GeneratedStep icon={Radar} label="Correlates development metrics against targets" />
              <GeneratedStep icon={FileText} label="Compiles predictive deviation profiles" />
              <GeneratedStep icon={ShieldCheck} label="Applies native cryptographic authentication vectors" />
            </div>

            <div className="relative mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-medium text-black transition-all duration-300 hover:bg-neutral-200"
              >
                Instantiate Blueprint
                <ArrowRight className="ml-2 size-4" />
              </Link>
              <a
                href="#project-glance"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-sm font-medium text-white backdrop-blur-md transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.15]"
              >
                Review Specs
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Highly customized reactive card container using direct native mouse tracking strings
function CanvasCard({ agent, index, inView }: { agent: AgentCard; index: number; inView: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Custom spring mechanics mapping variables to ensure frame fluidity
  const xMouse = useMotionValue(0);
  const yMouse = useMotionValue(0);
  
  const springConfig = { stiffness: 85, damping: 22, mass: 1 };
  const xSpring = useSpring(xMouse, springConfig);
  const ySpring = useSpring(yMouse, springConfig);

  const rotX = useTransform(ySpring, [-0.5, 0.5], [6, -6]);
  const rotY = useTransform(xSpring, [-0.5, 0.5], [-6, 6]);

  const spotlightX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
  const spotlightY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    xMouse.set((e.clientX - rect.left) / rect.width - 0.5);
    yMouse.set((e.clientY - rect.top) / rect.height - 0.5);
    
    // Core cursor synchronization inside CSS spatial layouts
    containerRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    containerRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  }

  function handleMouseLeave() {
    xMouse.set(0);
    yMouse.set(0);
  }

  return (
    <motion.div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`${agent.span} group relative rounded-2xl border border-white/[0.04] bg-[#070708] p-[1px] transition-all duration-500 hover:border-transparent`}
      style={{ perspective: "1400px" }}
    >
      {/* Real-time border tracker line using radial dynamic mask styling */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(220px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255,255,255,0.12), transparent 80%)`,
        }}
      />

      {/* Internal Core Canvas Structure wrapper */}
      <motion.article
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative flex h-full min-h-[460px] flex-col justify-between overflow-hidden rounded-2xl bg-[#0a0a0c] p-7"
      >
        {/* Continuous Dynamic Background Ambient Spotlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background: useTransform(
              [spotlightX, spotlightY],
              ([cx, cy]) => `radial-gradient(380px circle at ${cx} ${cy}, ${agent.glow}, transparent 80%)`
            ),
          }}
        />

        {/* Spatial Content Clusters */}
        <div style={{ transform: "translateZ(40px)" }} className="transition-transform duration-500 ease-out">
          <div className="flex items-center justify-between">
            <span className="flex size-11 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.02] text-neutral-400 transition-all duration-300 group-hover:border-white/[0.12] group-hover:bg-white/[0.04] group-hover:text-white">
              <agent.icon className="size-4.5" />
            </span>
            <span className="rounded-full border border-white/[0.05] bg-white/[0.01] px-3 py-1 text-[9px] font-medium tracking-widest uppercase text-neutral-500">
              Operational Matrix
            </span>
          </div>

          <div className="mt-8">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-neutral-500">{agent.eyebrow}</p>
            <h3 className="mt-2.5 text-2xl font-light tracking-tight text-white">{agent.title}</h3>
            <p className="mt-3.5 text-[13.5px] font-normal leading-relaxed text-[#8a8a93]">{agent.description}</p>
          </div>
        </div>

        {/* Dynamic Canvas Renderer layer */}
        <div style={{ transform: "translateZ(25px)" }} className="mt-6 transition-transform duration-500 ease-out">
          <AgentVisualRenderer visual={agent.visual} />
        </div>

        {/* Functional tag capabilities block */}
        <div style={{ transform: "translateZ(15px)" }} className="mt-8 flex flex-wrap gap-1.5 transition-transform duration-500 ease-out">
          {agent.capabilities.map((capability) => (
            <span
              key={capability}
              className="rounded-md border border-white/[0.04] bg-white/[0.01] px-2.5 py-1 text-[9px] font-medium tracking-wider uppercase text-neutral-400 transition-colors duration-300 group-hover:border-white/[0.08] group-hover:bg-white/[0.02]"
            >
              {capability}
            </span>
          ))}
        </div>
      </motion.article>
    </motion.div>
  );
}

function AgentMetric({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-500 ${
        highlight
          ? "border-[#ffd400]/15 bg-[#ffd400]/[0.02] shadow-[0_0_30px_rgba(255,212,0,0.02)]"
          : "border-white/[0.04] bg-white/[0.01]"
      }`}
    >
      <p className="text-3xl font-light tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-[10px] font-medium tracking-widest uppercase text-neutral-500">{label}</p>
    </div>
  );
}

/* ─── Three.js agent visuals ────────────────────────────────────────────────── */

function AgentVisualRenderer({ visual }: { visual: AgentVisual }) {
  if (visual === "research")  return <ThreeResearch />;
  if (visual === "reporting") return <ThreeRubiksCube />;
  if (visual === "insights")  return <ThreeInsights />;
  if (visual === "meetings")  return <ThreeMeetings />;
  return <ThreeProcess />;
}

// ── Research: live particle constellation with connecting edges
function ThreeResearch() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = container.clientWidth || 280, H = 112;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 4.5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const N = 38;
    const pPos = new Float32Array(N * 3);
    const vel: [number, number, number][] = [];
    for (let i = 0; i < N; i++) {
      pPos[i * 3]     = (Math.random() - 0.5) * 6;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 2.4;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
      vel.push([(Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.004]);
    }
    const pAttr = new THREE.BufferAttribute(pPos, 3);
    pAttr.setUsage(THREE.DynamicDrawUsage);
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", pAttr);
    const pMat = new THREE.PointsMaterial({ color: "#ffd400", size: 0.07, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(pGeo, pMat));

    const MAX_L = 200;
    const lPos = new Float32Array(MAX_L * 6);
    const lAttr = new THREE.BufferAttribute(lPos, 3);
    lAttr.setUsage(THREE.DynamicDrawUsage);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute("position", lAttr);
    const lMat = new THREE.LineBasicMaterial({ color: "#ffd400", transparent: true, opacity: 0.13 });
    scene.add(new THREE.LineSegments(lGeo, lMat));

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      for (let i = 0; i < N; i++) {
        pPos[i*3]     += vel[i]![0];
        pPos[i*3+1]   += vel[i]![1];
        pPos[i*3+2]   += vel[i]![2];
        if (Math.abs(pPos[i*3]!)     > 3)    vel[i]![0] *= -1;
        if (Math.abs(pPos[i*3+1]!)   > 1.2)  vel[i]![1] *= -1;
        if (Math.abs(pPos[i*3+2]!)   > 0.9)  vel[i]![2] *= -1;
      }
      pAttr.needsUpdate = true;
      let lc = 0;
      for (let i = 0; i < N && lc < MAX_L; i++) {
        for (let j = i + 1; j < N && lc < MAX_L; j++) {
          const dx = pPos[i*3]!-pPos[j*3]!, dy = pPos[i*3+1]!-pPos[j*3+1]!, dz = pPos[i*3+2]!-pPos[j*3+2]!;
          if (dx*dx + dy*dy + dz*dz < 2.0) {
            lPos[lc*6]=pPos[i*3]!; lPos[lc*6+1]=pPos[i*3+1]!; lPos[lc*6+2]=pPos[i*3+2]!;
            lPos[lc*6+3]=pPos[j*3]!; lPos[lc*6+4]=pPos[j*3+1]!; lPos[lc*6+5]=pPos[j*3+2]!;
            lc++;
          }
        }
      }
      lAttr.needsUpdate = true;
      lGeo.setDrawRange(0, lc * 2);
      scene.rotation.y += 0.0015;
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      pGeo.dispose(); pMat.dispose(); lGeo.dispose(); lMat.dispose();
      container.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="h-28 w-full overflow-hidden rounded-xl" />;
}

// ── Reporting: Cinematic self-solving Rubik's Cube
function ThreeRubiksCube() {
  const mountRef = useRef<HTMLDivElement>(null);
  const twistActiveRef = useRef(false);
  const twistCountRef = useRef(0);
  const [isActive, setIsActive] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIsActive(twistActiveRef.current);
      setMoveCount(twistCountRef.current);
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const W = container.clientWidth || 280;
    const H = 186;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000);
    camera.position.set(5, 4, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    const makeTexture = (type: "carbon" | "brushed" | "matte" | "grain") => {
      const cv = document.createElement("canvas");
      cv.width = 128; cv.height = 128;
      const ctx = cv.getContext("2d");
      if (!ctx) return new THREE.CanvasTexture(cv);
      if (type === "carbon") {
        ctx.fillStyle = "#121214"; ctx.fillRect(0, 0, 128, 128);
        ctx.fillStyle = "#1a1a1e";
        for (let i = 0; i < 128; i += 8) for (let j = 0; j < 128; j += 8) if ((i + j) % 16 === 0) ctx.fillRect(i, j, 4, 4);
      } else if (type === "brushed") {
        const g = ctx.createLinearGradient(0, 0, 128, 128);
        g.addColorStop(0, "#4a4a50"); g.addColorStop(0.5, "#8a8a95"); g.addColorStop(1, "#3a3a40");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        for (let i = 0; i < 128; i += 2) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke(); }
      } else if (type === "grain") {
        ctx.fillStyle = "#222226"; ctx.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 2000; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`; ctx.fillRect(Math.random() * 128, Math.random() * 128, 1, 1); }
      } else {
        ctx.fillStyle = "#09090b"; ctx.fillRect(0, 0, 128, 128);
      }
      return new THREE.CanvasTexture(cv);
    };

    const baseMats = [
      new THREE.MeshPhysicalMaterial({ map: makeTexture("matte"),   roughness: 0.5,  metalness: 0.1 }),
      new THREE.MeshPhysicalMaterial({ map: makeTexture("carbon"),  roughness: 0.3,  metalness: 0.8 }),
      new THREE.MeshPhysicalMaterial({ map: makeTexture("brushed"), roughness: 0.15, metalness: 0.95, clearcoat: 0.3 }),
      new THREE.MeshPhysicalMaterial({ map: makeTexture("grain"),   roughness: 0.4,  metalness: 0.5 }),
      new THREE.MeshPhysicalMaterial({ color: "#ffd400", roughness: 0.05, metalness: 0.9, clearcoat: 1.0, emissive: new THREE.Color("#ffd400"), emissiveIntensity: 0.18 }),
      new THREE.MeshPhysicalMaterial({ color: "#18181b", roughness: 0.7, metalness: 0.0 }),
    ];

    const cubeGroup = new THREE.Group();
    scene.add(cubeGroup);
    const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subCubes: any[] = [];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const mesh = new THREE.Mesh(geo, baseMats.map(m => m.clone()));
          mesh.position.set(x, y, z);
          cubeGroup.add(mesh);
          subCubes.push(mesh);
        }

    scene.add(new THREE.AmbientLight("#ffffff", 0.3));
    const keyLight = new THREE.DirectionalLight("#ffffff", 4.5); keyLight.position.set(5, 8, 5); scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight("#ffd400", 2.2); rimLight.position.set(-6, 2, -5); scene.add(rimLight);
    const fillLight = new THREE.PointLight("#0256ff", 5, 18); fillLight.position.set(-3, -3, 3); scene.add(fillLight);

    let axis: "x" | "y" | "z" = "y", layer = 1, target = 0, progress = 0, twisting = false, pauseTimer = 0;

    const startTwist = () => {
      const axes: ("x" | "y" | "z")[] = ["x", "y", "z"];
      axis = axes[Math.floor(Math.random() * 3)]!;
      layer = [-1, 0, 1][Math.floor(Math.random() * 3)]!;
      target = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
      progress = 0; twisting = true;
      twistActiveRef.current = true;
    };

    const clock = new THREE.Clock();
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous smooth 360° orbit on Y, gentle float on X — never pauses
      cubeGroup.rotation.y = elapsed * 0.55;
      cubeGroup.rotation.x = Math.sin(elapsed * 0.22) * 0.18;
      fillLight.color.setHSL((elapsed * 0.07) % 1, 0.85, 0.5);

      pauseTimer -= delta;
      // Near-zero pause so moves feel relentless
      if (!twisting && pauseTimer <= 0) { startTwist(); pauseTimer = 0.18 + Math.random() * 0.28; }

      if (twisting) {
        const step = 9.0 * delta;
        progress += step;
        const axisVec = axis === "x" ? new THREE.Vector3(1, 0, 0) :
                        axis === "y" ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
        const angle = Math.sign(target) * step;
        subCubes.forEach(c => {
          const v = axis === "x" ? c.position.x : axis === "y" ? c.position.y : c.position.z;
          if (Math.abs(v - layer) < 0.1) {
            c.position.applyAxisAngle(axisVec, angle);
            c.rotateOnWorldAxis(axisVec, angle);
          }
        });
        if (progress >= Math.abs(target)) {
          twisting = false;
          twistActiveRef.current = false;
          twistCountRef.current++;
          subCubes.forEach(c => {
            c.position.x = Math.round(c.position.x);
            c.position.y = Math.round(c.position.y);
            c.position.z = Math.round(c.position.z);
          });
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      geo.dispose(); baseMats.forEach(m => m.dispose());
      container.innerHTML = "";
    };
  }, []);

  const labels = ["Daily Digest", "KPI Sync", "Stakeholder"];

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Breathing glow that intensifies during twists */}
      <motion.div
        animate={{ opacity: isActive ? 0.85 : 0.2 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#ffd400]/[0.09] via-transparent to-[#0256ff]/[0.05]"
      />
      {/* Active ring border */}
      <motion.div
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-[#ffd400]/25 shadow-[inset_0_0_24px_rgba(255,212,0,0.07)]"
      />

      {/* Three.js mount */}
      <div ref={mountRef} className="h-[186px] w-full" />

      {/* SOLVING badge — top-right */}
      <div className="pointer-events-none absolute right-2 top-2">
        <AnimatePresence>
          {isActive && (
            <motion.div
              key="solving"
              initial={{ opacity: 0, scale: 0.72, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.72, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-1.5 rounded-full border border-[#ffd400]/25 bg-black/75 px-2.5 py-1 backdrop-blur-md"
            >
              <motion.span
                animate={{ opacity: [1, 0.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
                className="size-1.5 rounded-full bg-[#ffd400]"
              />
              <span className="text-[8px] font-semibold tracking-widest uppercase text-[#ffd400]">Solving</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Move counter — top-left */}
      <div className="pointer-events-none absolute left-2 top-2">
        <AnimatePresence>
          {moveCount > 0 && (
            <motion.div
              key={moveCount}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-black/70 px-2.5 py-1 backdrop-blur-md"
            >
              <span className="font-mono text-[8px] text-neutral-500">{moveCount}</span>
              <span className="text-[8px] text-neutral-600 uppercase tracking-widest">ops</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom metric labels */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-start gap-1 px-2 pb-2">
        {labels.map((label, i) => (
          <motion.span
            key={label}
            animate={{
              opacity: moveCount > i * 3 ? [0.45, 0.9, 0.45] : 0.18,
              scale:   moveCount > i * 3 ? [1, 1.03, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 2.8 + i * 0.5, delay: i * 0.55 }}
            className="rounded border border-white/[0.06] bg-black/60 px-1.5 py-0.5 text-[7px] font-medium tracking-widest uppercase text-neutral-400 backdrop-blur-sm"
          >
            {label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

// ── Insights: wireframe sphere with orbiting scanner ring + particle
function ThreeInsights() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = container.clientWidth || 280, H = 112;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
    camera.position.z = 4;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const sGeo = new THREE.SphereGeometry(0.88, 14, 9);
    const sMat = new THREE.MeshBasicMaterial({ color: "#1a1a3e", wireframe: true, transparent: true, opacity: 0.28 });
    const sphere = new THREE.Mesh(sGeo, sMat); scene.add(sphere);

    const cGeo = new THREE.SphereGeometry(0.46, 20, 20);
    const cMat = new THREE.MeshPhongMaterial({ color: "#0256ff", emissive: "#0256ff", emissiveIntensity: 0.6, transparent: true, opacity: 0.38 });
    scene.add(new THREE.Mesh(cGeo, cMat));

    const rGeo = new THREE.TorusGeometry(1.42, 0.013, 8, 72);
    const rMat = new THREE.MeshBasicMaterial({ color: "#6366f1", transparent: true, opacity: 0.65 });
    const ring = new THREE.Mesh(rGeo, rMat);
    ring.rotation.x = Math.PI / 3; scene.add(ring);

    const dGeo = new THREE.SphereGeometry(0.065, 8, 8);
    const dMat = new THREE.MeshBasicMaterial({ color: "#a78bfa" });
    const dot = new THREE.Mesh(dGeo, dMat); scene.add(dot);

    scene.add(new THREE.AmbientLight("#ffffff", 0.4));
    const ptL = new THREE.PointLight("#4f46e5", 10, 10);
    ptL.position.set(0, 0, 2); scene.add(ptL);

    let rafId: number;
    const clock = new THREE.Clock();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      sphere.rotation.y = t * 0.28; sphere.rotation.x = t * 0.1;
      ring.rotation.z = t * 0.42;
      const angle = t * 0.42;
      const tilt = Math.PI / 3 - Math.PI / 2;
      dot.position.set(Math.cos(angle) * 1.42 * Math.cos(tilt), Math.sin(angle) * 1.42, Math.cos(angle) * 1.42 * Math.sin(tilt));
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      disposeAll([sGeo, sMat, cGeo, cMat, rGeo, rMat, dGeo, dMat]);
      container.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="h-28 w-full overflow-hidden rounded-xl" />;
}

// ── Meetings: orbital convergence hub — persons orbit, converge, action sparks emit
function ThreeMeetings() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = container.clientWidth || 340, H = 144;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 100);
    camera.position.set(0, 2.2, 5.5);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight("#ffffff", 0.22));
    const ptL = new THREE.PointLight("#10b981", 9, 14);
    ptL.position.set(0, 0, 2); scene.add(ptL);
    const rimL = new THREE.DirectionalLight("#34d399", 2.8);
    rimL.position.set(-3, 2, -2); scene.add(rimL);

    // Central hub
    const hubGeo = new THREE.SphereGeometry(0.22, 20, 20);
    const hubMat = new THREE.MeshPhongMaterial({ color: "#10b981", emissive: "#10b981", emissiveIntensity: 0.9 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    scene.add(hub);

    // Orbital guide ring
    const ringGeo = new THREE.TorusGeometry(1.55, 0.012, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({ color: "#10b981", transparent: true, opacity: 0.18 });
    scene.add(new THREE.Mesh(ringGeo, ringMat));

    // Outer scanner ring
    const scanGeo = new THREE.TorusGeometry(2.1, 0.008, 8, 80);
    const scanMat = new THREE.MeshBasicMaterial({ color: "#34d399", transparent: true, opacity: 0.09 });
    const scanRing = new THREE.Mesh(scanGeo, scanMat);
    scanRing.rotation.x = Math.PI * 0.22;
    scene.add(scanRing);

    // 5 orbiting person nodes
    const N_ORB = 5;
    const orbColors = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#a7f3d0"];
    const orbSpeeds = [0.65, 0.92, 0.48, 1.08, 0.74];
    const orbPhases = [0, 1.257, 2.513, 3.770, 5.027];
    const orbGeos: DisposableResource[] = [], orbMats: EmissiveMaterial[] = [], orbs: SceneNode[] = [];
    for (let i = 0; i < N_ORB; i++) {
      const g = new THREE.SphereGeometry(0.11, 10, 10);
      const m = new THREE.MeshPhongMaterial({ color: orbColors[i], emissive: orbColors[i], emissiveIntensity: 0.55 });
      const mesh = new THREE.Mesh(g, m);
      scene.add(mesh);
      orbGeos.push(g); orbMats.push(m); orbs.push(mesh);
    }

    // Connection beam pool
    const MAX_BEAMS = 8;
    const beamPts = Array.from({ length: MAX_BEAMS }, () => new Float32Array(6));
    const beamAttrs: DynamicBufferAttribute[] = [], beamMats: OpacityMaterial[] = [];
    for (let i = 0; i < MAX_BEAMS; i++) {
      const attr = new THREE.BufferAttribute(beamPts[i]!, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", attr);
      const mat = new THREE.LineBasicMaterial({ color: "#34d399", transparent: true, opacity: 0 });
      scene.add(new THREE.Line(geo, mat));
      beamAttrs.push(attr); beamMats.push(mat);
    }

    // Action burst particles
    const A_N = 32;
    const aPos = new Float32Array(A_N * 3);
    const aVel: { x: number; y: number; z: number; life: number }[] =
      Array.from({ length: A_N }, () => ({ x: 0, y: 0, z: 0, life: 0 }));
    const aAttr = new THREE.BufferAttribute(aPos, 3);
    aAttr.setUsage(THREE.DynamicDrawUsage);
    const aGeo = new THREE.BufferGeometry(); aGeo.setAttribute("position", aAttr);
    const aMat = new THREE.PointsMaterial({ color: "#6ee7b7", size: 0.07, transparent: true, opacity: 0 });
    scene.add(new THREE.Points(aGeo, aMat));

    const CONV_PERIOD = 5.2;
    let burstFired = false;
    const clock = new THREE.Clock();
    let rafId: number;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = clock.getElapsedTime();
      const cycleT = t % CONV_PERIOD;
      const convRaw = Math.max(0, (cycleT - (CONV_PERIOD - 1.4)) / 1.0);
      const convEase = Math.sin(Math.min(convRaw, 1) * Math.PI);

      // Orbiter positions — spiral inward on convergence
      for (let i = 0; i < N_ORB; i++) {
        const angle = orbPhases[i]! + t * orbSpeeds[i]!;
        const r = 1.55 * (1 - convEase * 0.88);
        orbs[i].position.set(
          Math.cos(angle) * r,
          Math.sin(angle) * r * 0.3,
          Math.sin(angle) * r * 0.5,
        );
        orbMats[i].emissiveIntensity = 0.5 + convEase * 2.5;
        orbs[i].scale.setScalar(1 + convEase * 0.6);
      }

      // Hub pulse
      hub.scale.setScalar(1 + convEase * 0.9);
      hubMat.emissiveIntensity = 0.8 + convEase * 2.8;
      ptL.intensity = 9 + convEase * 14;

      // Fire burst at peak
      if (convEase > 0.92 && !burstFired) {
        burstFired = true;
        for (let a = 0; a < A_N; a++) {
          const theta = (a / A_N) * Math.PI * 2;
          const phi = (Math.random() - 0.5) * Math.PI * 0.8;
          const spd = 1.2 + Math.random() * 1.4;
          aVel[a] = { x: Math.cos(theta) * Math.cos(phi) * spd, y: Math.sin(phi) * spd * 0.5, z: Math.sin(theta) * Math.cos(phi) * spd * 0.7, life: 1.0 };
          aPos[a * 3] = aPos[a * 3 + 1] = aPos[a * 3 + 2] = 0;
        }
      }
      if (convEase < 0.1) burstFired = false;

      // Update sparks
      let alive = false;
      for (let a = 0; a < A_N; a++) {
        if (aVel[a]!.life > 0) {
          aVel[a]!.life -= delta * 1.5;
          aPos[a * 3]     += aVel[a]!.x * delta;
          aPos[a * 3 + 1] += aVel[a]!.y * delta;
          aPos[a * 3 + 2] += aVel[a]!.z * delta;
          alive = true;
        }
      }
      aAttr.needsUpdate = true;
      aMat.opacity = alive ? Math.min(0.95, (aVel[0]?.life ?? 0) * 2.5) : 0;

      // Connection beams between close orbs
      let bIdx = 0;
      for (let i = 0; i < N_ORB && bIdx < MAX_BEAMS; i++) {
        for (let j = i + 1; j < N_ORB && bIdx < MAX_BEAMS; j++) {
          const pa = orbs[i].position, pb = orbs[j].position;
          const dist = pa.distanceTo(pb);
          const thresh = 1.1 + convEase * 0.8;
          if (dist < thresh) {
            const pts = beamPts[bIdx]!;
            pts[0]=pa.x; pts[1]=pa.y; pts[2]=pa.z;
            pts[3]=pb.x; pts[4]=pb.y; pts[5]=pb.z;
            beamAttrs[bIdx].needsUpdate = true;
            beamMats[bIdx].opacity = (1 - dist / thresh) * 0.55 * (1 + convEase * 1.5);
            bIdx++;
          }
        }
      }
      for (let k = bIdx; k < MAX_BEAMS; k++) beamMats[k].opacity = 0;

      scanRing.rotation.z = t * 0.3;
      ptL.color.setHSL(0.44 + Math.sin(t * 0.35) * 0.04, 0.9, 0.5);
      scene.rotation.y = t * 0.16;
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      disposeAll([...orbGeos, ...orbMats, hubGeo, hubMat, ringGeo, ringMat, scanGeo, scanMat, aGeo, aMat]);
      container.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="h-36 w-full overflow-hidden rounded-xl" />;
}

// ── Process: 5-channel live trend engine — stacked waveforms breathe and stream data
function ThreeProcess() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const W = container.clientWidth || 340, H = 144;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.8);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const SEGS = 90;
    const CHAN = 5;
    const yBases   = [-1.05, -0.52, 0,    0.52,  1.05];
    const ampls    = [0.22,   0.28, 0.38,  0.28,  0.22];
    const freqs    = [1.4,    1.9,  1.1,   2.2,   1.6];
    const phaseSps = [0.9,    1.4,  0.75,  1.7,   1.1];
    const opacs    = [0.28,   0.48, 1.0,   0.48,  0.28];
    const chanHex  = ["#7c2d12","#c2410c","#f97316","#c2410c","#7c2d12"];

    const lineAttrs: DynamicBufferAttribute[] = [], lineGeos: DisposableResource[] = [], lineMats: OpacityMaterial[] = [];
    for (let ch = 0; ch < CHAN; ch++) {
      const pts = new Float32Array((SEGS + 1) * 3);
      const attr = new THREE.BufferAttribute(pts, 3);
      attr.setUsage(THREE.DynamicDrawUsage);
      const geo = new THREE.BufferGeometry(); geo.setAttribute("position", attr);
      const mat = new THREE.LineBasicMaterial({ color: chanHex[ch], transparent: true, opacity: opacs[ch]! });
      scene.add(new THREE.Line(geo, mat));
      lineAttrs.push(attr); lineGeos.push(geo); lineMats.push(mat);
    }

    // Glow layer: lighter offset copy of center channel
    const glowPts = new Float32Array((SEGS + 1) * 3);
    const glowAttr = new THREE.BufferAttribute(glowPts, 3);
    glowAttr.setUsage(THREE.DynamicDrawUsage);
    const glowGeo = new THREE.BufferGeometry(); glowGeo.setAttribute("position", glowAttr);
    const glowMat = new THREE.LineBasicMaterial({ color: "#fdba74", transparent: true, opacity: 0.28 });
    scene.add(new THREE.Line(glowGeo, glowMat));

    // Evenly-spaced data point markers along center channel
    const D_N = 14;
    const dPos = new Float32Array(D_N * 3);
    const dAttr = new THREE.BufferAttribute(dPos, 3);
    dAttr.setUsage(THREE.DynamicDrawUsage);
    const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute("position", dAttr);
    const dMat = new THREE.PointsMaterial({ color: "#fed7aa", size: 0.1, transparent: true, opacity: 0.9 });
    scene.add(new THREE.Points(dGeo, dMat));

    // Streaming flow particles along center channel
    const P_N = 30;
    const pPos = new Float32Array(P_N * 3);
    const pOff = Array.from({ length: P_N }, (_: unknown, i: number) => i / P_N);
    const pAttr = new THREE.BufferAttribute(pPos, 3);
    pAttr.setUsage(THREE.DynamicDrawUsage);
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", pAttr);
    const pMat = new THREE.PointsMaterial({ color: "#f97316", size: 0.085, transparent: true, opacity: 0.92 });
    scene.add(new THREE.Points(pGeo, pMat));

    const clock = new THREE.Clock();
    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      for (let ch = 0; ch < CHAN; ch++) {
        const pts = lineAttrs[ch].array as Float32Array;
        const amp = ampls[ch]!;
        const freq = freqs[ch]!;
        const sp = phaseSps[ch]!;
        const yb = yBases[ch]!;
        const breathe = amp * (0.72 + 0.28 * Math.sin(t * 0.35 + ch * 1.1));
        for (let i = 0; i <= SEGS; i++) {
          const x = -4.2 + (i / SEGS) * 8.4;
          const w1 = Math.sin(x * freq + t * sp) * breathe;
          const w2 = Math.sin(x * freq * 2.1 - t * sp * 0.8) * breathe * 0.28;
          const w3 = Math.sin(x * 0.5 + t * 0.3) * 0.1;
          pts[i * 3]     = x;
          pts[i * 3 + 1] = yb + w1 + w2 + w3;
          pts[i * 3 + 2] = (ch - 2) * 0.18;
        }
        lineAttrs[ch].needsUpdate = true;
        lineMats[ch].opacity = opacs[ch]! * (0.62 + 0.38 * Math.sin(t * 0.5 + ch * 0.9));
      }

      // Glow copy (slight Y shift)
      const main = lineAttrs[2].array as Float32Array;
      for (let i = 0; i <= SEGS; i++) {
        glowPts[i * 3]     = main[i * 3]!;
        glowPts[i * 3 + 1] = main[i * 3 + 1]! + 0.045;
        glowPts[i * 3 + 2] = main[i * 3 + 2]!;
      }
      glowAttr.needsUpdate = true;
      glowMat.opacity = 0.2 + 0.14 * Math.sin(t * 1.1);

      // Data point markers
      for (let d = 0; d < D_N; d++) {
        const idx = Math.floor((d / (D_N - 1)) * SEGS);
        dPos[d * 3]     = main[idx * 3]!;
        dPos[d * 3 + 1] = main[idx * 3 + 1]!;
        dPos[d * 3 + 2] = main[idx * 3 + 2]!;
      }
      dAttr.needsUpdate = true;
      dMat.opacity = 0.5 + 0.38 * Math.abs(Math.sin(t * 0.65));

      // Streaming particles
      for (let p = 0; p < P_N; p++) {
        pOff[p] = (pOff[p]! + 0.0035) % 1;
        const idx = Math.floor(pOff[p]! * SEGS);
        pPos[p * 3]     = main[idx * 3]!;
        pPos[p * 3 + 1] = main[idx * 3 + 1]!;
        pPos[p * 3 + 2] = main[idx * 3 + 2]!;
      }
      pAttr.needsUpdate = true;

      scene.rotation.y = Math.sin(t * 0.14) * 0.14;
      renderer.render(scene, camera);
    };
    animate();
    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      disposeAll([...lineGeos, ...lineMats, glowGeo, glowMat, dGeo, dMat, pGeo, pMat]);
      container.innerHTML = "";
    };
  }, []);
  return <div ref={ref} className="h-36 w-full overflow-hidden rounded-xl" />;
}

function GeneratedStep({ icon: Icon, label }: { icon: ElementType; label: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 backdrop-blur-md transition-colors duration-300 hover:bg-white/[0.02]">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] text-neutral-400">
        <Icon className="size-4" />
      </span>
      <span className="text-xs font-normal text-neutral-300 tracking-wide">{label}</span>
      <span className="ml-auto size-1.5 shrink-0 rounded-full bg-[#0f8a45]" />
    </div>
  );
}

/* ─── Cinematic Three.js Orb ────────────────────────────────────────────────── */

function CinematicOrb() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const width = 320;
    const height = 320;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    const canvasSize = 512;
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = canvasSize;
    textureCanvas.height = canvasSize;
    const ctx = textureCanvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#16161a";
      ctx.fillRect(0, 0, canvasSize, canvasSize);
      ctx.strokeStyle = "#404047";
      ctx.lineWidth = 14;
      const center = canvasSize / 2;
      for (let r = 40; r < canvasSize; r += 55) {
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const orbTexture = new THREE.CanvasTexture(textureCanvas);

    const geometry = new THREE.SphereGeometry(1.6, 64, 64);
    const material = new THREE.MeshPhysicalMaterial({
      map: orbTexture,
      roughness: 0.28,
      metalness: 0.9,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
    });
    const orbMesh = new THREE.Mesh(geometry, material);
    scene.add(orbMesh);

    scene.add(new THREE.AmbientLight("#111115", 1.5));

    const keyLight = new THREE.DirectionalLight("#ffffff", 4.5);
    keyLight.position.set(4, 4, 3);
    scene.add(keyLight);

    const colorSpot = new THREE.PointLight("#7c3aed", 12, 12);
    colorSpot.position.set(0, -3, 2);
    scene.add(colorSpot);

    let rafId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      orbMesh.rotation.y = t * 0.35;
      orbMesh.rotation.x = Math.sin(t * 0.1) * 0.15;
      colorSpot.color.lerp(new THREE.Color().setHSL((t * 0.08) % 1, 0.9, 0.55), 0.05);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      orbTexture.dispose();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div className="relative flex size-[320px] items-center justify-center overflow-hidden rounded-[42px] border border-white/[0.04] bg-gradient-to-b from-[#141416] to-[#09090b] shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_40px_100px_rgba(0,0,0,0.8)]">
      <div ref={containerRef} className="relative z-10 size-full mix-blend-screen" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-purple-500/10 via-transparent to-transparent blur-xl" />
    </div>
  );
}
