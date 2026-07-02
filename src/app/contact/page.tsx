import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Workflow } from "lucide-react";
import { LandingFooter, LandingNav, MarketingLeadForm } from "@/components/landing";

export const metadata: Metadata = {
  title: "Contact TaskBricks",
  description: "Contact the TaskBricks team for product, sales, implementation, and support questions.",
};

const contactSignals = [
  {
    icon: Mail,
    title: "One place to start",
    copy: "Sales, product, implementation, and partnership questions all begin here — no wrong door.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing gets lost",
    copy: "Every message is recorded the moment you send it, then routed to the right team.",
  },
  {
    icon: Workflow,
    title: "Faster answers",
    copy: "Your message arrives with context, so the right person replies without a round of follow-up questions.",
  },
] as const;

export default function ContactPage() {
  return (
    <main className="min-h-dvh bg-white text-[#111111]">
      <LandingNav />

      <section className="px-5 py-10 sm:px-8 lg:px-16 lg:py-14">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 text-sm font-black text-[#111111] shadow-sm transition hover:border-[#ffd400]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back home
            </Link>

            <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#68645b] shadow-sm">
              <span className="size-2 rounded-full bg-[#ffd400]" />
              Contact
            </p>
            <h1 className="mt-5 max-w-xl text-[44px] font-black leading-[0.98] tracking-tight text-[#111111] sm:text-[58px]">
              Talk to the TaskBricks team.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#5f5a50]">
              Send us product questions, rollout plans, sales requests, or implementation notes.
              Every message is saved and routed to the right team, so you always hear back.
            </p>

            <div className="mt-8 space-y-3">
              {contactSignals.map((item) => (
                <div key={item.title} className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-sm">
                  <div className="flex gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#111111] text-[#ffd400]">
                      <item.icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-[#111111]">{item.title}</h2>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#68645b]">{item.copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/[0.08] bg-white p-4 text-sm font-semibold leading-6 text-[#68645b] shadow-sm">
              Want a product walkthrough instead?
              <Link href="/book-demo" className="ml-1 font-black text-[#111111] underline decoration-[#ffd400] underline-offset-4">
                Book a demo
              </Link>
              .
            </div>
          </div>

          <MarketingLeadForm mode="contact" />
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
