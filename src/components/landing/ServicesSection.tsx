"use client";

import Image from "next/image";
import { ArrowRight, CalendarDays, ClipboardList, FolderKanban, TrendingUp, Zap } from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, type MouseEvent, type ElementType } from "react";

/* ─── Data ──────────────────────────────────────────────────────────────── */

type Theme = "dark" | "yellow" | "white" | "cream";

const cards: {
  id: string;
  icon: ElementType;
  tag: string;
  title: string;
  text: string;
  image: string;
  theme: Theme;
  col: string;
}[] = [
  {
    id: "meetings",
    icon: CalendarDays,
    tag: "#Meetings",
    title: "Meetings Management",
    text: "Plan agendas, capture decisions, and track follow-ups so every meeting ends with crystal-clear ownership.",
    image: "/product/meeting.png",
    theme: "dark",
    col: "lg:col-span-7",
  },
  {
    id: "sprint",
    icon: Zap,
    tag: "#Sprints",
    title: "Sprint Planning",
    text: "Run tight sprints with backlog grooming, velocity tracking, and burndown clarity your team can act on.",
    image: "/product/sprint.png",
    theme: "yellow",
    col: "lg:col-span-5",
  },
  {
    id: "project",
    icon: FolderKanban,
    tag: "#Projects",
    title: "Project Management",
    text: "Track milestones, deadlines, and blockers with the full context your team needs to keep delivery moving.",
    image: "/product/project.png",
    theme: "white",
    col: "lg:col-span-4",
  },
  {
    id: "task",
    icon: ClipboardList,
    tag: "#Tasks",
    title: "Task Management",
    text: "Assign owners, set priorities, and keep day-to-day execution visible across the entire team.",
    image: "/product/featureOfWork.png",
    theme: "cream",
    col: "lg:col-span-4",
  },
  {
    id: "reporting",
    icon: TrendingUp,
    tag: "#Insights",
    title: "Reporting & Insights",
    text: "Turn project activity into sharp, actionable reports your stakeholders will understand instantly.",
    image: "/product/reporting.png",
    theme: "dark",
    col: "lg:col-span-4",
  },
];

/* ─── Theme tokens ───────────────────────────────────────────────────────── */

const themes: Record<
  Theme,
  {
    card: string;
    icon: string;
    tag: string;
    title: string;
    text: string;
    link: string;
    imgOpacity: string;
    gradient: string;
  }
> = {
  dark: {
    card: "bg-[#111111]",
    icon: "bg-[#ffd400] text-[#111111]",
    tag: "bg-white/10 text-white/55 ring-1 ring-white/10",
    title: "text-white",
    text: "text-white/55",
    link: "text-[#ffd400]",
    imgOpacity: "opacity-60 group-hover:opacity-80",
    gradient: "bg-gradient-to-t from-[#111111] via-transparent to-transparent",
  },
  yellow: {
    card: "bg-[#fff5b8]",
    icon: "bg-[#111111] text-[#ffd400]",
    tag: "border border-black/10 bg-black/5 text-[#111111]/65",
    title: "text-[#111111]",
    text: "text-[#68645b]",
    link: "text-[#111111]",
    imgOpacity: "",
    gradient: "",
  },
  white: {
    card: "border border-black/8 bg-white",
    icon: "bg-[#111111] text-[#ffd400]",
    tag: "border border-black/8 bg-black/4 text-[#68645b]",
    title: "text-[#111111]",
    text: "text-[#68645b]",
    link: "text-[#111111]",
    imgOpacity: "",
    gradient: "",
  },
  cream: {
    card: "bg-[#faf8ef]",
    icon: "bg-[#111111] text-[#ffd400]",
    tag: "border border-black/8 bg-black/4 text-[#68645b]",
    title: "text-[#111111]",
    text: "text-[#68645b]",
    link: "text-[#111111]",
    imgOpacity: "",
    gradient: "",
  },
};

/* ─── Framer Motion variants ─────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 44, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

const wordVariants = {
  hidden: { opacity: 0, y: 22, rotateX: -30 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.48, ease: "easeOut" as const },
  },
};

/* ─── TiltCard ───────────────────────────────────────────────────────────── */

function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), {
    stiffness: 260,
    damping: 26,
  });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 260,
    damping: 26,
  });

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main section ───────────────────────────────────────────────────────── */

export function ServicesSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const headlineInView = useInView(headlineRef, { once: true, margin: "-80px" });
  const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

  const line1Words = "Everything your team needs to".split(" ");
  const line2Words = ["get", "things", "done"];

  return (
    <section
      id="services"
      className="relative mx-auto max-w-[1440px] overflow-hidden px-5 py-20 sm:px-8 lg:px-16"
    >
      {/* Ambient background glow */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="pointer-events-none absolute left-1/2 top-[-80px] -z-10 h-[520px] w-[800px] -translate-x-1/2 rounded-full bg-[#ffd400]/10 blur-[100px]"
      />

      {/* ── Section header ── */}
      <div className="mx-auto mb-14 max-w-3xl text-center">
        {/* Badge */}
        <motion.span
          initial={{ opacity: 0, y: 18, scale: 0.88 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-[#e8d800] bg-[#fff5b8] px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-[#111111]"
        >
          <Zap className="size-3.5 fill-[#ffd400] text-[#ffd400]" aria-hidden="true" />
          Core work management
        </motion.span>

        {/* Headline — word-by-word reveal */}
        <motion.h2
          ref={headlineRef}
          initial="hidden"
          animate={headlineInView ? "show" : "hidden"}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } } }}
          className="mt-5 text-4xl font-black leading-[1.1] text-[#111111] sm:text-5xl lg:text-[54px]"
          style={{ perspective: "600px" }}
        >
          {line1Words.map((w, i) => (
            <motion.span key={i} variants={wordVariants} className="mr-[0.3em] inline-block">
              {w}
            </motion.span>
          ))}
          {line2Words.map((w, i) => (
            <motion.span key={`b${i}`} variants={wordVariants} className="mr-[0.3em] inline-block">
              {i === line2Words.length - 1 ? (
                <span className="relative inline-block">
                  <span className="relative z-10">{w}</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={headlineInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ delay: 0.62, duration: 0.52, ease: "easeOut" }}
                    className="absolute bottom-1.5 left-0 right-0 -z-0 h-[14px] origin-left -rotate-1 rounded-sm bg-[#ffd400]"
                    aria-hidden="true"
                  />
                </span>
              ) : w}
            </motion.span>
          ))}
        </motion.h2>

        {/* Sub-copy */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.28, duration: 0.55 }}
          className="mt-5 text-base font-medium leading-relaxed text-[#68645b] sm:text-lg"
        >
          One platform — less coordination, more delivery.
        </motion.p>
      </div>

      {/* ── Bento grid ── */}
      <motion.div
        ref={gridRef}
        variants={containerVariants}
        initial="hidden"
        animate={gridInView ? "show" : "hidden"}
        className="grid gap-3 lg:grid-cols-12"
      >
        {cards.map((card) => {
          const t = themes[card.theme];
          const Icon = card.icon;

          return (
            <motion.div
              key={card.id}
              variants={cardVariants}
              className={`col-span-12 ${card.col}`}
              style={{ perspective: "900px" }}
            >
              <TiltCard
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 ${t.card} cursor-default transition-shadow duration-300 hover:shadow-[0_28px_64px_rgba(17,17,17,0.14)]`}
              >
                {/* Icon + tag row */}
                <div className="flex items-center justify-between">
                  <motion.span
                    whileHover={{ scale: 1.1, rotate: -6 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className={`flex size-9 items-center justify-center rounded-xl ${t.icon}`}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </motion.span>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${t.tag}`}>
                    {card.tag}
                  </span>
                </div>

                {/* Text */}
                <h3 className={`mt-4 text-[17px] font-black leading-snug ${t.title}`}>
                  {card.title}
                </h3>
                <p className={`mt-1.5 text-xs font-medium leading-relaxed ${t.text}`}>
                  {card.text}
                </p>

                {/* CTA */}
                <motion.a
                  href="#project-glance"
                  className={`mt-3.5 inline-flex w-fit items-center gap-1.5 text-xs font-bold ${t.link}`}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                >
                  Learn More
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </motion.a>

                {/* Image */}
                <div className="relative mt-4 h-[148px] overflow-hidden rounded-xl">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${t.imgOpacity}`}
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                  {card.theme === "dark" && (
                    <div className={`absolute inset-0 ${t.gradient}`} aria-hidden="true" />
                  )}
                  {/* Shimmer sweep on hover */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
