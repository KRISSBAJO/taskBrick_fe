"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Workflow } from "lucide-react";
import { motion } from "framer-motion";

const storyCards = [
  {
    id: "delivery-command",
    kind: "quote",
    image: "/product/customer_1.png",
    imageAlt: "Delivery team reviewing project work in a planning room",
    label: "Delivery command",
    quote:
      "TaskBricks gave every request an owner, a deadline, and a visible trail before work moved.",
    highlight: "visible trail",
    author: "Maya Okafor, Head of Delivery Operations",
    className: "w-[88vw] max-w-[720px] bg-[#070707] text-white sm:w-[720px]",
  },
  {
    id: "manufacturing-uptime",
    kind: "metric",
    image: "/product/customer_2.png",
    imageAlt: "Heavy equipment on an active job site",
    label: "Manufacturing",
    metric: "105K",
    caption: "work hours protected from avoidable handoff delays",
    proof: "15 plants running shared sprint, task, and risk workflows",
    className: "w-[88vw] max-w-[720px] bg-[#fff2c4] sm:w-[720px]",
    iconTone: "bg-[#ffd400] text-black",
  },
  {
    id: "field-execution",
    kind: "split",
    image: "/product/customer_3.png",
    imageAlt: "Field operations team coordinating active work",
    label: "Field execution",
    metric: "42%",
    caption: "fewer missed follow-ups across distributed crews",
    proof: "Requests, approvals, dependencies, and blockers stay connected",
    className: "w-[86vw] max-w-[640px] bg-[#eaf5ff] sm:w-[640px]",
    iconTone: "bg-[#0256ff] text-white",
  },
  {
    id: "governance",
    kind: "audit",
    image: "/product/customer_4.png",
    imageAlt: "Team member working through an operations dashboard",
    label: "Governance",
    metric: "99.9%",
    caption: "workspace uptime target for operational teams",
    proof: "Role-based access, audit logs, and status evidence built in",
    className: "w-[84vw] max-w-[560px] bg-[#111111] text-white sm:w-[560px]",
  },
  {
    id: "planning-rhythm",
    kind: "metric",
    image: "/product/customer_6.png",
    imageAlt: "Collaborative planning dashboard on a desktop monitor",
    label: "Planning rhythm",
    metric: "3.8x",
    caption: "faster planning cycles from intake to approved execution",
    proof: "Teams standardize how project work becomes accountable delivery",
    className: "w-[88vw] max-w-[720px] bg-[#e8f7ec] sm:w-[720px]",
    iconTone: "bg-[#0f8a45] text-white",
  },
] as const;

const arrowButtonClass =
  "flex size-12 items-center justify-center rounded-full border border-black/70 bg-white text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:border-black/15 disabled:text-black/25 disabled:hover:bg-white disabled:hover:text-black/25";

export function TestimonialsSection() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const getStoryCards = useCallback(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return [];
    }

    return Array.from(scroller.querySelectorAll<HTMLElement>("[data-story-card]"));
  }, []);

  const updateCarouselState = useCallback(() => {
    const scroller = scrollerRef.current;
    const cards = getStoryCards();

    if (!scroller || cards.length === 0) {
      return;
    }

    const scrollerLeft = scroller.getBoundingClientRect().left;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - scrollerLeft - 20);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;

    setActiveIndex(closestIndex);
    setCanPrev(scroller.scrollLeft > 4);
    setCanNext(scroller.scrollLeft < maxScrollLeft - 4);
  }, [getStoryCards]);

  const scrollToStory = useCallback(
    (index: number) => {
      const scroller = scrollerRef.current;
      const cards = getStoryCards();
      const target = cards[Math.min(Math.max(index, 0), cards.length - 1)];

      if (!scroller || !target) {
        return;
      }

      const scrollerLeft = scroller.getBoundingClientRect().left;
      const targetLeft = target.getBoundingClientRect().left;
      const left = scroller.scrollLeft + targetLeft - scrollerLeft - 20;

      scroller.scrollTo({ left, behavior: "smooth" });
      setActiveIndex(index);
    },
    [getStoryCards],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (!scroller) {
      return;
    }

    updateCarouselState();

    scroller.addEventListener("scroll", updateCarouselState, { passive: true });
    window.addEventListener("resize", updateCarouselState);

    return () => {
      scroller.removeEventListener("scroll", updateCarouselState);
      window.removeEventListener("resize", updateCarouselState);
    };
  }, [updateCarouselState]);

  return (
    <section className="relative overflow-hidden bg-[#fffdf3] py-16 sm:py-20">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42 }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-black uppercase text-[#111111] shadow-sm"
            >
              <span className="size-2 rounded-full bg-[#ffd400]" />
              Proof from active teams
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="mt-5 max-w-[720px] text-[42px] font-black leading-[0.98] text-black sm:text-[56px]"
            >
              Real teams turn messy work into trackable delivery.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.14, duration: 0.45 }}
              className="mt-5 max-w-[640px] text-lg font-semibold leading-8 text-[#68645b]"
            >
              TaskBricks helps operators connect requests, owners, risks, approvals,
              and status evidence in one secure workflow.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.16, duration: 0.45 }}
            className="lg:pb-2"
          >
            <Link
              href="#contact"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-black px-7 text-sm font-black text-black transition hover:bg-black hover:text-white"
            >
              Talk to TaskBricks
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-12 overflow-x-auto scroll-smooth pb-5 tb-scrollbar"
        aria-label="TaskBricks customer outcomes carousel"
      >
        <motion.div
          initial={{ opacity: 0, x: 36 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.62, ease: "easeOut" }}
          className="flex w-max gap-5 px-5 sm:gap-6 sm:px-8 lg:px-[calc((100vw-1400px)/2+64px)]"
        >
          {storyCards.map((card, index) => (
            <StoryCard key={card.id} card={card} index={index} />
          ))}
        </motion.div>
      </div>

      <div className="mx-auto mt-1 flex max-w-[1400px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-16">
        <div className="hidden items-center gap-2 sm:flex" aria-label="Choose customer result">
          {storyCards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              aria-label={`Show ${card.label} result`}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => scrollToStory(index)}
              className={`h-2.5 rounded-full transition ${
                activeIndex === index ? "w-8 bg-black" : "w-2.5 bg-black/25 hover:bg-black/50"
              }`}
            />
          ))}
        </div>

        <p className="text-sm font-bold text-[#68645b]" aria-live="polite">
          {activeIndex + 1} of {storyCards.length}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            aria-label="Previous TaskBricks customer result"
            disabled={!canPrev}
            onClick={() => scrollToStory(activeIndex - 1)}
            className={arrowButtonClass}
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next TaskBricks customer result"
            disabled={!canNext}
            onClick={() => scrollToStory(activeIndex + 1)}
            className={arrowButtonClass}
          >
            <ArrowRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

function StoryCard({ card, index }: { card: (typeof storyCards)[number]; index: number }) {
  if (card.kind === "quote") {
    const [before, after] = card.quote.split(card.highlight);

    return (
      <article
        data-story-card
        className={`${card.className} grid h-[390px] shrink-0 grid-cols-1 overflow-hidden rounded-lg md:grid-cols-[0.92fr_1fr]`}
        aria-label={`${index + 1}. ${card.label}`}
      >
        <div className="flex flex-col justify-between p-7 sm:p-8">
          <div>
            <span className="inline-flex rounded-full bg-[#ffd400] px-3 py-1 text-xs font-black uppercase text-black">
              {card.label}
            </span>
            <p className="mt-8 text-5xl font-black leading-none text-[#ffd400]">&quot;</p>
          </div>
          <div>
            <p className="max-w-[360px] text-2xl font-black leading-[1.22]">
              {before}
              <span className="text-[#ffd400]">{card.highlight}</span>
              {after}
            </p>
            <p className="mt-6 text-sm font-bold text-white/72">- {card.author}</p>
          </div>
        </div>
        <div className="relative hidden overflow-hidden md:block">
          <Image src={card.image} alt={card.imageAlt} fill className="object-cover object-center" sizes="360px" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        </div>
      </article>
    );
  }

  if (card.kind === "split") {
    return (
      <article
        data-story-card
        className={`${card.className} grid h-[390px] shrink-0 grid-cols-1 overflow-hidden rounded-lg border border-black/10 p-3 md:grid-cols-[1fr_0.86fr]`}
        aria-label={`${index + 1}. ${card.label}`}
      >
        <div className="flex flex-col justify-between p-5 sm:p-6">
          <div>
            <span className="inline-flex rounded-md bg-white px-4 py-3 text-sm font-black text-black shadow-sm">
              {card.label}
            </span>
            <p className="mt-12 max-w-[360px] text-5xl font-black leading-none text-black">{card.metric}</p>
            <p className="mt-4 max-w-[360px] text-lg font-black leading-7 text-black">{card.caption}</p>
          </div>
          <div className="mt-6 flex items-start gap-3 text-sm font-bold leading-6 text-[#243447]">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${card.iconTone}`}>
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            <span>{card.proof}</span>
          </div>
        </div>
        <div className="relative hidden overflow-hidden rounded-md md:block">
          <Image src={card.image} alt={card.imageAlt} fill className="object-cover object-center" sizes="280px" />
        </div>
      </article>
    );
  }

  if (card.kind === "audit") {
    return (
      <article
        data-story-card
        className={`${card.className} relative h-[390px] shrink-0 overflow-hidden rounded-lg p-7 sm:p-8`}
        aria-label={`${index + 1}. ${card.label}`}
      >
        <Image src={card.image} alt="" fill className="object-cover object-center opacity-18 mix-blend-luminosity" sizes="560px" />
        <div className="relative z-10 flex h-full flex-col justify-between">
          <div className="flex items-center justify-between gap-5">
            <span className="inline-flex rounded-md bg-white px-4 py-3 text-sm font-black text-black">
              {card.label}
            </span>
            <span className="flex size-11 items-center justify-center rounded-md bg-[#ffd400] text-black">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
          </div>
          <div>
            <p className="text-6xl font-black leading-none text-[#ffd400]">{card.metric}</p>
            <p className="mt-4 max-w-[360px] text-lg font-black leading-7">{card.caption}</p>
            <p className="mt-5 max-w-[390px] text-sm font-bold leading-6 text-white/70">{card.proof}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      data-story-card
      className={`${card.className} grid h-[390px] shrink-0 grid-cols-1 overflow-hidden rounded-lg border border-black/10 p-3 md:grid-cols-[0.72fr_1fr]`}
      aria-label={`${index + 1}. ${card.label}`}
    >
      <div className="flex flex-col justify-between p-5 sm:p-6">
        <div>
          <span className="inline-flex rounded-md bg-white px-4 py-3 text-sm font-black text-black shadow-sm">
            {card.label}
          </span>
          <p className="mt-12 text-6xl font-black leading-none text-black">{card.metric}</p>
          <p className="mt-4 max-w-[340px] text-lg font-black leading-7 text-black">{card.caption}</p>
        </div>
        <div className="mt-6 flex items-start gap-3 text-sm font-bold leading-6 text-[#514b3c]">
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${card.iconTone}`}>
            <CheckCircle2 className="size-5" aria-hidden="true" />
          </span>
          <span>{card.proof}</span>
        </div>
      </div>
      <div className="relative hidden overflow-hidden rounded-md md:block">
        <Image src={card.image} alt={card.imageAlt} fill className="object-cover object-center" sizes="430px" />
      </div>
    </article>
  );
}
